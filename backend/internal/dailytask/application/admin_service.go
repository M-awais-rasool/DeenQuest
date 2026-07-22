package application

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/chawais/deenquest/backend/internal/dailytask/domain"
)

var ErrTaskNotFound = errors.New("task not found")

func (s *Service) AdminList(ctx context.Context) ([]domain.DailyTask, error) {
	return s.repo.ListAllDailyTasks(ctx)
}

func (s *Service) AdminGet(ctx context.Context, id string) (*domain.DailyTask, error) {
	task, err := s.repo.GetDailyTaskByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, ErrTaskNotFound
	}
	return task, nil
}

func (s *Service) AdminCreate(ctx context.Context, in *domain.DailyTask) (*domain.DailyTask, error) {
	if err := validateTask(in); err != nil {
		return nil, err
	}
	if in.ID == "" {
		in.ID = slugify(in.Title)
	}
	if in.ID == "" {
		return nil, errors.New("task id or title is required")
	}
	if in.CompletionType == "" {
		in.CompletionType = domain.CompletionButton
	}
	if existing, _ := s.repo.GetDailyTaskByID(ctx, in.ID); existing != nil {
		return nil, errors.New("a task with this id already exists")
	}
	if err := s.repo.CreateDailyTask(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *Service) AdminUpdate(ctx context.Context, id string, in *domain.DailyTask) (*domain.DailyTask, error) {
	if err := validateTask(in); err != nil {
		return nil, err
	}
	in.ID = id
	if in.CompletionType == "" {
		in.CompletionType = domain.CompletionButton
	}
	if err := s.repo.UpdateDailyTask(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *Service) AdminDelete(ctx context.Context, id string) error {
	return s.repo.DeleteDailyTask(ctx, id)
}

func validateTask(t *domain.DailyTask) error {
	if t == nil || strings.TrimSpace(t.Title) == "" {
		return errors.New("title is required")
	}
	return nil
}

var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = slugRe.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}
