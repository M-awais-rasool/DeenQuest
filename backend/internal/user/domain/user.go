package domain

import "time"

type User struct {
	ID           string    `bson:"_id" json:"id"`
	Email        string    `bson:"email" json:"email"`
	PasswordHash string    `bson:"password_hash" json:"-"`
	Role         string    `bson:"role" json:"role"`
	DisplayName  string    `bson:"display_name" json:"display_name"`
	AvatarURL    string    `bson:"avatar_url" json:"avatar_url"`
	Bio          string    `bson:"bio" json:"bio"`
	Title        string    `bson:"title" json:"title"`
	IsVerified   bool      `bson:"is_verified" json:"is_verified"`
	IconOverride string    `bson:"icon_override" json:"icon_override"`
	CreatedAt    time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time `bson:"updated_at" json:"updated_at"`
}

var iconOverrides = map[string]struct{}{
	"":            {}, // auto
	"happy":       {},
	"onfire":      {},
	"worried":     {},
	"fading":      {},
	"sleeping":    {},
	"celebrating": {},
}

func NormalizeIconOverride(icon string) (string, bool) {
	if icon == "auto" {
		icon = ""
	}
	if _, ok := iconOverrides[icon]; !ok {
		return "", false
	}
	return icon, true
}
