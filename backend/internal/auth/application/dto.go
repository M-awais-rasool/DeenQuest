package application

type OAuthSignInRequest struct {
	IDToken     string `json:"id_token" validate:"required"`
	Nonce       string `json:"nonce"`
	DeviceID    string `json:"device_id"`
	DisplayName string `json:"display_name"`
	UserAgent   string `json:"-"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
	DeviceID     string `json:"device_id"`
	UserAgent    string `json:"-"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type AuthResponse struct {
	User         UserResponse `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int          `json:"expires_in"`
}

type UserResponse struct {
	ID          string   `json:"id"`
	Email       string   `json:"email"`
	Role        string   `json:"role"`
	DisplayName string   `json:"display_name"`
	AvatarURL   string   `json:"avatar_url"`
	Bio         string   `json:"bio"`
	Title       string   `json:"title"`
	IsVerified  bool     `json:"is_verified"`
	Providers   []string `json:"providers"`
}

type SessionResponse struct {
	ID        string `json:"id"`
	DeviceID  string `json:"device_id,omitempty"`
	UserAgent string `json:"user_agent,omitempty"`
	CreatedAt string `json:"created_at"`
	ExpiresAt string `json:"expires_at"`
	Current   bool   `json:"current"`
}
