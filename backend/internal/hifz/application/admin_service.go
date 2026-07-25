package application

import (
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"github.com/chawais/deenquest/backend/internal/hifz/domain"
)

type AdminService struct {
	repo  domain.Repository
	quran QuranSource
	svc   *Service
}

func NewAdminService(repo domain.Repository, quran QuranSource, svc *Service) *AdminService {
	return &AdminService{repo: repo, quran: quran, svc: svc}
}

// ─────────────────────────────────────────────
// Plans
// ─────────────────────────────────────────────

func (a *AdminService) ListPlans(ctx context.Context) ([]domain.Plan, error) {
	plans, err := a.repo.ListPlans(ctx, false)
	if err != nil {
		return nil, err
	}
	sort.SliceStable(plans, func(i, j int) bool { return plans[i].Order < plans[j].Order })
	return plans, nil
}

func (a *AdminService) GetPlan(ctx context.Context, id string) (*domain.Plan, error) {
	plan, err := a.repo.GetPlan(ctx, id)
	if err != nil {
		return nil, err
	}
	if plan == nil {
		return nil, domain.ErrPlanNotFound
	}
	return plan, nil
}

func (a *AdminService) SavePlan(ctx context.Context, in *domain.Plan) (*domain.Plan, error) {
	if err := validatePlan(in); err != nil {
		return nil, err
	}

	now := time.Now()
	existing, _ := a.repo.GetPlan(ctx, in.ID)
	if existing != nil {
		in.CreatedAt = existing.CreatedAt
		// An admin edit takes the plan out of seed management: bumping the seed
		// version on the *code* side must not silently overwrite it back.
		in.SeedVersion = existing.SeedVersion
	} else {
		in.CreatedAt = now
	}
	in.UpdatedAt = now

	if in.Slug == "" {
		in.Slug = slugify(in.Title)
	}
	if in.ID == "" {
		in.ID = in.Slug
	}

	if err := a.repo.UpsertPlan(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (a *AdminService) DeletePlan(ctx context.Context, id string) error {
	return a.repo.DeletePlan(ctx, id)
}

func validatePlan(p *domain.Plan) error {
	if p == nil {
		return errors.New("plan is required")
	}
	if strings.TrimSpace(p.Title) == "" {
		return errors.New("title is required")
	}
	if _, err := domain.ScopeSurahIDs(p.Scope); err != nil {
		return err
	}
	if p.Segmentation.Mode == domain.SegmentManual && len(p.Segmentation.Ranges) == 0 {
		return errors.New("manual segmentation needs at least one ayah range")
	}
	if p.Segmentation.Mode != domain.SegmentManual && p.Segmentation.AyahsPerPortion <= 0 {
		p.Segmentation.AyahsPerPortion = 4
	}
	if p.Segmentation.Mode == "" {
		p.Segmentation.Mode = domain.SegmentAuto
	}
	return nil
}

type PreviewPortion struct {
	domain.Portion
	AyahCount int      `json:"ayah_count"`
	Ayahs     []string `json:"ayahs,omitempty"`
}

// PreviewResult is the payload behind the plan editor's segmentation preview.
type PreviewResult struct {
	Portions   []PreviewPortion `json:"portions"`
	TotalAyahs int              `json:"total_ayahs"`
	Warnings   []string         `json:"warnings,omitempty"`
}

func (a *AdminService) PreviewPortions(ctx context.Context, plan *domain.Plan, withText int) (*PreviewResult, error) {
	if err := validatePlan(plan); err != nil {
		return nil, err
	}

	cfg, err := a.svc.Settings(ctx)
	if err != nil {
		return nil, err
	}
	preset := cfg.Preset(plan.PresetName)

	meta, err := a.svc.surahMeta(ctx)
	if err != nil {
		return nil, err
	}
	portions, err := domain.BuildPortions(*plan, meta, preset.AyahsPerPortion)
	if err != nil {
		return nil, err
	}

	out := &PreviewResult{TotalAyahs: domain.TotalAyahs(portions)}

	surahIDs, _ := domain.ScopeSurahIDs(plan.Scope)
	for _, sid := range surahIDs {
		if _, ok := meta[sid]; !ok {
			out.Warnings = append(out.Warnings,
				"No metadata for surah "+itoa(sid)+" — it was skipped.")
		}
	}
	if plan.Segmentation.Mode == domain.SegmentAuto {
		for _, sid := range surahIDs {
			if m, ok := meta[sid]; ok && m.AyahCount > 20 {
				out.Warnings = append(out.Warnings,
					m.EnglishName+" has "+itoa(m.AyahCount)+
						" ayahs — check the boundaries, or switch to manual ranges so portions fall on meaning.")
				break
			}
		}
	}

	for i, p := range portions {
		row := PreviewPortion{Portion: p, AyahCount: p.AyahCount()}
		if i < withText {
			if _, texts, err := a.svc.ayahTexts(ctx, p); err == nil {
				row.Ayahs = texts
			}
		}
		out.Portions = append(out.Portions, row)
	}
	return out, nil
}

func (a *AdminService) GetSettings(ctx context.Context) (*domain.Settings, error) {
	return a.svc.Settings(ctx)
}

func (a *AdminService) SaveSettings(ctx context.Context, in *domain.Settings) (*domain.Settings, error) {
	if in == nil || len(in.Presets) == 0 {
		return nil, errors.New("at least one difficulty preset is required")
	}
	for i := range in.Presets {
		if strings.TrimSpace(in.Presets[i].Name) == "" {
			return nil, errors.New("every preset needs a name")
		}
		if in.Presets[i].AyahsPerPortion <= 0 {
			in.Presets[i].AyahsPerPortion = 4
		}
		if in.Presets[i].ChallengeCount <= 0 {
			in.Presets[i].ChallengeCount = 3
		}
	}

	// Guard the SRS knobs: a zeroed half-life or an empty ladder would make every
	// portion read as Weak forever.
	defaults := domain.DefaultSettings().SRS
	if len(in.SRS.IntervalLadder) == 0 {
		in.SRS.IntervalLadder = defaults.IntervalLadder
	}
	if in.SRS.BaseHalfLifeDays <= 0 {
		in.SRS.BaseHalfLifeDays = defaults.BaseHalfLifeDays
	}
	if in.SRS.EMAAlpha <= 0 || in.SRS.EMAAlpha > 1 {
		in.SRS.EMAAlpha = defaults.EMAAlpha
	}
	if in.SRS.StrongThreshold <= 0 || in.SRS.StrongThreshold > 1 {
		in.SRS.StrongThreshold = defaults.StrongThreshold
	}
	if in.SRS.MediumThreshold <= 0 || in.SRS.MediumThreshold >= in.SRS.StrongThreshold {
		in.SRS.MediumThreshold = defaults.MediumThreshold
	}
	if in.SRS.UnverifiedPenalty <= 0 || in.SRS.UnverifiedPenalty > 1 {
		in.SRS.UnverifiedPenalty = defaults.UnverifiedPenalty
	}
	if in.SRS.SabqiWindowDays <= 0 {
		in.SRS.SabqiWindowDays = defaults.SabqiWindowDays
	}
	if in.Challenges == nil {
		in.Challenges = domain.DefaultSettings().Challenges
	}
	if len(in.Reciters) == 0 {
		in.Reciters = domain.DefaultSettings().Reciters
	}

	in.ID = domain.SettingsDocID()
	in.UpdatedAt = time.Now()
	if err := a.repo.SaveSettings(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

// ChallengeCatalogEntry describes one challenge type for the admin UI.
type ChallengeCatalogEntry struct {
	Kind        string                 `json:"kind"`
	Label       string                 `json:"label"`
	Icon        string                 `json:"icon"`
	Description string                 `json:"description"`
	Config      domain.ChallengeConfig `json:"config"`
}

// ChallengeCatalog pairs the built-in challenge catalog with current config.
func (a *AdminService) ChallengeCatalog(ctx context.Context) ([]ChallengeCatalogEntry, error) {
	cfg, err := a.svc.Settings(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]ChallengeCatalogEntry, 0, len(domain.AllChallengeKinds))
	for _, kind := range domain.AllChallengeKinds {
		meta := challengeMeta[kind]
		out = append(out, ChallengeCatalogEntry{
			Kind:        kind,
			Label:       meta.label,
			Icon:        meta.icon,
			Description: meta.description,
			Config:      cfg.ChallengeCfg(kind),
		})
	}
	return out, nil
}

type challengeMetaEntry struct{ label, icon, description string }

var challengeMeta = map[string]challengeMetaEntry{
	domain.ChallengeClozeWord: {"Fill the Gaps", "🕳️",
		"Hides a share of the words in one ayah; the learner taps them back from a bank with decoys."},
	domain.ChallengeAyahOrder: {"Put in Order", "🔢",
		"Shuffles the portion's ayahs. Tests sequence — the thing passive listening never teaches."},
	domain.ChallengeProgressiveFade: {"Fading Ayah", "🌗",
		"The same ayah over several rounds, hiding more each time until nothing is left. The strongest single drill in the set."},
	domain.ChallengeNextAyah: {"What Comes Next", "➡️",
		"Given one ayah, pick the one that follows. Transitions are where real recitation breaks down."},
	domain.ChallengeFirstLetter: {"First Letters", "🔤",
		"Reduces the ayah to the first letter of each word — the scaffold between reading and reciting blind."},
	domain.ChallengeWordMeaning: {"Word Meanings", "💡",
		"Match Arabic words to their meanings. Needs authored translations before it can be enabled."},
}

func (a *AdminService) Seed(ctx context.Context) (int, error) {
	if _, err := a.svc.Settings(ctx); err != nil {
		return 0, err
	}
	return a.repo.SeedPlans(ctx, domain.SeedPlans())
}

func slugify(s string) string {
	var b strings.Builder
	prevDash := false
	for _, r := range strings.ToLower(strings.TrimSpace(s)) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			prevDash = false
		default:
			if !prevDash && b.Len() > 0 {
				b.WriteByte('-')
				prevDash = true
			}
		}
	}
	return strings.Trim(b.String(), "-")
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}
