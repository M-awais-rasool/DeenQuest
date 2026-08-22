package infrastructure

import (
	"context"
	"errors"
	"fmt"

	"google.golang.org/api/idtoken"

	"github.com/chawais/deenquest/backend/internal/auth/domain"
)

var googleIssuers = map[string]struct{}{
	"https://accounts.google.com": {},
	"accounts.google.com":         {},
}

type GoogleVerifier struct {
	audiences map[string]struct{}
}

func NewGoogleVerifier(clientIDs ...string) (*GoogleVerifier, error) {
	audiences := make(map[string]struct{}, len(clientIDs))
	for _, id := range clientIDs {
		if id != "" {
			audiences[id] = struct{}{}
		}
	}
	if len(audiences) == 0 {
		return nil, errors.New("google verifier needs at least one client id")
	}
	return &GoogleVerifier{audiences: audiences}, nil
}

func (v *GoogleVerifier) Verify(ctx context.Context, idToken, nonce string) (*domain.Identity, error) {
	payload, err := idtoken.Validate(ctx, idToken, "")
	if err != nil {
		return nil, fmt.Errorf("validate google id token: %w", err)
	}

	if _, ok := v.audiences[payload.Audience]; !ok {
		return nil, fmt.Errorf("google id token audience %q is not one of ours", payload.Audience)
	}
	if _, ok := googleIssuers[payload.Issuer]; !ok {
		return nil, fmt.Errorf("unexpected google id token issuer %q", payload.Issuer)
	}
	if err := checkNonce(nonce, stringClaim(payload.Claims, "nonce")); err != nil {
		return nil, err
	}

	return &domain.Identity{
		Provider:      domain.ProviderGoogle,
		Subject:       payload.Subject,
		Email:         stringClaim(payload.Claims, "email"),
		EmailVerified: boolClaim(payload.Claims, "email_verified"),
		Name:          stringClaim(payload.Claims, "name"),
		PictureURL:    stringClaim(payload.Claims, "picture"),
	}, nil
}

func stringClaim(claims map[string]interface{}, key string) string {
	v, _ := claims[key].(string)
	return v
}

func boolClaim(claims map[string]interface{}, key string) bool {
	switch v := claims[key].(type) {
	case bool:
		return v
	case string:
		return v == "true"
	default:
		return false
	}
}

func checkNonce(want, got string) error {
	if want == "" {
		return nil
	}
	if got != want {
		return errors.New("id token nonce does not match the sign-in request")
	}
	return nil
}
