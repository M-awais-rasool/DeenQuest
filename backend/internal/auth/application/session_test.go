package application

import (
	"context"
	"errors"
	"testing"
	"time"

	authdomain "github.com/chawais/deenquest/backend/internal/auth/domain"
	"github.com/chawais/deenquest/backend/internal/platform/jwt"
	userdomain "github.com/chawais/deenquest/backend/internal/user/domain"
)

// --- in-memory doubles ---------------------------------------------------

type fakeTokenRepo struct {
	byHash map[string]*authdomain.RefreshToken
}

func newFakeTokenRepo() *fakeTokenRepo {
	return &fakeTokenRepo{byHash: map[string]*authdomain.RefreshToken{}}
}

func (f *fakeTokenRepo) Create(_ context.Context, t *authdomain.RefreshToken) error {
	cp := *t
	f.byHash[t.TokenHash] = &cp
	return nil
}

func (f *fakeTokenRepo) Consume(_ context.Context, hash string, at time.Time) (*authdomain.RefreshToken, error) {
	t, ok := f.byHash[hash]
	if !ok || t.UsedAt != nil || t.RevokedAt != nil {
		return nil, nil
	}
	before := *t
	t.UsedAt = &at
	return &before, nil
}

func (f *fakeTokenRepo) GetByHash(_ context.Context, hash string) (*authdomain.RefreshToken, error) {
	t, ok := f.byHash[hash]
	if !ok {
		return nil, nil
	}
	cp := *t
	return &cp, nil
}

func (f *fakeTokenRepo) RevokeFamily(_ context.Context, familyID string, at time.Time) error {
	for _, t := range f.byHash {
		if t.FamilyID == familyID && t.RevokedAt == nil {
			revoked := at
			t.RevokedAt = &revoked
		}
	}
	return nil
}

func (f *fakeTokenRepo) RevokeByID(_ context.Context, userID, id string, at time.Time) error {
	for _, t := range f.byHash {
		if t.ID == id && t.UserID == userID {
			return f.RevokeFamily(context.Background(), t.FamilyID, at)
		}
	}
	return errors.New("not found")
}

func (f *fakeTokenRepo) ListActive(_ context.Context, userID string, now time.Time) ([]authdomain.RefreshToken, error) {
	out := []authdomain.RefreshToken{}
	for _, t := range f.byHash {
		if t.UserID == userID && t.IsActive(now) {
			out = append(out, *t)
		}
	}
	return out, nil
}

type fakeUserRepo struct {
	byID       map[string]*userdomain.User
	byEmail    map[string]*userdomain.User
	byIdentity map[string]*userdomain.User
}

func newFakeUserRepo() *fakeUserRepo {
	return &fakeUserRepo{
		byID:       map[string]*userdomain.User{},
		byEmail:    map[string]*userdomain.User{},
		byIdentity: map[string]*userdomain.User{},
	}
}

func identityKey(provider, subject string) string { return provider + "|" + subject }

func (f *fakeUserRepo) add(u *userdomain.User) {
	f.byID[u.ID] = u
	f.byEmail[u.Email] = u
	for _, id := range u.Identities {
		f.byIdentity[identityKey(id.Provider, id.Subject)] = u
	}
}

func (f *fakeUserRepo) Create(_ context.Context, u *userdomain.User) error {
	f.add(u)
	return nil
}
func (f *fakeUserRepo) GetByEmail(_ context.Context, email string) (*userdomain.User, error) {
	return f.byEmail[email], nil
}
func (f *fakeUserRepo) GetByID(_ context.Context, id string) (*userdomain.User, error) {
	return f.byID[id], nil
}
func (f *fakeUserRepo) Update(_ context.Context, u *userdomain.User) error { f.add(u); return nil }
func (f *fakeUserRepo) Delete(_ context.Context, id string) error {
	delete(f.byID, id)
	return nil
}
func (f *fakeUserRepo) GetByIdentity(_ context.Context, provider, subject string) (*userdomain.User, error) {
	return f.byIdentity[identityKey(provider, subject)], nil
}
func (f *fakeUserRepo) LinkIdentity(_ context.Context, userID string, id userdomain.LinkedIdentity) error {
	u, ok := f.byID[userID]
	if !ok {
		return errors.New("no user")
	}
	if !u.HasIdentity(id.Provider, id.Subject) {
		u.Identities = append(u.Identities, id)
	}
	f.byIdentity[identityKey(id.Provider, id.Subject)] = u
	return nil
}

type stubVerifier struct {
	identity *authdomain.Identity
	err      error
}

func (s stubVerifier) Verify(_ context.Context, _, _ string) (*authdomain.Identity, error) {
	if s.err != nil {
		return nil, s.err
	}
	cp := *s.identity
	return &cp, nil
}

// --- helpers -------------------------------------------------------------

func newTestService(t *testing.T, identity *authdomain.Identity, adminEmails ...string) (*Service, *fakeUserRepo, *fakeTokenRepo) {
	t.Helper()
	users := newFakeUserRepo()
	tokens := newFakeTokenRepo()
	svc := NewService(
		users,
		tokens,
		jwt.NewJWTManager("test-secret", 15*time.Minute),
		map[string]authdomain.Verifier{
			authdomain.ProviderGoogle: stubVerifier{identity: identity},
		},
		Options{RefreshTTL: 60 * 24 * time.Hour, AdminEmails: adminEmails},
	)
	return svc, users, tokens
}

func googleIdentity() *authdomain.Identity {
	return &authdomain.Identity{
		Provider:      authdomain.ProviderGoogle,
		Subject:       "google-sub-1",
		Email:         "ali@example.com",
		EmailVerified: true,
		Name:          "Ali",
		PictureURL:    "https://lh3.googleusercontent.com/ali",
	}
}

func signIn(t *testing.T, svc *Service) *AuthResponse {
	t.Helper()
	res, err := svc.SignInWithProvider(context.Background(), authdomain.ProviderGoogle, &OAuthSignInRequest{
		IDToken:  "stub",
		DeviceID: "device-1",
	})
	if err != nil {
		t.Fatalf("sign in: %v", err)
	}
	return res
}

// --- tests ---------------------------------------------------------------

func TestSignInCreatesUserAndSession(t *testing.T) {
	svc, users, _ := newTestService(t, googleIdentity())

	res := signIn(t, svc)

	if res.AccessToken == "" || res.RefreshToken == "" {
		t.Fatal("expected both tokens to be issued")
	}
	if res.ExpiresIn != 900 {
		t.Fatalf("expires_in = %d, want 900", res.ExpiresIn)
	}
	if res.User.Role != "USER" {
		t.Fatalf("role = %q, want USER", res.User.Role)
	}
	if got := len(users.byID); got != 1 {
		t.Fatalf("created %d users, want 1", got)
	}
}

func TestSignInIsIdempotentForAKnownIdentity(t *testing.T) {
	svc, users, _ := newTestService(t, googleIdentity())

	signIn(t, svc)
	signIn(t, svc)

	if got := len(users.byID); got != 1 {
		t.Fatalf("created %d users across two sign-ins, want 1", got)
	}
}

func TestSignInLinksAVerifiedEmailToTheExistingAccount(t *testing.T) {
	svc, users, _ := newTestService(t, googleIdentity())
	users.add(&userdomain.User{ID: "legacy-1", Email: "ali@example.com", Role: "USER"})

	res := signIn(t, svc)

	if res.User.ID != "legacy-1" {
		t.Fatalf("signed into %q, want the existing legacy-1 account", res.User.ID)
	}
	if !users.byID["legacy-1"].HasIdentity(authdomain.ProviderGoogle, "google-sub-1") {
		t.Fatal("expected the google identity to be linked to the existing account")
	}
}

// An unverified address must never be trusted for linking: anyone could type
// someone else's email at the provider and inherit their account.
func TestSignInRefusesToLinkAnUnverifiedEmail(t *testing.T) {
	identity := googleIdentity()
	identity.EmailVerified = false

	svc, users, _ := newTestService(t, identity)
	users.add(&userdomain.User{ID: "legacy-1", Email: "ali@example.com", Role: "USER"})

	res := signIn(t, svc)

	if res.User.ID == "legacy-1" {
		t.Fatal("unverified email was linked to the existing account")
	}
	if got := len(users.byID); got != 2 {
		t.Fatalf("have %d users, want the legacy account plus a separate new one", got)
	}
}

func TestSignInStoresTheProviderPicture(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity())

	if got := signIn(t, svc).User.AvatarURL; got != "https://lh3.googleusercontent.com/ali" {
		t.Fatalf("avatar = %q, want the picture from the id token", got)
	}
}

// An account that predates social sign-in has no picture, so linking should
// fill one in rather than leave the profile blank.
func TestSignInBackfillsAMissingPicture(t *testing.T) {
	svc, users, _ := newTestService(t, googleIdentity())
	users.add(&userdomain.User{ID: "legacy-1", Email: "ali@example.com", Role: "USER"})

	res := signIn(t, svc)

	if res.User.ID != "legacy-1" {
		t.Fatalf("signed into %q, want legacy-1", res.User.ID)
	}
	if got := users.byID["legacy-1"].AvatarURL; got != "https://lh3.googleusercontent.com/ali" {
		t.Fatalf("avatar = %q, want it backfilled from the provider", got)
	}
}

// Once someone picks their own avatar it is theirs; signing in again must not
// quietly swap it back to the Google one.
func TestSignInKeepsAnAvatarTheUserChose(t *testing.T) {
	svc, users, _ := newTestService(t, googleIdentity())
	users.add(&userdomain.User{
		ID:        "legacy-1",
		Email:     "ali@example.com",
		Role:      "USER",
		AvatarURL: "https://example.com/my-own.png",
	})

	signIn(t, svc)

	if got := users.byID["legacy-1"].AvatarURL; got != "https://example.com/my-own.png" {
		t.Fatalf("avatar = %q, want the user's own to survive", got)
	}
}

func TestSignInGrantsAdminOnlyToAllowlistedEmails(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity(), "ali@example.com")
	if got := signIn(t, svc).User.Role; got != "ADMIN" {
		t.Fatalf("role = %q, want ADMIN for an allowlisted address", got)
	}

	other, _, _ := newTestService(t, googleIdentity(), "someone-else@example.com")
	if got := signIn(t, other).User.Role; got != "USER" {
		t.Fatalf("role = %q, want USER for a non-allowlisted address", got)
	}
}

func TestSignInWithAnUnconfiguredProviderIsRejected(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity())

	_, err := svc.SignInWithProvider(context.Background(), authdomain.ProviderApple, &OAuthSignInRequest{IDToken: "stub"})
	if !errors.Is(err, ErrProviderUnavailable) {
		t.Fatalf("err = %v, want ErrProviderUnavailable", err)
	}
}

func TestRefreshRotatesTheToken(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity())
	session := signIn(t, svc)

	rotated, err := svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: session.RefreshToken})
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}
	if rotated.RefreshToken == session.RefreshToken {
		t.Fatal("refresh returned the same token; it must rotate")
	}
	if rotated.AccessToken == "" {
		t.Fatal("expected a fresh access token")
	}
}

func TestRefreshKeepsTheDeviceInOneFamily(t *testing.T) {
	svc, _, tokens := newTestService(t, googleIdentity())
	session := signIn(t, svc)

	rotated, err := svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: session.RefreshToken})
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}

	first, _ := tokens.GetByHash(context.Background(), hashToken(session.RefreshToken))
	second, _ := tokens.GetByHash(context.Background(), hashToken(rotated.RefreshToken))
	if first.FamilyID != second.FamilyID {
		t.Fatalf("family changed on refresh: %q → %q", first.FamilyID, second.FamilyID)
	}
}

// Replaying a spent token is the signature of a leak, so the whole chain — the
// attacker's copy and the real device's — has to die.
func TestReplayingASpentTokenRevokesTheWholeFamily(t *testing.T) {
	svc, _, tokens := newTestService(t, googleIdentity())
	session := signIn(t, svc)

	rotated, err := svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: session.RefreshToken})
	if err != nil {
		t.Fatalf("first refresh: %v", err)
	}

	_, err = svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: session.RefreshToken})
	if !errors.Is(err, ErrTokenReuse) {
		t.Fatalf("err = %v, want ErrTokenReuse", err)
	}

	// The token minted by the legitimate refresh must be dead too.
	if _, err := svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: rotated.RefreshToken}); err == nil {
		t.Fatal("the rotated token still works; the family was not revoked")
	}

	live, _ := tokens.ListActive(context.Background(), session.User.ID, time.Now().UTC())
	if len(live) != 0 {
		t.Fatalf("%d sessions still active after reuse detection, want 0", len(live))
	}
}

func TestRefreshWithAnUnknownTokenIsRejected(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity())

	_, err := svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: "not-a-real-token"})
	if !errors.Is(err, ErrInvalidRefreshToken) {
		t.Fatalf("err = %v, want ErrInvalidRefreshToken", err)
	}
}

func TestLogoutEndsTheSession(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity())
	session := signIn(t, svc)

	if err := svc.Logout(context.Background(), session.RefreshToken); err != nil {
		t.Fatalf("logout: %v", err)
	}
	if _, err := svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: session.RefreshToken}); err == nil {
		t.Fatal("refresh still works after logout")
	}
}

func TestLogoutIsIdempotent(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity())

	if err := svc.Logout(context.Background(), "never-existed"); err != nil {
		t.Fatalf("logout of an unknown token should be a no-op, got %v", err)
	}
}

func TestListSessionsMarksTheCallersOwnDevice(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity())
	first := signIn(t, svc)
	signIn(t, svc) // a second device for the same account

	sessions, err := svc.ListSessions(context.Background(), first.User.ID, first.RefreshToken)
	if err != nil {
		t.Fatalf("list sessions: %v", err)
	}
	if len(sessions) != 2 {
		t.Fatalf("got %d sessions, want 2", len(sessions))
	}

	current := 0
	for _, s := range sessions {
		if s.Current {
			current++
		}
	}
	if current != 1 {
		t.Fatalf("%d sessions marked current, want exactly 1", current)
	}
}

func TestRevokeSessionSignsOutThatDeviceOnly(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity())
	keep := signIn(t, svc)
	drop := signIn(t, svc)

	sessions, _ := svc.ListSessions(context.Background(), keep.User.ID, drop.RefreshToken)
	var dropID string
	for _, s := range sessions {
		if s.Current {
			dropID = s.ID
		}
	}

	if err := svc.RevokeSession(context.Background(), keep.User.ID, dropID); err != nil {
		t.Fatalf("revoke session: %v", err)
	}
	if _, err := svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: drop.RefreshToken}); err == nil {
		t.Fatal("the revoked device can still refresh")
	}
	if _, err := svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: keep.RefreshToken}); err != nil {
		t.Fatalf("the other device was signed out too: %v", err)
	}
}

func TestRevokeSessionCannotTouchAnotherUsersDevice(t *testing.T) {
	svc, _, _ := newTestService(t, googleIdentity())
	victim := signIn(t, svc)

	sessions, _ := svc.ListSessions(context.Background(), victim.User.ID, victim.RefreshToken)

	err := svc.RevokeSession(context.Background(), "someone-else", sessions[0].ID)
	if !errors.Is(err, ErrSessionNotFound) {
		t.Fatalf("err = %v, want ErrSessionNotFound", err)
	}
	if _, err := svc.Refresh(context.Background(), &RefreshRequest{RefreshToken: victim.RefreshToken}); err != nil {
		t.Fatalf("victim's session was revoked by another user: %v", err)
	}
}

func TestAccessTokenCarriesAnExpiry(t *testing.T) {
	manager := jwt.NewJWTManager("test-secret", time.Minute)

	token, err := manager.GenerateAccessToken("u1", "ali@example.com", "USER")
	if err != nil {
		t.Fatalf("generate: %v", err)
	}

	claims, err := manager.ValidateToken(token)
	if err != nil {
		t.Fatalf("validate: %v", err)
	}
	if claims.ExpiresAt == nil {
		t.Fatal("access token has no expiry")
	}
	if got := time.Until(claims.ExpiresAt.Time); got > time.Minute+time.Second {
		t.Fatalf("expiry is %v away, want ~1m", got)
	}
}

func TestExpiredAccessTokenIsRejected(t *testing.T) {
	manager := jwt.NewJWTManager("test-secret", time.Millisecond)

	token, err := manager.GenerateAccessToken("u1", "ali@example.com", "USER")
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	time.Sleep(20 * time.Millisecond)

	if _, err := manager.ValidateToken(token); !errors.Is(err, jwt.ErrExpiredToken) {
		t.Fatalf("err = %v, want ErrExpiredToken", err)
	}
}

// A missing or nonsensical TTL must fall back to a short one rather than to
// "never expires", which is what the old manager silently did.
func TestZeroTTLFallsBackToTheDefault(t *testing.T) {
	manager := jwt.NewJWTManager("test-secret", 0)

	if got := manager.AccessTTL(); got != 15*time.Minute {
		t.Fatalf("AccessTTL() = %v, want 15m", got)
	}
}
