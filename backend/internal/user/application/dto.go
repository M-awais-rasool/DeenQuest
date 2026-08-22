package application

// UpdateUserRequest is the part of a profile its owner may change.
//
// Email and role are deliberately absent. Email belongs to the identity
// provider — it is what Google verified — and role belongs to ADMIN_EMAILS.
// Both are read at sign-in to decide access, so accepting either here would let
// any account promote itself.
type UpdateUserRequest struct {
	DisplayName string `json:"display_name" validate:"omitempty,min=2,max=50"`
	AvatarURL   string `json:"avatar_url" validate:"omitempty,url,max=512"`
	Bio         string `json:"bio" validate:"omitempty,max=250"`
	Title       string `json:"title" validate:"omitempty,max=50"`
}

type UserProfileResponse struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
	Bio         string `json:"bio"`
	Title       string `json:"title"`
	IsVerified  bool   `json:"is_verified"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type PublicUserResponse struct {
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
	Bio         string `json:"bio"`
	Title       string `json:"title"`
}
