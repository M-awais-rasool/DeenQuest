package application

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/chawais/deenquest/backend/internal/level/domain"
)

func (s *Service) AdminList(ctx context.Context) ([]domain.Level, error) {
	return s.repo.ListAllLevels(ctx)
}

func (s *Service) AdminGet(ctx context.Context, id int) (*domain.Level, error) {
	lvl, err := s.repo.GetLevelByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if lvl == nil {
		return nil, ErrLevelNotFound
	}
	return lvl, nil
}

func (s *Service) AdminCreate(ctx context.Context, in *domain.Level) (*domain.Level, error) {
	if err := validateLevel(in); err != nil {
		return nil, err
	}
	if in.CourseType == "" {
		in.CourseType = domain.CourseQaida
	}

	existing, err := s.repo.ListAllLevels(ctx)
	if err != nil {
		return nil, err
	}
	if in.ID == 0 {
		in.ID = maxLevelID(existing) + 1
	}
	if in.CourseLevel == 0 {
		in.CourseLevel = maxCourseLevel(existing, in.CourseType) + 1
	}

	if err := s.repo.CreateLevel(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *Service) AdminUpdate(ctx context.Context, id int, in *domain.Level) (*domain.Level, error) {
	if err := validateLevel(in); err != nil {
		return nil, err
	}
	in.ID = id
	if in.CourseType == "" {
		in.CourseType = domain.CourseQaida
	}
	if err := s.repo.UpdateLevel(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *Service) AdminDelete(ctx context.Context, id int) error {
	return s.repo.DeleteLevel(ctx, id)
}

func validateLevel(l *domain.Level) error {
	if l == nil || strings.TrimSpace(l.Title) == "" {
		return errors.New("title is required")
	}
	for i, lesson := range l.Lessons {
		if strings.TrimSpace(lesson.Component) == "" {
			return errors.New("lesson " + strconv.Itoa(i+1) + " is missing a component")
		}
	}
	return nil
}

func maxLevelID(levels []domain.Level) int {
	max := 0
	for _, l := range levels {
		if l.ID > max {
			max = l.ID
		}
	}
	return max
}

func maxCourseLevel(levels []domain.Level, course domain.CourseType) int {
	max := 0
	for _, l := range levels {
		if l.CourseType == course && l.CourseLevel > max {
			max = l.CourseLevel
		}
	}
	return max
}
