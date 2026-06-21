package learning

import (
	"context"

	domain "github.com/chawais/talent-flow/backend/internal/domain/learning"
)

// CurriculumService is the admin-facing Curriculum Agent: it aggregates where
// learners struggle (hardest skills + most-missed lessons) so content authors can
// fix the curriculum where it actually hurts. Read-only over existing data.
type CurriculumService struct {
	learning domain.Repository
	mistakes domain.MistakeRepository
}

func NewCurriculumService(l domain.Repository, m domain.MistakeRepository) *CurriculumService {
	return &CurriculumService{learning: l, mistakes: m}
}

const curriculumTopN = 12

func (s *CurriculumService) Insights(ctx context.Context) (*domain.CurriculumInsights, error) {
	skills, err := s.learning.SkillStruggles(ctx, curriculumTopN)
	if err != nil {
		return nil, err
	}
	missed, err := s.mistakes.TopMissed(ctx, curriculumTopN)
	if err != nil {
		return nil, err
	}
	return &domain.CurriculumInsights{
		TopWeakSkills:    skills,
		TopMissedLessons: missed,
	}, nil
}
