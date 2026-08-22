package application

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/chawais/deenquest/backend/internal/auth/domain"
	"github.com/chawais/deenquest/backend/internal/platform/jwt"
	userdomain "github.com/chawais/deenquest/backend/internal/user/domain"
)

var (
	ErrUserNotFound        = errors.New("user not found")
	ErrProviderUnavailable = errors.New("sign-in provider is not configured")
	ErrInvalidIDToken      = errors.New("invalid id token")
	ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")
	ErrTokenReuse          = errors.New("refresh token reuse detected")
	ErrSessionNotFound     = errors.New("session not found")
)

const defaultRefreshTTL = 60 * 24 * time.Hour

type Options struct {
	RefreshTTL  time.Duration
	AdminEmails []string
}

type Service struct {
	users       userdomain.Repository
	tokens      domain.RefreshTokenRepository
	jwtManager  *jwt.JWTManager
	verifiers   map[string]domain.Verifier
	refreshTTL  time.Duration
	adminEmails map[string]struct{}
}

func NewService(
	users userdomain.Repository,
	tokens domain.RefreshTokenRepository,
	jwtManager *jwt.JWTManager,
	verifiers map[string]domain.Verifier,
	opts Options,
) *Service {
	refreshTTL := opts.RefreshTTL
	if refreshTTL <= 0 {
		refreshTTL = defaultRefreshTTL
	}

	admins := make(map[string]struct{}, len(opts.AdminEmails))
	for _, e := range opts.AdminEmails {
		if v := strings.ToLower(strings.TrimSpace(e)); v != "" {
			admins[v] = struct{}{}
		}
	}

	if verifiers == nil {
		verifiers = map[string]domain.Verifier{}
	}

	return &Service{
		users:       users,
		tokens:      tokens,
		jwtManager:  jwtManager,
		verifiers:   verifiers,
		refreshTTL:  refreshTTL,
		adminEmails: admins,
	}
}

func (s *Service) Providers() []string {
	out := make([]string, 0, len(s.verifiers))
	for name := range s.verifiers {
		out = append(out, name)
	}
	return out
}

func (s *Service) SignInWithProvider(ctx context.Context, provider string, req *OAuthSignInRequest) (*AuthResponse, error) {
	verifier, ok := s.verifiers[provider]
	if !ok || verifier == nil {
		return nil, ErrProviderUnavailable
	}

	identity, err := verifier.Verify(ctx, req.IDToken, req.Nonce)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidIDToken, err)
	}
	if identity.Subject == "" {
		return nil, fmt.Errorf("%w: token carries no subject", ErrInvalidIDToken)
	}

	now := time.Now().UTC()
	u, err := s.resolveUser(ctx, identity, req.DisplayName, now)
	if err != nil {
		return nil, err
	}

	if err := s.syncAccount(ctx, u, identity, now); err != nil {
		return nil, err
	}

	return s.issueSession(ctx, u, "", req.DeviceID, req.UserAgent, now)
}

func (s *Service) resolveUser(
	ctx context.Context,
	identity *domain.Identity,
	displayName string,
	now time.Time,
) (*userdomain.User, error) {
	u, err := s.users.GetByIdentity(ctx, identity.Provider, identity.Subject)
	if err != nil {
		return nil, fmt.Errorf("lookup identity: %w", err)
	}
	if u != nil {
		return u, nil
	}

	email := strings.ToLower(strings.TrimSpace(identity.Email))
	link := userdomain.LinkedIdentity{
		Provider: identity.Provider,
		Subject:  identity.Subject,
		Email:    email,
		LinkedAt: now,
	}

	if email != "" && identity.EmailVerified {
		existing, err := s.users.GetByEmail(ctx, email)
		if err != nil {
			return nil, fmt.Errorf("lookup email: %w", err)
		}
		if existing != nil {
			if err := s.users.LinkIdentity(ctx, existing.ID, link); err != nil {
				return nil, fmt.Errorf("link identity: %w", err)
			}
			existing.Identities = append(existing.Identities, link)
			return existing, nil
		}
	}

	if email == "" {
		return nil, fmt.Errorf("%w: token carries no email", ErrInvalidIDToken)
	}

	name := strings.TrimSpace(displayName)
	if name == "" {
		name = strings.TrimSpace(identity.Name)
	}
	if name == "" {
		name, _, _ = strings.Cut(email, "@")
	}

	newUser := &userdomain.User{
		ID:          uuid.NewString(),
		Email:       email,
		Role:        "USER",
		DisplayName: name,
		AvatarURL:   identity.PictureURL,
		IsVerified:  identity.EmailVerified,
		Identities:  []userdomain.LinkedIdentity{link},
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := s.users.Create(ctx, newUser); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return newUser, nil
}

// syncAccount reconciles the parts of an account that the provider and the
// config own, rather than the user.
func (s *Service) syncAccount(
	ctx context.Context,
	u *userdomain.User,
	identity *domain.Identity,
	now time.Time,
) error {
	changed := false

	wantRole := "USER"
	if _, isAdmin := s.adminEmails[strings.ToLower(u.Email)]; isAdmin {
		wantRole = "ADMIN"
	}
	if u.Role != wantRole {
		u.Role = wantRole
		changed = true
	}

	if u.AvatarURL == "" && identity.PictureURL != "" {
		u.AvatarURL = identity.PictureURL
		changed = true
	}

	if !changed {
		return nil
	}

	u.UpdatedAt = now
	if err := s.users.Update(ctx, u); err != nil {
		return fmt.Errorf("sync account: %w", err)
	}
	return nil
}

func (s *Service) Refresh(ctx context.Context, req *RefreshRequest) (*AuthResponse, error) {
	now := time.Now().UTC()
	hash := hashToken(req.RefreshToken)

	token, err := s.tokens.Consume(ctx, hash, now)
	if err != nil {
		return nil, fmt.Errorf("consume refresh token: %w", err)
	}

	if token == nil {
		prior, err := s.tokens.GetByHash(ctx, hash)
		if err != nil {
			return nil, fmt.Errorf("lookup refresh token: %w", err)
		}
		if prior != nil && prior.UsedAt != nil && prior.RevokedAt == nil {
			if err := s.tokens.RevokeFamily(ctx, prior.FamilyID, now); err != nil {
				return nil, fmt.Errorf("revoke token family: %w", err)
			}
			return nil, ErrTokenReuse
		}
		return nil, ErrInvalidRefreshToken
	}

	if now.After(token.ExpiresAt) {
		return nil, ErrInvalidRefreshToken
	}

	u, err := s.users.GetByID(ctx, token.UserID)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	if u == nil {
		return nil, ErrUserNotFound
	}

	deviceID := req.DeviceID
	if deviceID == "" {
		deviceID = token.DeviceID
	}

	return s.issueSession(ctx, u, token.FamilyID, deviceID, req.UserAgent, now)
}

func (s *Service) Logout(ctx context.Context, rawToken string) error {
	now := time.Now().UTC()

	token, err := s.tokens.GetByHash(ctx, hashToken(rawToken))
	if err != nil {
		return fmt.Errorf("lookup refresh token: %w", err)
	}
	if token == nil {
		return nil
	}
	if err := s.tokens.RevokeFamily(ctx, token.FamilyID, now); err != nil {
		return fmt.Errorf("revoke token family: %w", err)
	}
	return nil
}

func (s *Service) ListSessions(ctx context.Context, userID, currentRefreshToken string) ([]SessionResponse, error) {
	now := time.Now().UTC()

	tokens, err := s.tokens.ListActive(ctx, userID, now)
	if err != nil {
		return nil, fmt.Errorf("list sessions: %w", err)
	}

	currentHash := ""
	if currentRefreshToken != "" {
		currentHash = hashToken(currentRefreshToken)
	}

	out := make([]SessionResponse, 0, len(tokens))
	for i := range tokens {
		t := &tokens[i]
		out = append(out, SessionResponse{
			ID:        t.ID,
			DeviceID:  t.DeviceID,
			UserAgent: t.UserAgent,
			CreatedAt: t.CreatedAt.Format(time.RFC3339),
			ExpiresAt: t.ExpiresAt.Format(time.RFC3339),
			Current:   currentHash != "" && t.TokenHash == currentHash,
		})
	}
	return out, nil
}

func (s *Service) RevokeSession(ctx context.Context, userID, sessionID string) error {
	if err := s.tokens.RevokeByID(ctx, userID, sessionID, time.Now().UTC()); err != nil {
		return ErrSessionNotFound
	}
	return nil
}

func (s *Service) issueSession(
	ctx context.Context,
	u *userdomain.User,
	familyID, deviceID, userAgent string,
	now time.Time,
) (*AuthResponse, error) {
	accessToken, err := s.jwtManager.GenerateAccessToken(u.ID, u.Email, u.Role)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	raw, err := newOpaqueToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	if familyID == "" {
		familyID = uuid.NewString()
	}

	record := &domain.RefreshToken{
		ID:        uuid.NewString(),
		UserID:    u.ID,
		TokenHash: hashToken(raw),
		FamilyID:  familyID,
		DeviceID:  deviceID,
		UserAgent: truncate(userAgent, 256),
		CreatedAt: now,
		ExpiresAt: now.Add(s.refreshTTL),
	}
	if err := s.tokens.Create(ctx, record); err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	return &AuthResponse{
		User:         toUserResponse(u),
		AccessToken:  accessToken,
		RefreshToken: raw,
		ExpiresIn:    int(s.jwtManager.AccessTTL().Seconds()),
	}, nil
}

func newOpaqueToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max]
}

func toUserResponse(u *userdomain.User) UserResponse {
	providers := make([]string, 0, len(u.Identities))
	for _, id := range u.Identities {
		providers = append(providers, id.Provider)
	}

	return UserResponse{
		ID:          u.ID,
		Email:       u.Email,
		Role:        u.Role,
		DisplayName: u.DisplayName,
		AvatarURL:   u.AvatarURL,
		Bio:         u.Bio,
		Title:       u.Title,
		IsVerified:  u.IsVerified,
		Providers:   providers,
	}
}
