package infrastructure

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/deenquest/backend/internal/hifz/domain"
)

const (
	colPlans      = "hifz_plans"
	colEnrollment = "hifz_enrollments"
	colStates     = "hifz_portion_states"
	colSessions   = "hifz_sessions"
	colAttempts   = "hifz_attempts"
	colMistakes   = "hifz_mistakes"
	colSettings   = "hifz_settings"

	// Sessions are ephemeral: long enough to survive a backgrounded app, short
	// enough not to accumulate.
	sessionTTL = 24 * time.Hour
	// Raw attempts back analytics and a future FSRS fit; a year is plenty.
	attemptTTL = 365 * 24 * time.Hour

	// latencySampleSize bounds the AvgLatency scan.
	latencySampleSize = 50
)

type MongoRepository struct {
	plans       *mongo.Collection
	enrollments *mongo.Collection
	states      *mongo.Collection
	sessions    *mongo.Collection
	attempts    *mongo.Collection
	mistakes    *mongo.Collection
	settings    *mongo.Collection
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	r := &MongoRepository{
		plans:       db.Collection(colPlans),
		enrollments: db.Collection(colEnrollment),
		states:      db.Collection(colStates),
		sessions:    db.Collection(colSessions),
		attempts:    db.Collection(colAttempts),
		mistakes:    db.Collection(colMistakes),
		settings:    db.Collection(colSettings),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if _, err := r.plans.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "published", Value: 1}, {Key: "order", Value: 1}},
	}); err != nil {
		return nil, fmt.Errorf("create hifz_plans index: %w", err)
	}

	if _, err := r.enrollments.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "active", Value: 1}},
	}); err != nil {
		return nil, fmt.Errorf("create hifz_enrollments index: %w", err)
	}

	if _, err := r.states.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "plan_id", Value: 1}}},
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "next_review_at", Value: 1}}},
	}); err != nil {
		return nil, fmt.Errorf("create hifz_portion_states indexes: %w", err)
	}

	if _, err := r.sessions.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "portion_id", Value: 1}}},
		{
			Keys:    bson.D{{Key: "created_at", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(int32(sessionTTL.Seconds())),
		},
	}); err != nil {
		return nil, fmt.Errorf("create hifz_sessions indexes: %w", err)
	}

	if _, err := r.attempts.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "created_at", Value: -1}}},
		{Keys: bson.D{{Key: "portion_id", Value: 1}}},
		{
			Keys:    bson.D{{Key: "created_at", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(int32(attemptTTL.Seconds())),
		},
	}); err != nil {
		return nil, fmt.Errorf("create hifz_attempts indexes: %w", err)
	}

	if _, err := r.mistakes.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "miss_count", Value: -1}},
	}); err != nil {
		return nil, fmt.Errorf("create hifz_mistakes index: %w", err)
	}

	return r, nil
}

// ─────────────────────────────────────────────
// Plans
// ─────────────────────────────────────────────

func (r *MongoRepository) ListPlans(ctx context.Context, publishedOnly bool) ([]domain.Plan, error) {
	filter := bson.M{}
	if publishedOnly {
		filter["published"] = true
	}
	cur, err := r.plans.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "order", Value: 1}}))
	if err != nil {
		return nil, fmt.Errorf("list hifz plans: %w", err)
	}
	defer cur.Close(ctx)

	var out []domain.Plan
	if err := cur.All(ctx, &out); err != nil {
		return nil, fmt.Errorf("decode hifz plans: %w", err)
	}
	return out, nil
}

func (r *MongoRepository) GetPlan(ctx context.Context, id string) (*domain.Plan, error) {
	var plan domain.Plan
	err := r.plans.FindOne(ctx, bson.M{"_id": id}).Decode(&plan)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get hifz plan %s: %w", id, err)
	}
	return &plan, nil
}

func (r *MongoRepository) UpsertPlan(ctx context.Context, plan *domain.Plan) error {
	_, err := r.plans.ReplaceOne(ctx, bson.M{"_id": plan.ID}, plan, options.Replace().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("upsert hifz plan %s: %w", plan.ID, err)
	}
	return nil
}

func (r *MongoRepository) DeletePlan(ctx context.Context, id string) error {
	if _, err := r.plans.DeleteOne(ctx, bson.M{"_id": id}); err != nil {
		return fmt.Errorf("delete hifz plan %s: %w", id, err)
	}
	return nil
}

// SeedPlans inserts plans that are missing or carry an older seed version. A
// plan an admin has edited keeps its stored SeedVersion, so it is only replaced
// when the code's seed version genuinely moves past it.
func (r *MongoRepository) SeedPlans(ctx context.Context, plans []domain.Plan) (int, error) {
	inserted := 0
	now := time.Now()

	for i := range plans {
		plan := plans[i]
		existing, err := r.GetPlan(ctx, plan.ID)
		if err != nil {
			return inserted, err
		}
		if existing != nil && existing.SeedVersion >= plan.SeedVersion {
			continue
		}

		plan.UpdatedAt = now
		plan.CreatedAt = now
		if existing != nil {
			plan.CreatedAt = existing.CreatedAt
		}
		if err := r.UpsertPlan(ctx, &plan); err != nil {
			return inserted, err
		}
		inserted++
	}
	return inserted, nil
}

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

func (r *MongoRepository) GetSettings(ctx context.Context) (*domain.Settings, error) {
	var s domain.Settings
	err := r.settings.FindOne(ctx, bson.M{"_id": domain.SettingsDocID()}).Decode(&s)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get hifz settings: %w", err)
	}
	return &s, nil
}

func (r *MongoRepository) SaveSettings(ctx context.Context, s *domain.Settings) error {
	s.ID = domain.SettingsDocID()
	s.UpdatedAt = time.Now()
	_, err := r.settings.ReplaceOne(ctx, bson.M{"_id": s.ID}, s, options.Replace().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("save hifz settings: %w", err)
	}
	return nil
}

// ─────────────────────────────────────────────
// Enrollment
// ─────────────────────────────────────────────

func (r *MongoRepository) ActiveEnrollment(ctx context.Context, userID string) (*domain.Enrollment, error) {
	var e domain.Enrollment
	err := r.enrollments.FindOne(ctx, bson.M{"user_id": userID, "active": true}).Decode(&e)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get active hifz enrollment: %w", err)
	}
	return &e, nil
}

func (r *MongoRepository) ListEnrollments(ctx context.Context, userID string) ([]domain.Enrollment, error) {
	cur, err := r.enrollments.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, fmt.Errorf("list hifz enrollments: %w", err)
	}
	defer cur.Close(ctx)

	var out []domain.Enrollment
	if err := cur.All(ctx, &out); err != nil {
		return nil, fmt.Errorf("decode hifz enrollments: %w", err)
	}
	return out, nil
}

func (r *MongoRepository) SaveEnrollment(ctx context.Context, e *domain.Enrollment) error {
	_, err := r.enrollments.ReplaceOne(ctx, bson.M{"_id": e.ID}, e, options.Replace().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("save hifz enrollment: %w", err)
	}
	return nil
}

func (r *MongoRepository) DeactivateEnrollments(ctx context.Context, userID string) error {
	_, err := r.enrollments.UpdateMany(ctx,
		bson.M{"user_id": userID, "active": true},
		bson.M{"$set": bson.M{"active": false}},
	)
	if err != nil {
		return fmt.Errorf("deactivate hifz enrollments: %w", err)
	}
	return nil
}

// ─────────────────────────────────────────────
// Portion state
// ─────────────────────────────────────────────

func (r *MongoRepository) GetPortionState(ctx context.Context, userID, portionID string) (*domain.PortionState, error) {
	var st domain.PortionState
	err := r.states.FindOne(ctx, bson.M{"_id": domain.PortionStateID(userID, portionID)}).Decode(&st)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get hifz portion state: %w", err)
	}
	return &st, nil
}

func (r *MongoRepository) ListPortionStates(ctx context.Context, userID, planID string) ([]domain.PortionState, error) {
	filter := bson.M{"user_id": userID}
	if planID != "" {
		filter["plan_id"] = planID
	}
	cur, err := r.states.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("list hifz portion states: %w", err)
	}
	defer cur.Close(ctx)

	var out []domain.PortionState
	if err := cur.All(ctx, &out); err != nil {
		return nil, fmt.Errorf("decode hifz portion states: %w", err)
	}
	return out, nil
}

func (r *MongoRepository) SavePortionState(ctx context.Context, st *domain.PortionState) error {
	if st.ID == "" {
		st.ID = domain.PortionStateID(st.UserID, st.PortionID)
	}
	st.UpdatedAt = time.Now()
	_, err := r.states.ReplaceOne(ctx, bson.M{"_id": st.ID}, st, options.Replace().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("save hifz portion state: %w", err)
	}
	return nil
}

func (r *MongoRepository) DeletePortionState(ctx context.Context, userID, portionID string) error {
	_, err := r.states.DeleteOne(ctx, bson.M{"_id": domain.PortionStateID(userID, portionID)})
	if err != nil {
		return fmt.Errorf("delete hifz portion state: %w", err)
	}
	return nil
}

// ─────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────
func (r *MongoRepository) GetSession(ctx context.Context, id string) (*domain.Session, error) {
	var s domain.Session
	err := r.sessions.FindOne(ctx, bson.M{"_id": id}).Decode(&s)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get hifz session: %w", err)
	}
	return &s, nil
}

func (r *MongoRepository) SaveSession(ctx context.Context, s *domain.Session) error {
	s.UpdatedAt = time.Now()
	_, err := r.sessions.ReplaceOne(ctx, bson.M{"_id": s.ID}, s, options.Replace().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("save hifz session: %w", err)
	}
	return nil
}

// ─────────────────────────────────────────────
// Attempts
// ─────────────────────────────────────────────
func (r *MongoRepository) SaveAttempt(ctx context.Context, a *domain.Attempt) error {
	if _, err := r.attempts.InsertOne(ctx, a); err != nil {
		return fmt.Errorf("save hifz attempt: %w", err)
	}
	return nil
}

func (r *MongoRepository) AvgLatency(ctx context.Context, userID string) (int, error) {
	cur, err := r.attempts.Find(ctx,
		bson.M{"user_id": userID, "latency_ms": bson.M{"$gt": 0}},
		options.Find().
			SetSort(bson.D{{Key: "created_at", Value: -1}}).
			SetLimit(latencySampleSize).
			SetProjection(bson.M{"latency_ms": 1}),
	)
	if err != nil {
		return 0, fmt.Errorf("sample hifz latencies: %w", err)
	}
	defer cur.Close(ctx)

	total, n := 0, 0
	for cur.Next(ctx) {
		var row struct {
			LatencyMS int `bson:"latency_ms"`
		}
		if err := cur.Decode(&row); err != nil {
			continue
		}
		total += row.LatencyMS
		n++
	}
	// Below a handful of samples the mean is noise; report "no baseline".
	if n < 5 {
		return 0, nil
	}
	return total / n, nil
}

// ─────────────────────────────────────────────
// Mistakes
// ─────────────────────────────────────────────
func (r *MongoRepository) BumpMistakes(ctx context.Context, mistakes []domain.Mistake) error {
	if len(mistakes) == 0 {
		return nil
	}
	models := make([]mongo.WriteModel, 0, len(mistakes))
	for _, m := range mistakes {
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"_id": m.ID}).
			SetUpdate(bson.M{
				"$inc": bson.M{"miss_count": 1},
				"$set": bson.M{
					"user_id":        m.UserID,
					"surah_id":       m.SurahID,
					"ayah_number":    m.AyahNumber,
					"word_index":     m.WordIndex,
					"word":           m.Word,
					"last_missed_at": m.LastMissedAt,
				},
				"$unset": bson.M{"resolved_at": ""},
			}).
			SetUpsert(true))
	}
	if _, err := r.mistakes.BulkWrite(ctx, models, options.BulkWrite().SetOrdered(false)); err != nil {
		return fmt.Errorf("bump hifz mistakes: %w", err)
	}
	return nil
}

func (r *MongoRepository) ListMistakes(ctx context.Context, userID string, limit int) ([]domain.Mistake, error) {
	cur, err := r.mistakes.Find(ctx,
		bson.M{"user_id": userID, "resolved_at": bson.M{"$exists": false}},
		options.Find().
			SetSort(bson.D{{Key: "miss_count", Value: -1}, {Key: "last_missed_at", Value: -1}}).
			SetLimit(int64(limit)),
	)
	if err != nil {
		return nil, fmt.Errorf("list hifz mistakes: %w", err)
	}
	defer cur.Close(ctx)

	var out []domain.Mistake
	if err := cur.All(ctx, &out); err != nil {
		return nil, fmt.Errorf("decode hifz mistakes: %w", err)
	}
	return out, nil
}

func (r *MongoRepository) CountMistakes(ctx context.Context, userID string) (int, error) {
	n, err := r.mistakes.CountDocuments(ctx,
		bson.M{"user_id": userID, "resolved_at": bson.M{"$exists": false}})
	if err != nil {
		return 0, fmt.Errorf("count hifz mistakes: %w", err)
	}
	return int(n), nil
}

func (r *MongoRepository) ResolveMistake(ctx context.Context, userID, mistakeID string, at time.Time) error {
	_, err := r.mistakes.UpdateOne(ctx,
		bson.M{"_id": mistakeID, "user_id": userID},
		bson.M{"$set": bson.M{"resolved_at": at}},
	)
	if err != nil {
		return fmt.Errorf("resolve hifz mistake: %w", err)
	}
	return nil
}

// ─────────────────────────────────────────────
// Account deletion
// ─────────────────────────────────────────────

func (r *MongoRepository) PurgeUser(ctx context.Context, userID string) error {
	filter := bson.M{"user_id": userID}
	for _, col := range []*mongo.Collection{
		r.enrollments, r.states, r.sessions, r.attempts, r.mistakes,
	} {
		if _, err := col.DeleteMany(ctx, filter); err != nil {
			return fmt.Errorf("purge hifz data for %s: %w", userID, err)
		}
	}
	return nil
}
