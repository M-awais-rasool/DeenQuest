package notification

import "time"

type UserInfo struct {
	ID    string `bson:"id" json:"id"`
	Email string `bson:"email" json:"email"`
	Role  string `bson:"role,omitempty" json:"role,omitempty"`
}

type UserToken struct {
	ID            string    `bson:"_id" json:"id"`
	User          UserInfo  `bson:"user" json:"user"`
	UserID        string    `bson:"user_id" json:"user_id"`
	ExpoPushToken string    `bson:"expo_push_token" json:"expo_push_token"`
	Platform      string    `bson:"platform" json:"platform"`
	DeviceID      string    `bson:"device_id,omitempty" json:"device_id,omitempty"`
	AppVersion    string    `bson:"app_version,omitempty" json:"app_version,omitempty"`
	Enabled       bool      `bson:"enabled" json:"enabled"`
	LastSeenAt    time.Time `bson:"last_seen_at" json:"last_seen_at"`
	CreatedAt     time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time `bson:"updated_at" json:"updated_at"`
}

type RegisterTokenRequest struct {
	ExpoPushToken string `json:"expo_push_token" validate:"required"`
	Platform      string `json:"platform" validate:"required,oneof=ios android web"`
	DeviceID      string `json:"device_id" validate:"omitempty,max=128"`
	AppVersion    string `json:"app_version" validate:"omitempty,max=64"`
}

type Message struct {
	Title string                 `json:"title"`
	Body  string                 `json:"body"`
	Data  map[string]interface{} `json:"data,omitempty"`
}

type Job struct {
	User    UserInfo `json:"user"`
	Message Message  `json:"message"`
}

type TokenResponse struct {
	User          UserInfo `json:"user"`
	ExpoPushToken string   `json:"expo_push_token"`
	Platform      string   `json:"platform"`
	UpdatedAt     string   `json:"updated_at"`
}
