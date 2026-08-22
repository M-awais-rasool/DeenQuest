package infrastructure

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"

	"github.com/chawais/deenquest/backend/internal/auth/domain"
)

const appleIssuer = "https://appleid.apple.com"

type AppleVerifier struct {
	audiences map[string]struct{}

	mu       sync.Mutex
	verifier *oidc.IDTokenVerifier
}

func NewAppleVerifier(clientIDs ...string) (*AppleVerifier, error) {
	audiences := make(map[string]struct{}, len(clientIDs))
	for _, id := range clientIDs {
		if id != "" {
			audiences[id] = struct{}{}
		}
	}
	if len(audiences) == 0 {
		return nil, errors.New("apple verifier needs at least one client id")
	}
	return &AppleVerifier{audiences: audiences}, nil
}

func (v *AppleVerifier) Verify(ctx context.Context, idToken, nonce string) (*domain.Identity, error) {
	verifier, err := v.idTokenVerifier()
	if err != nil {
		return nil, err
	}

	token, err := verifier.Verify(ctx, idToken)
	if err != nil {
		return nil, fmt.Errorf("validate apple id token: %w", err)
	}

	if !v.audienceAllowed(token.Audience) {
		return nil, fmt.Errorf("apple id token audience %v is not one of ours", token.Audience)
	}

	var claims struct {
		Email         string `json:"email"`
		EmailVerified any    `json:"email_verified"`
		Nonce         string `json:"nonce"`
	}
	if err := token.Claims(&claims); err != nil {
		return nil, fmt.Errorf("read apple id token claims: %w", err)
	}
	if err := checkNonce(nonce, claims.Nonce); err != nil {
		return nil, err
	}

	return &domain.Identity{
		Provider:      domain.ProviderApple,
		Subject:       token.Subject,
		Email:         claims.Email,
		EmailVerified: claims.EmailVerified == true || claims.EmailVerified == "true",
	}, nil
}

func (v *AppleVerifier) audienceAllowed(aud []string) bool {
	for _, a := range aud {
		if _, ok := v.audiences[a]; ok {
			return true
		}
	}
	return false
}

func (v *AppleVerifier) idTokenVerifier() (*oidc.IDTokenVerifier, error) {
	v.mu.Lock()
	defer v.mu.Unlock()

	if v.verifier != nil {
		return v.verifier, nil
	}

	ctx := oidc.ClientContext(context.Background(), &http.Client{Timeout: 10 * time.Second})
	provider, err := oidc.NewProvider(ctx, appleIssuer)
	if err != nil {
		return nil, fmt.Errorf("discover apple oidc config: %w", err)
	}

	v.verifier = provider.Verifier(&oidc.Config{SkipClientIDCheck: true})
	return v.verifier, nil
}
