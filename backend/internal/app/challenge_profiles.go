package app

import (
	"context"

	"golang.org/x/sync/errgroup"

	userapp "github.com/chawais/deenquest/backend/internal/user/application"
)

type challengeProfiles struct {
	users *userapp.Service
}

func (p challengeProfiles) DisplayNames(ctx context.Context, userIDs []string) (map[string]string, error) {
	if len(userIDs) == 0 {
		return map[string]string{}, nil
	}

	names := make([]string, len(userIDs))
	g, gctx := errgroup.WithContext(ctx)
	for i, id := range userIDs {
		i, id := i, id
		g.Go(func() error {
			profile, err := p.users.GetPublicProfile(gctx, id)
			if err != nil {
				return nil
			}
			names[i] = profile.DisplayName
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return nil, err
	}

	out := make(map[string]string, len(userIDs))
	for i, id := range userIDs {
		if names[i] != "" {
			out[id] = names[i]
		}
	}
	return out, nil
}
