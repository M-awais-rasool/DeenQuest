package learning

import (
	"context"

	"github.com/chawais/deenquest/backend/internal/learning/model"
)

// CurriculumService is the admin-facing Curriculum Agent: it aggregates where
// learners struggle (hardest skills + most-missed lessons) so content authors can
// fix the curriculum where it actually hurts. Read-only over existing data.
type CurriculumService struct {
	learning model.Repository
	mistakes model.MistakeRepository
}

func NewCurriculumService(l model.Repository, m model.MistakeRepository) *CurriculumService {
	return &CurriculumService{learning: l, mistakes: m}
}

const curriculumTopN = 12

func (s *CurriculumService) Insights(ctx context.Context) (*model.CurriculumInsights, error) {
	skills, err := s.learning.SkillStruggles(ctx, curriculumTopN)
	if err != nil {
		return nil, err
	}
	missed, err := s.mistakes.TopMissed(ctx, curriculumTopN)
	if err != nil {
		return nil, err
	}
	return &model.CurriculumInsights{
		TopWeakSkills:    skills,
		TopMissedLessons: missed,
	}, nil
}
