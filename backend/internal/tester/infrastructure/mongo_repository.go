package infrastructure

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/deenquest/backend/internal/tester/domain"
)

type MongoRepository struct {
	activity *mongo.Collection
	roster   *mongo.Collection
	users    *mongo.Collection
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	repo := &MongoRepository{
		activity: db.Collection("user_activity_days"),
		roster:   db.Collection("tester_roster"),
		users:    db.Collection("users"),
	}

	// _id is "<user id>|<date>", so the per-user-per-day upsert needs no index
	// of its own. The report reads a date range and joins on user_id.
	_, err := repo.activity.Indexes().CreateMany(context.Background(), []mongo.IndexModel{
		{Keys: bson.D{{Key: "date", Value: 1}}},
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "date", Value: 1}}},
	})
	if err != nil {
		return nil, err
	}
	return repo, nil
}

func (r *MongoRepository) RecordActivity(ctx context.Context, p domain.Ping) error {
	if p.UserID == "" || p.Date == "" {
		return nil
	}

	set := bson.M{
		"user_id":   p.UserID,
		"date":      p.Date,
		"last_seen": p.SeenAt,
	}
	if p.Client != "" {
		set["client"] = p.Client
	}

	_, err := r.activity.UpdateOne(ctx,
		bson.M{"_id": p.UserID + "|" + p.Date},
		bson.M{
			"$set":         set,
			"$setOnInsert": bson.M{"first_seen": p.SeenAt, "created_at": p.SeenAt},
			"$inc":         bson.M{"requests": p.Requests},
		},
		options.Update().SetUpsert(true))
	return err
}

func (r *MongoRepository) Activity(ctx context.Context, from, to string) ([]domain.ActivityDay, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	cur, err := r.activity.Find(ctx,
		bson.M{"date": bson.M{"$gte": from, "$lte": to}},
		options.Find().SetSort(bson.D{{Key: "date", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var days []domain.ActivityDay
	if err := cur.All(ctx, &days); err != nil {
		return nil, err
	}
	return days, nil
}

func (r *MongoRepository) Roster(ctx context.Context) ([]domain.RosterEntry, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	cur, err := r.roster.Find(ctx, bson.M{},
		options.Find().SetSort(bson.D{{Key: "_id", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	entries := []domain.RosterEntry{}
	if err := cur.All(ctx, &entries); err != nil {
		return nil, err
	}
	return entries, nil
}

func (r *MongoRepository) SaveRoster(ctx context.Context, entries []domain.RosterEntry, replace bool) error {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if len(entries) > 0 {
		models := make([]mongo.WriteModel, 0, len(entries))
		for _, e := range entries {
			set := bson.M{}
			if e.Name != "" {
				set["name"] = e.Name
			}
			if e.Note != "" {
				set["note"] = e.Note
			}

			update := bson.M{"$setOnInsert": bson.M{"added_at": e.AddedAt}}
			if len(set) > 0 {
				update["$set"] = set
			}

			models = append(models, mongo.NewUpdateOneModel().
				SetFilter(bson.M{"_id": e.Email}).
				SetUpdate(update).
				SetUpsert(true))
		}
		if _, err := r.roster.BulkWrite(ctx, models, options.BulkWrite().SetOrdered(false)); err != nil {
			return err
		}
	}

	if !replace {
		return nil
	}

	keep := make([]string, 0, len(entries))
	for _, e := range entries {
		keep = append(keep, e.Email)
	}
	_, err := r.roster.DeleteMany(ctx, bson.M{"_id": bson.M{"$nin": keep}})
	return err
}

func (r *MongoRepository) DeleteRoster(ctx context.Context, email string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.roster.DeleteOne(ctx, bson.M{"_id": email})
	return err
}

// Accounts reads the users collection directly. The report needs a name and a
// join date for at most a few dozen people; going through the user module would
// mean a public "fetch these hundred users" method that nothing else wants.
func (r *MongoRepository) Accounts(ctx context.Context, emails, userIDs []string) ([]domain.Account, error) {
	if len(emails) == 0 && len(userIDs) == 0 {
		return nil, nil
	}

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	or := make([]bson.M, 0, 2)
	if len(emails) > 0 {
		or = append(or, bson.M{"email": bson.M{"$in": emails}})
	}
	if len(userIDs) > 0 {
		or = append(or, bson.M{"_id": bson.M{"$in": userIDs}})
	}

	cur, err := r.users.Find(ctx, bson.M{"$or": or},
		options.Find().SetProjection(bson.M{
			"email": 1, "display_name": 1, "created_at": 1,
		}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var accounts []domain.Account
	if err := cur.All(ctx, &accounts); err != nil {
		return nil, err
	}
	return accounts, nil
}
