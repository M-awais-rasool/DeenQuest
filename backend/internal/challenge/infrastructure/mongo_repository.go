package infrastructure

import (
	"context"
	"errors"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/deenquest/backend/internal/challenge/domain"
)

// MongoRepository is the Mongo-backed domain.Repository.
var _ domain.Repository = (*MongoRepository)(nil)

type MongoRepository struct {
	templates      *mongo.Collection
	userQuests     *mongo.Collection
	duels          *mongo.Collection
	groups         *mongo.Collection
	encouragements *mongo.Collection

	// The quest catalog is small and changes only on seed/redeploy, so it is
	// served from a snapshot instead of a query per activity event.
	catalogMu     sync.RWMutex
	catalog       []domain.QuestTemplate
	catalogLoaded bool
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	r := &MongoRepository{
		templates:      db.Collection("challenge_quests"),
		userQuests:     db.Collection("user_challenge_quests"),
		duels:          db.Collection("challenge_duels"),
		groups:         db.Collection("challenge_groups"),
		encouragements: db.Collection("challenge_encouragements"),
	}
	if err := r.ensureIndexes(); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoRepository) ensureIndexes() error {
	ctx := context.Background()

	indexes := []struct {
		coll  *mongo.Collection
		model mongo.IndexModel
	}{
		// One board per user per week; the unique key also makes the
		// first-open-of-the-week insert safe against a double request.
		{r.userQuests, mongo.IndexModel{
			Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "week_key", Value: 1}, {Key: "template_id", Value: 1}},
			Options: options.Index().SetUnique(true).SetBackground(true).
				SetName("user_week_template_unique"),
		}},
		// Invite codes are the lookup key for joining, and must not collide.
		{r.duels, mongo.IndexModel{
			Keys:    bson.D{{Key: "invite_code", Value: 1}},
			Options: options.Index().SetUnique(true).SetBackground(true).SetName("duel_code_unique"),
		}},
		{r.duels, mongo.IndexModel{
			Keys:    bson.D{{Key: "challenger_id", Value: 1}, {Key: "status", Value: 1}},
			Options: options.Index().SetBackground(true),
		}},
		{r.duels, mongo.IndexModel{
			Keys:    bson.D{{Key: "opponent_id", Value: 1}, {Key: "status", Value: 1}},
			Options: options.Index().SetBackground(true),
		}},
		{r.groups, mongo.IndexModel{
			Keys:    bson.D{{Key: "join_code", Value: 1}},
			Options: options.Index().SetUnique(true).SetBackground(true).SetName("group_code_unique"),
		}},
		{r.groups, mongo.IndexModel{
			Keys:    bson.D{{Key: "members.user_id", Value: 1}},
			Options: options.Index().SetBackground(true),
		}},
		// One encouragement per sender/target/day.
		{r.encouragements, mongo.IndexModel{
			Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "target_id", Value: 1}, {Key: "date", Value: 1}},
			Options: options.Index().SetUnique(true).SetBackground(true).
				SetName("encouragement_daily_unique"),
		}},
	}

	for _, ix := range indexes {
		if _, err := ix.coll.Indexes().CreateOne(ctx, ix.model); err != nil {
			return err
		}
	}
	return nil
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

/* ─────────────────────── quest catalog ─────────────────────── */

func (r *MongoRepository) SeedQuestTemplates(ctx context.Context, templates []domain.QuestTemplate) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	// Insert-if-absent so tuning done in the database survives a restart.
	for _, t := range templates {
		_, err := r.templates.UpdateOne(
			timeoutCtx,
			bson.M{"_id": t.ID},
			bson.M{"$setOnInsert": t},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			return err
		}
	}

	r.catalogMu.Lock()
	r.catalog, r.catalogLoaded = nil, false
	r.catalogMu.Unlock()
	return nil
}

func (r *MongoRepository) ListQuestTemplates(ctx context.Context) ([]domain.QuestTemplate, error) {
	r.catalogMu.RLock()
	if r.catalogLoaded {
		out := r.catalog
		r.catalogMu.RUnlock()
		return out, nil
	}
	r.catalogMu.RUnlock()

	r.catalogMu.Lock()
	defer r.catalogMu.Unlock()
	if r.catalogLoaded {
		return r.catalog, nil
	}

	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.templates.Find(timeoutCtx, bson.M{}, options.Find().SetSort(bson.D{{Key: "_id", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	out := make([]domain.QuestTemplate, 0, 16)
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	r.catalog, r.catalogLoaded = out, true
	return out, nil
}

/* ─────────────────────── weekly quests ─────────────────────── */

func (r *MongoRepository) ListUserQuests(ctx context.Context, userID, weekKey string) ([]domain.UserQuest, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userQuests.Find(timeoutCtx,
		bson.M{"user_id": userID, "week_key": weekKey},
		// Position first, so the board keeps the order it was drawn in. The
		// remaining keys only break ties for documents written before position
		// existed, where it decodes as 0.
		options.Find().SetSort(bson.D{{Key: "position", Value: 1}, {Key: "created_at", Value: 1}, {Key: "_id", Value: 1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	out := make([]domain.UserQuest, 0, domain.WeeklyQuestCount)
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *MongoRepository) InsertUserQuests(ctx context.Context, quests []domain.UserQuest) error {
	if len(quests) == 0 {
		return nil
	}
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	docs := make([]interface{}, 0, len(quests))
	for i := range quests {
		docs = append(docs, quests[i])
	}
	// Unordered so a racing duplicate (same user opening two screens at once)
	// does not abort the rest of the board.
	_, err := r.userQuests.InsertMany(timeoutCtx, docs, options.InsertMany().SetOrdered(false))
	if err != nil && !isDuplicateKey(err) {
		return err
	}
	return nil
}

func (r *MongoRepository) SaveUserQuest(ctx context.Context, quest *domain.UserQuest) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.userQuests.ReplaceOne(timeoutCtx, bson.M{"_id": quest.ID}, quest, options.Replace().SetUpsert(true))
	return err
}

func (r *MongoRepository) SaveUserQuests(ctx context.Context, quests []*domain.UserQuest) error {
	if len(quests) == 0 {
		return nil
	}
	if len(quests) == 1 {
		return r.SaveUserQuest(ctx, quests[0])
	}

	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	models := make([]mongo.WriteModel, 0, len(quests))
	for _, q := range quests {
		models = append(models, mongo.NewReplaceOneModel().
			SetFilter(bson.M{"_id": q.ID}).
			SetReplacement(q).
			SetUpsert(true))
	}

	// Unordered: these quests are independent, so one failing write should not
	// discard the rest of the batch.
	_, err := r.userQuests.BulkWrite(timeoutCtx, models, options.BulkWrite().SetOrdered(false))
	return err
}

/* ─────────────────────────── duels ─────────────────────────── */

func (r *MongoRepository) CreateDuel(ctx context.Context, duel *domain.Duel) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	if _, err := r.duels.InsertOne(timeoutCtx, duel); err != nil {
		if isDuplicateKey(err) {
			return domain.ErrCodeTaken
		}
		return err
	}
	return nil
}

func (r *MongoRepository) SaveDuel(ctx context.Context, duel *domain.Duel) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	res, err := r.duels.ReplaceOne(timeoutCtx, bson.M{"_id": duel.ID}, duel)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return domain.ErrDuelNotFound
	}
	return nil
}

func (r *MongoRepository) GetDuelByCode(ctx context.Context, code string) (*domain.Duel, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var duel domain.Duel
	err := r.duels.FindOne(timeoutCtx, bson.M{"invite_code": code}).Decode(&duel)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &duel, nil
}

func (r *MongoRepository) ListOpenDuelsForUser(ctx context.Context, userID string) ([]domain.Duel, error) {
	return r.findDuels(ctx, bson.M{
		"$or": []bson.M{{"challenger_id": userID}, {"opponent_id": userID}},
		"status": bson.M{"$in": []domain.DuelStatus{
			domain.DuelPending, domain.DuelActive,
		}},
	}, 0)
}

func (r *MongoRepository) ListRecentDuelsForUser(ctx context.Context, userID string, limit int) ([]domain.Duel, error) {
	if limit <= 0 {
		limit = 3
	}
	return r.findDuels(ctx, bson.M{
		"$or":    []bson.M{{"challenger_id": userID}, {"opponent_id": userID}},
		"status": domain.DuelCompleted,
	}, int64(limit))
}

func (r *MongoRepository) findDuels(ctx context.Context, filter bson.M, limit int64) ([]domain.Duel, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "updated_at", Value: -1}})
	if limit > 0 {
		opts.SetLimit(limit)
	}
	cur, err := r.duels.Find(timeoutCtx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	out := make([]domain.Duel, 0, 4)
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

/* ────────────────────── group challenges ────────────────────── */

func (r *MongoRepository) CreateGroup(ctx context.Context, group *domain.GroupChallenge) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	if _, err := r.groups.InsertOne(timeoutCtx, group); err != nil {
		if isDuplicateKey(err) {
			return domain.ErrCodeTaken
		}
		return err
	}
	return nil
}

func (r *MongoRepository) SaveGroup(ctx context.Context, group *domain.GroupChallenge) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	res, err := r.groups.ReplaceOne(timeoutCtx, bson.M{"_id": group.ID}, group)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return domain.ErrGroupNotFound
	}
	return nil
}

func (r *MongoRepository) GetGroupByCode(ctx context.Context, code string) (*domain.GroupChallenge, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var group domain.GroupChallenge
	err := r.groups.FindOne(timeoutCtx, bson.M{"join_code": code}).Decode(&group)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &group, nil
}

func (r *MongoRepository) ListGroupsForUser(ctx context.Context, userID string) ([]domain.GroupChallenge, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.groups.Find(timeoutCtx,
		bson.M{"members.user_id": userID},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	out := make([]domain.GroupChallenge, 0, 4)
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

/* ────────────────────── encouragements ────────────────────── */

func (r *MongoRepository) RecordEncouragement(ctx context.Context, e domain.Encouragement) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	if _, err := r.encouragements.InsertOne(timeoutCtx, e); err != nil {
		if isDuplicateKey(err) {
			return domain.ErrDuplicateEncouragement
		}
		return err
	}
	return nil
}

// isDuplicateKey reports whether err is (or wraps) a Mongo E11000 collision,
// including the bulk-write form returned by InsertMany.
func isDuplicateKey(err error) bool {
	if err == nil {
		return false
	}
	if mongo.IsDuplicateKeyError(err) {
		return true
	}
	var bulkErr mongo.BulkWriteException
	if errors.As(err, &bulkErr) {
		for _, we := range bulkErr.WriteErrors {
			if we.Code == 11000 {
				return true
			}
		}
	}
	return false
}
