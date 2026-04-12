package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/talent-flow/backend/internal/identity-service/model"
	"github.com/chawais/talent-flow/backend/pkg/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	postgresDSN := os.Getenv("POSTGRES_DSN")
	if postgresDSN == "" {
		log.Fatal("POSTGRES_DSN is required")
	}

	sqlDB, err := sql.Open("postgres", postgresDSN)
	if err != nil {
		log.Fatalf("open postgres: %v", err)
	}
	defer sqlDB.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		log.Fatalf("connect mongo: %v", err)
	}
	defer func() { _ = mongoClient.Disconnect(context.Background()) }()

	authUsers := mongoClient.Database(cfg.MongoAuthDB).Collection("users")

	rows, err := sqlDB.QueryContext(ctx, `SELECT id::text, email, password_hash, role, is_verified, created_at, updated_at FROM users`)
	if err != nil {
		log.Fatalf("query users: %v", err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.IsVerified, &u.CreatedAt, &u.UpdatedAt); err != nil {
			log.Fatalf("scan user: %v", err)
		}
		_, err := authUsers.UpdateByID(ctx, u.ID, map[string]interface{}{"$set": u}, options.Update().SetUpsert(true))
		if err != nil {
			log.Fatalf("upsert user %s: %v", u.ID, err)
		}
		count++
	}

	if err := rows.Err(); err != nil {
		log.Fatalf("rows err: %v", err)
	}
	log.Printf("migration complete: %d users migrated", count)
}
