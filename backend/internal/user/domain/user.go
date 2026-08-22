package domain

import "time"

type User struct {
	ID          string           `bson:"_id" json:"id"`
	Email       string           `bson:"email" json:"email"`
	Role        string           `bson:"role" json:"role"`
	DisplayName string           `bson:"display_name" json:"display_name"`
	AvatarURL   string           `bson:"avatar_url" json:"avatar_url"`
	Bio         string           `bson:"bio" json:"bio"`
	Title       string           `bson:"title" json:"title"`
	IsVerified  bool             `bson:"is_verified" json:"is_verified"`
	Identities  []LinkedIdentity `bson:"identities,omitempty" json:"identities,omitempty"`
	CreatedAt   time.Time        `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time        `bson:"updated_at" json:"updated_at"`
}

type LinkedIdentity struct {
	Provider string    `bson:"provider" json:"provider"`
	Subject  string    `bson:"subject" json:"subject"`
	Email    string    `bson:"email,omitempty" json:"email,omitempty"`
	LinkedAt time.Time `bson:"linked_at" json:"linked_at"`
}

func (u *User) HasIdentity(provider, subject string) bool {
	for _, id := range u.Identities {
		if id.Provider == provider && id.Subject == subject {
			return true
		}
	}
	return false
}
