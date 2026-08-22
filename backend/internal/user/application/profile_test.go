package application

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/chawais/deenquest/backend/internal/user/domain"
)

type fakeRepo struct {
	user *domain.User
}

func (f *fakeRepo) Create(_ context.Context, u *domain.User) error { f.user = u; return nil }
func (f *fakeRepo) GetByEmail(_ context.Context, email string) (*domain.User, error) {
	if f.user != nil && f.user.Email == email {
		return f.user, nil
	}
	return nil, nil
}
func (f *fakeRepo) GetByID(_ context.Context, id string) (*domain.User, error) {
	if f.user != nil && f.user.ID == id {
		return f.user, nil
	}
	return nil, nil
}
func (f *fakeRepo) Update(_ context.Context, u *domain.User) error { f.user = u; return nil }
func (f *fakeRepo) Delete(_ context.Context, _ string) error       { f.user = nil; return nil }
func (f *fakeRepo) GetByIdentity(_ context.Context, _, _ string) (*domain.User, error) {
	return nil, nil
}
func (f *fakeRepo) LinkIdentity(_ context.Context, _ string, _ domain.LinkedIdentity) error {
	return nil
}

func newProfileService() (*Service, *fakeRepo) {
	repo := &fakeRepo{user: &domain.User{
		ID:          "u1",
		Email:       "ali@example.com",
		Role:        "USER",
		DisplayName: "Ali",
	}}
	return NewService(repo), repo
}

func TestUpdateProfileChangesTheEditableFields(t *testing.T) {
	svc, repo := newProfileService()

	res, err := svc.UpdateProfile(context.Background(), "u1", &UpdateUserRequest{
		DisplayName: "Ali Rasool",
		Bio:         "Learning every day",
		Title:       "THE TRUTHFUL ONE",
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}

	if res.DisplayName != "Ali Rasool" || res.Bio != "Learning every day" {
		t.Fatalf("editable fields did not stick: %+v", res)
	}
	if repo.user.DisplayName != "Ali Rasool" {
		t.Fatal("change was not persisted")
	}
}

// Email is what the identity provider verified, and sign-in reads it to decide
// the ADMIN role. If a profile update could rewrite it, any account could point
// itself at an allowlisted address and promote itself on the next sign-in.
func TestUpdateProfileCannotChangeEmailOrRole(t *testing.T) {
	svc, repo := newProfileService()

	// The request as it arrives on the wire — a client is free to send extra
	// fields, so the guarantee has to be that they are not decoded at all.
	body := []byte(`{
		"display_name": "Ali",
		"email": "admin@deenquest.online",
		"role": "ADMIN"
	}`)

	var req UpdateUserRequest
	if err := json.Unmarshal(body, &req); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if _, err := svc.UpdateProfile(context.Background(), "u1", &req); err != nil {
		t.Fatalf("update: %v", err)
	}

	if repo.user.Email != "ali@example.com" {
		t.Fatalf("email = %q — a profile update rewrote the verified address", repo.user.Email)
	}
	if repo.user.Role != "USER" {
		t.Fatalf("role = %q — a profile update granted a role", repo.user.Role)
	}
}

func TestUpdateProfileOnAMissingUser(t *testing.T) {
	svc, _ := newProfileService()

	_, err := svc.UpdateProfile(context.Background(), "nobody", &UpdateUserRequest{DisplayName: "X"})
	if err != ErrUserNotFound {
		t.Fatalf("err = %v, want ErrUserNotFound", err)
	}
}
