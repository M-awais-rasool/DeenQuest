package dto

type UpdateUserRequest struct {
	Email       string `json:"email" validate:"omitempty,email"`
	DisplayName string `json:"display_name" validate:"omitempty,min=2,max=50"`
	AvatarURL   string `json:"avatar_url" validate:"omitempty,url,max=512"`
	Bio         string `json:"bio" validate:"omitempty,max=250"`
	Title       string `json:"title" validate:"omitempty,max=50"`
	Role        string `json:"role" validate:"omitempty,oneof=USER ADMIN"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8,max=128"`
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
