package domain

import "context"

const (
	ProviderGoogle = "google"
	ProviderApple  = "apple"
)

type Identity struct {
	Provider      string
	Subject       string
	Email         string
	EmailVerified bool
	Name          string
	PictureURL    string
}

type Verifier interface {
	Verify(ctx context.Context, idToken, nonce string) (*Identity, error)
}
