package application

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/challenge/domain"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
	progressdomain "github.com/chawais/deenquest/backend/internal/progress/domain"
)

type XPAwarder interface {
	AwardFrom(ctx context.Context, userID string, xpDelta, barakahDelta int, source progressapp.ActivitySource) (*progressdomain.Progress, error)
}

type Profiles interface {
	DisplayNames(ctx context.Context, userIDs []string) (map[string]string, error)
}

const (
	duelDurationDays   = 7
	defaultGroupDays   = 30
	maxGroupDays       = 180
	maxGroupTarget     = 1_000_000
	recentResultsLimit = 3
	inviteCodeAttempts = 5
	groupNameMaxRunes  = 60
	groupDescMaxRunes  = 140
)

type Service struct {
	repo     domain.Repository
	profiles Profiles
	xp       XPAwarder
}

func NewService(repo domain.Repository, profiles Profiles, xp XPAwarder) *Service {
	return &Service{repo: repo, profiles: profiles, xp: xp}
}

func (s *Service) Seed(ctx context.Context) error {
	return s.repo.SeedQuestTemplates(ctx, domain.QuestCatalog())
}

func (s *Service) GetOverview(ctx context.Context, userID string) (*Overview, error) {
	now := time.Now().UTC()

	quests, err := s.ensureWeeklyQuests(ctx, userID, now)
	if err != nil {
		return nil, fmt.Errorf("load weekly quests: %w", err)
	}

	duel, results, err := s.loadDuels(ctx, userID, now)
	if err != nil {
		return nil, fmt.Errorf("load duels: %w", err)
	}

	group, err := s.loadGroup(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("load group challenge: %w", err)
	}

	names, err := s.resolveNames(ctx, namesNeeded(duel, results, group))
	if err != nil {
		return nil, err
	}

	out := &Overview{
		Quests:  questViews(quests),
		Results: make([]DuelView, 0, len(results)),
	}
	if duel != nil {
		v := duelView(duel, userID, names, now)
		out.Duel = &v
	}
	for i := range results {
		out.Results = append(out.Results, duelView(&results[i], userID, names, now))
	}
	if group != nil {
		v := groupView(group, userID, names)
		out.Group = &v
	}
	return out, nil
}

func (s *Service) ensureWeeklyQuests(ctx context.Context, userID string, now time.Time) ([]domain.UserQuest, error) {
	weekKey := domain.WeekKey(now)
	existing, err := s.repo.ListUserQuests(ctx, userID, weekKey)
	if err != nil {
		return nil, err
	}
	if len(existing) > 0 {
		return existing, nil
	}

	catalog, err := s.repo.ListQuestTemplates(ctx)
	if err != nil {
		return nil, err
	}
	if len(catalog) == 0 {
		catalog = domain.QuestCatalog() // catalog not seeded yet; don't show an empty board
	}

	picked := domain.PickWeeklyQuests(catalog, userID, weekKey, domain.WeeklyQuestCount)
	fresh := make([]domain.UserQuest, 0, len(picked))
	for i, t := range picked {
		fresh = append(fresh, domain.NewUserQuest(uuid.NewString(), userID, weekKey, t, now, i))
	}
	if err := s.repo.InsertUserQuests(ctx, fresh); err != nil {
		return nil, err
	}
	return fresh, nil
}

func (s *Service) currentDuel(ctx context.Context, userID string, now time.Time) (*domain.Duel, error) {
	open, err := s.repo.ListOpenDuelsForUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	var current *domain.Duel
	for i := range open {
		d := &open[i]
		switch {
		case d.Settle(now):
			if err := s.finishDuel(ctx, d); err != nil {
				return nil, err
			}
		case d.Expired(now):
			d.Status = domain.DuelCancelled
			d.UpdatedAt = now
			if err := s.repo.SaveDuel(ctx, d); err != nil {
				return nil, err
			}
		default:
			if current == nil {
				current = d
			}
		}
	}
	return current, nil
}

func (s *Service) loadDuels(ctx context.Context, userID string, now time.Time) (*domain.Duel, []domain.Duel, error) {
	current, err := s.currentDuel(ctx, userID, now)
	if err != nil {
		return nil, nil, err
	}
	results, err := s.repo.ListRecentDuelsForUser(ctx, userID, recentResultsLimit)
	if err != nil {
		return nil, nil, err
	}
	return current, results, nil
}

func (s *Service) finishDuel(ctx context.Context, d *domain.Duel) error {
	if err := s.repo.SaveDuel(ctx, d); err != nil {
		return err
	}
	if d.WinnerID == "" || s.xp == nil {
		return nil
	}
	if _, err := s.xp.AwardFrom(ctx, d.WinnerID, domain.DuelWinnerXP, 0, progressapp.SourceChallenge); err != nil {
		// The duel is already settled; a failed payout must not un-settle it.
		logger.Warn("challenge: duel reward payout failed",
			zap.String("duel_id", d.ID), zap.String("winner_id", d.WinnerID), zap.Error(err))
	}
	return nil
}

func (s *Service) loadGroup(ctx context.Context, userID string) (*domain.GroupChallenge, error) {
	groups, err := s.repo.ListGroupsForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(groups) == 0 {
		return nil, nil
	}
	for i := range groups {
		if !groups[i].Completed {
			return &groups[i], nil
		}
	}
	return &groups[0], nil
}

/* ─────────────────────────── duels ─────────────────────────── */
func (s *Service) CreateDuel(ctx context.Context, userID string) (*DuelView, error) {
	now := time.Now().UTC()

	existing, err := s.currentDuel(ctx, userID, now)
	if err != nil {
		return nil, fmt.Errorf("check open duels: %w", err)
	}
	if existing != nil {
		return nil, domain.ErrActiveDuel
	}

	duel := &domain.Duel{
		ID:           uuid.NewString(),
		ChallengerID: userID,
		Status:       domain.DuelPending,
		StartsAt:     now,
		EndsAt:       now.AddDate(0, 0, duelDurationDays),
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := s.createWithCode(ctx, func(code string) error {
		duel.InviteCode = code
		return s.repo.CreateDuel(ctx, duel)
	}); err != nil {
		return nil, fmt.Errorf("create duel: %w", err)
	}

	names, err := s.resolveNames(ctx, []string{userID})
	if err != nil {
		return nil, err
	}
	v := duelView(duel, userID, names, now)
	return &v, nil
}

func (s *Service) JoinDuel(ctx context.Context, userID, rawCode string) (*DuelView, error) {
	code := domain.NormalizeCode(rawCode)
	if code == "" {
		return nil, domain.ErrDuelNotFound
	}
	now := time.Now().UTC()

	duel, err := s.repo.GetDuelByCode(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("find duel: %w", err)
	}
	if duel == nil {
		return nil, domain.ErrDuelNotFound
	}
	if duel.ChallengerID == userID {
		return nil, domain.ErrSelfJoin
	}
	if duel.Status != domain.DuelPending || duel.Expired(now) {
		return nil, domain.ErrDuelUnavailable
	}

	existing, err := s.currentDuel(ctx, userID, now)
	if err != nil {
		return nil, fmt.Errorf("check open duels: %w", err)
	}
	if existing != nil {
		return nil, domain.ErrActiveDuel
	}

	duel.OpponentID = userID
	duel.Status = domain.DuelActive
	duel.StartsAt = now
	duel.EndsAt = now.AddDate(0, 0, duelDurationDays)
	duel.UpdatedAt = now
	if err := s.repo.SaveDuel(ctx, duel); err != nil {
		return nil, fmt.Errorf("join duel: %w", err)
	}

	names, err := s.resolveNames(ctx, []string{duel.ChallengerID, duel.OpponentID})
	if err != nil {
		return nil, err
	}
	v := duelView(duel, userID, names, now)
	return &v, nil
}

func (s *Service) CancelDuel(ctx context.Context, userID, duelID string) error {
	now := time.Now().UTC()
	open, err := s.repo.ListOpenDuelsForUser(ctx, userID)
	if err != nil {
		return fmt.Errorf("load duels: %w", err)
	}
	for i := range open {
		d := &open[i]
		if d.ID != duelID || !d.Involves(userID) {
			continue
		}
		d.Status = domain.DuelCancelled
		d.UpdatedAt = now
		return s.repo.SaveDuel(ctx, d)
	}
	return domain.ErrDuelNotFound
}

/* ────────────────────── group challenges ────────────────────── */
func (s *Service) CreateGroup(ctx context.Context, userID string, req CreateGroupRequest) (*GroupView, error) {
	name := trimTo(req.Name, groupNameMaxRunes)
	if name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrInvalidRequest)
	}
	if !req.Metric.Valid() {
		return nil, fmt.Errorf("%w: unknown metric %q", ErrInvalidRequest, req.Metric)
	}
	if req.Target <= 0 || req.Target > maxGroupTarget {
		return nil, fmt.Errorf("%w: target must be between 1 and %d", ErrInvalidRequest, maxGroupTarget)
	}
	days := req.Days
	if days <= 0 {
		days = defaultGroupDays
	}
	if days > maxGroupDays {
		return nil, fmt.Errorf("%w: duration must be at most %d days", ErrInvalidRequest, maxGroupDays)
	}

	now := time.Now().UTC()
	group := &domain.GroupChallenge{
		ID:          uuid.NewString(),
		Name:        name,
		Description: trimTo(req.Description, groupDescMaxRunes),
		OwnerID:     userID,
		Metric:      req.Metric,
		Target:      req.Target,
		EndsAt:      now.AddDate(0, 0, days),
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	group.AddMember(userID, now)

	if err := s.createWithCode(ctx, func(code string) error {
		group.JoinCode = code
		return s.repo.CreateGroup(ctx, group)
	}); err != nil {
		return nil, fmt.Errorf("create group challenge: %w", err)
	}

	names, err := s.resolveNames(ctx, memberIDs(group))
	if err != nil {
		return nil, err
	}
	v := groupView(group, userID, names)
	return &v, nil
}

func (s *Service) JoinGroup(ctx context.Context, userID, rawCode string) (*GroupView, error) {
	code := domain.NormalizeCode(rawCode)
	if code == "" {
		return nil, domain.ErrGroupNotFound
	}
	now := time.Now().UTC()

	group, err := s.repo.GetGroupByCode(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("find group challenge: %w", err)
	}
	if group == nil {
		return nil, domain.ErrGroupNotFound
	}
	if group.HasMember(userID) {
		return nil, domain.ErrAlreadyJoined
	}
	if group.Completed || !now.Before(group.EndsAt) {
		return nil, domain.ErrGroupNotFound
	}
	if !group.AddMember(userID, now) {
		return nil, domain.ErrGroupFull
	}
	if err := s.repo.SaveGroup(ctx, group); err != nil {
		return nil, fmt.Errorf("join group challenge: %w", err)
	}

	names, err := s.resolveNames(ctx, memberIDs(group))
	if err != nil {
		return nil, err
	}
	v := groupView(group, userID, names)
	return &v, nil
}

/* ────────────────────── activity fan-out ────────────────────── */
// OnActivity scores an activity synchronously.
//
// Production does not call this directly — ActivityQueue is what the progress
// service is wired to, so the fan-out happens off the request path. This stays
// as the synchronous seam the queue drives and the tests exercise.
func (s *Service) OnActivity(ctx context.Context, userID string, source progressapp.ActivitySource, xp int) {
	if source == progressapp.SourceChallenge || userID == "" {
		return
	}
	deltas := domain.DeltasFor(string(source), xp)
	if len(deltas) == 0 {
		return
	}
	if err := s.applyDeltas(ctx, userID, deltas); err != nil {
		logger.Warn("challenge: failed to apply activity",
			zap.String("user_id", userID), zap.String("source", string(source)), zap.Error(err))
	}
}

func (s *Service) Encourage(ctx context.Context, userID, targetID string) error {
	if userID == "" || targetID == "" {
		return fmt.Errorf("%w: target user is required", ErrInvalidRequest)
	}
	if targetID == userID {
		return fmt.Errorf("%w: cannot encourage yourself", ErrInvalidRequest)
	}

	now := time.Now().UTC()
	ok, err := s.sharesChallenge(ctx, userID, targetID, now)
	if err != nil {
		return err
	}
	if !ok {
		return domain.ErrNotAParticipant
	}

	err = s.repo.RecordEncouragement(ctx, domain.Encouragement{
		ID:        uuid.NewString(),
		UserID:    userID,
		TargetID:  targetID,
		Date:      domain.DateKey(now),
		CreatedAt: now,
	})
	if err != nil {
		return err // includes ErrDuplicateEncouragement
	}
	return s.applyDeltas(ctx, userID, domain.Deltas{domain.MetricEncouragements: 1})
}

func (s *Service) sharesChallenge(ctx context.Context, userID, targetID string, now time.Time) (bool, error) {
	duels, err := s.repo.ListOpenDuelsForUser(ctx, userID)
	if err != nil {
		return false, fmt.Errorf("load duels: %w", err)
	}
	for i := range duels {
		if duels[i].Rival(userID) == targetID {
			return true, nil
		}
	}

	groups, err := s.repo.ListGroupsForUser(ctx, userID)
	if err != nil {
		return false, fmt.Errorf("load group challenges: %w", err)
	}
	for i := range groups {
		if groups[i].HasMember(targetID) {
			return true, nil
		}
	}
	return false, nil
}

func (s *Service) applyDeltas(ctx context.Context, userID string, deltas domain.Deltas) error {
	now := time.Now().UTC()
	var errs []error

	if err := s.scoreQuests(ctx, userID, deltas, now); err != nil {
		errs = append(errs, fmt.Errorf("quests: %w", err))
	}
	if xp := deltas[domain.MetricXP]; xp > 0 {
		if err := s.scoreDuels(ctx, userID, xp, now); err != nil {
			errs = append(errs, fmt.Errorf("duels: %w", err))
		}
	}
	if err := s.scoreGroups(ctx, userID, deltas, now); err != nil {
		errs = append(errs, fmt.Errorf("groups: %w", err))
	}
	return errors.Join(errs...)
}

// scoreQuests advances every quest one activity touches, then persists them
// together. One lesson usually moves two or three quests, and writing each one
// separately made a single completion several round trips deep.
func (s *Service) scoreQuests(ctx context.Context, userID string, deltas domain.Deltas, now time.Time) error {
	quests, err := s.ensureWeeklyQuests(ctx, userID, now)
	if err != nil {
		return err
	}

	dirty := make([]*domain.UserQuest, 0, len(quests))
	unpaid := make([]*domain.UserQuest, 0, 2)

	for i := range quests {
		q := &quests[i]
		amount := deltas[q.Metric]
		if amount <= 0 || q.Completed {
			continue
		}
		q.Progress += amount
		if q.Progress >= q.Target {
			q.Progress = q.Target
			q.Completed = true
		}
		dirty = append(dirty, q)
		if q.Completed && !q.RewardPaid {
			unpaid = append(unpaid, q)
		}
	}

	if err := s.repo.SaveUserQuests(ctx, dirty); err != nil {
		return err
	}

	// Progress is durable before any reward is paid. If awarding XP fails
	// halfway, RewardPaid stays false and the next activity retries the payout
	// instead of double-counting the progress that earned it.
	return s.payQuests(ctx, unpaid)
}

func (s *Service) payQuests(ctx context.Context, quests []*domain.UserQuest) error {
	if len(quests) == 0 {
		return nil
	}

	paid := make([]*domain.UserQuest, 0, len(quests))
	for _, q := range quests {
		if s.xp != nil && q.RewardXP > 0 {
			if _, err := s.xp.AwardFrom(ctx, q.UserID, q.RewardXP, 0, progressapp.SourceChallenge); err != nil {
				return err
			}
		}
		q.RewardPaid = true
		paid = append(paid, q)
	}
	return s.repo.SaveUserQuests(ctx, paid)
}

func (s *Service) scoreDuels(ctx context.Context, userID string, xp int, now time.Time) error {
	duels, err := s.repo.ListOpenDuelsForUser(ctx, userID)
	if err != nil {
		return err
	}
	for i := range duels {
		d := &duels[i]
		switch {
		case d.Settle(now):
			if err := s.finishDuel(ctx, d); err != nil {
				return err
			}
		case d.AddScore(userID, xp, now):
			if err := s.repo.SaveDuel(ctx, d); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *Service) scoreGroups(ctx context.Context, userID string, deltas domain.Deltas, now time.Time) error {
	groups, err := s.repo.ListGroupsForUser(ctx, userID)
	if err != nil {
		return err
	}
	for i := range groups {
		g := &groups[i]
		if amount := deltas[g.Metric]; amount > 0 && g.Contribute(userID, amount, now) {
			if err := s.repo.SaveGroup(ctx, g); err != nil {
				return err
			}
		}
	}
	return nil
}

/* ─────────────────────────── helpers ─────────────────────────── */

var ErrInvalidRequest = errors.New("challenge: invalid request")

func (s *Service) createWithCode(ctx context.Context, insert func(code string) error) error {
	var lastErr error
	for i := 0; i < inviteCodeAttempts; i++ {
		code, err := domain.NewInviteCode()
		if err != nil {
			return err
		}
		if err := insert(code); err != nil {
			if errors.Is(err, domain.ErrCodeTaken) {
				lastErr = err
				continue
			}
			return err
		}
		return nil
	}
	return fmt.Errorf("could not allocate a unique invite code: %w", lastErr)
}

func (s *Service) resolveNames(ctx context.Context, ids []string) (map[string]string, error) {
	if len(ids) == 0 || s.profiles == nil {
		return map[string]string{}, nil
	}
	names, err := s.profiles.DisplayNames(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("resolve display names: %w", err)
	}
	return names, nil
}

func namesNeeded(duel *domain.Duel, results []domain.Duel, group *domain.GroupChallenge) []string {
	seen := map[string]bool{}
	var out []string
	add := func(id string) {
		if id != "" && !seen[id] {
			seen[id] = true
			out = append(out, id)
		}
	}
	if duel != nil {
		add(duel.ChallengerID)
		add(duel.OpponentID)
	}
	for i := range results {
		add(results[i].ChallengerID)
		add(results[i].OpponentID)
	}
	if group != nil {
		for _, id := range memberIDs(group) {
			add(id)
		}
	}
	return out
}

func memberIDs(g *domain.GroupChallenge) []string {
	out := make([]string, 0, len(g.Members))
	for i := range g.Members {
		out = append(out, g.Members[i].UserID)
	}
	return out
}

func participant(userID string, score int, names map[string]string) Participant {
	name := names[userID]
	if name == "" {
		name = "Seeker"
	}
	return Participant{UserID: userID, DisplayName: name, Initial: initialOf(name), Score: score}
}

func initialOf(name string) string {
	for _, r := range name {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			return strings.ToUpper(string(r))
		}
	}
	return "?"
}

func duelView(d *domain.Duel, userID string, names map[string]string, now time.Time) DuelView {
	v := DuelView{
		ID:       d.ID,
		Status:   d.Status,
		You:      participant(userID, d.Score(userID), names),
		StartsAt: d.StartsAt.Format(time.RFC3339),
		EndsAt:   d.EndsAt.Format(time.RFC3339),
		RewardXP: domain.DuelWinnerXP,
	}
	// Only the challenger of a still-open duel needs the code to share.
	if d.Status == domain.DuelPending && d.ChallengerID == userID {
		v.InviteCode = d.InviteCode
	}
	if rival := d.Rival(userID); rival != "" {
		p := participant(rival, d.Score(rival), names)
		v.Rival = &p
	}
	if remaining := d.EndsAt.Sub(now); remaining > 0 {
		v.EndsInSec = int64(remaining.Seconds())
	}
	if d.Status == domain.DuelCompleted {
		switch {
		case d.WinnerID == "":
			v.Outcome = "draw"
		case d.WinnerID == userID:
			v.Outcome = "won"
		default:
			v.Outcome = "lost"
		}
	}
	return v
}

func groupView(g *domain.GroupChallenge, userID string, names map[string]string) GroupView {
	members := make([]Participant, 0, len(g.Members))
	for i := range g.Members {
		members = append(members, participant(g.Members[i].UserID, g.Members[i].Contribution, names))
	}
	return GroupView{
		ID:          g.ID,
		Name:        g.Name,
		Description: g.Description,
		JoinCode:    g.JoinCode,
		Metric:      g.Metric,
		Target:      g.Target,
		Progress:    g.Progress,
		Percent:     g.PercentComplete(),
		Members:     members,
		MemberCount: len(members),
		IsOwner:     g.OwnerID == userID,
		Completed:   g.Completed,
		EndsAt:      g.EndsAt.Format(time.RFC3339),
	}
}

func questViews(quests []domain.UserQuest) []QuestView {
	out := make([]QuestView, 0, len(quests))
	for i := range quests {
		q := quests[i]
		pct := 0
		if q.Target > 0 {
			pct = q.Progress * 100 / q.Target
			if pct > 100 {
				pct = 100
			}
		}
		out = append(out, QuestView{
			ID:        q.ID,
			Title:     q.Title,
			Metric:    q.Metric,
			Target:    q.Target,
			Progress:  q.Progress,
			Percent:   pct,
			RewardXP:  q.RewardXP,
			Glyph:     q.Glyph,
			Accent:    q.Accent,
			Completed: q.Completed,
		})
	}
	return out
}

func trimTo(s string, maxRunes int) string {
	s = strings.TrimSpace(s)
	if r := []rune(s); len(r) > maxRunes {
		return strings.TrimSpace(string(r[:maxRunes]))
	}
	return s
}
