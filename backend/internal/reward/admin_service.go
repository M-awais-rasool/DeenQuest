package reward

import (
	"context"
	"errors"
	"regexp"
	"strings"
)

func (s *Service) AdminList(ctx context.Context) ([]Reward, error) {
	return s.repo.ListAllRewards(ctx)
}

func (s *Service) AdminGet(ctx context.Context, id string) (*Reward, error) {
	rw, err := s.repo.GetRewardByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if rw == nil {
		return nil, ErrRewardNotFound
	}
	return rw, nil
}

func (s *Service) AdminCreate(ctx context.Context, in *Reward) (*Reward, error) {
	if in == nil || strings.TrimSpace(in.Title) == "" {
		return nil, errors.New("title is required")
	}
	if in.ID == "" {
		in.ID = slugify(in.Title)
	}
	if in.ID == "" {
		return nil, errors.New("reward id or title is required")
	}
	if existing, _ := s.repo.GetRewardByID(ctx, in.ID); existing != nil {
		return nil, errors.New("a reward with this id already exists")
	}
	if err := s.repo.CreateReward(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *Service) AdminUpdate(ctx context.Context, id string, in *Reward) (*Reward, error) {
	if in == nil || strings.TrimSpace(in.Title) == "" {
		return nil, errors.New("title is required")
	}
	in.ID = id
	if err := s.repo.UpdateReward(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *Service) AdminDelete(ctx context.Context, id string) error {
	return s.repo.DeleteReward(ctx, id)
}

var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = slugRe.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}
