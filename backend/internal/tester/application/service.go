package application

import (
	"context"
	"sort"
	"strings"
	"time"

	"github.com/chawais/deenquest/backend/internal/tester/domain"
)

const (
	// DefaultWindowDays matches Google Play's closed-testing requirement: the
	// question the report answers is "has each tester opened it during the
	// fourteen days", so fourteen columns is the whole picture.
	DefaultWindowDays = 14
	MaxWindowDays     = 90
)

// Service assembles the tester report and owns the roster.
type Service struct {
	repo domain.Repository
	loc  *time.Location
	now  func() time.Time
}

func NewService(repo domain.Repository, loc *time.Location) *Service {
	if loc == nil {
		loc = time.UTC
	}
	return &Service{repo: repo, loc: loc, now: time.Now}
}

// Report draws the last `days` days, oldest column first.
func (s *Service) Report(ctx context.Context, days int) (*domain.Report, error) {
	if days <= 0 {
		days = DefaultWindowDays
	}
	if days > MaxWindowDays {
		days = MaxWindowDays
	}

	now := s.now().In(s.loc)
	today := now.Format("2006-01-02")

	dates := make([]string, days)
	for i := range dates {
		dates[i] = now.AddDate(0, 0, -(days - 1 - i)).Format("2006-01-02")
	}

	activity, err := s.repo.Activity(ctx, dates[0], today)
	if err != nil {
		return nil, err
	}
	roster, err := s.repo.Roster(ctx)
	if err != nil {
		return nil, err
	}

	emails := make([]string, 0, len(roster))
	for _, entry := range roster {
		emails = append(emails, entry.Email)
	}
	userIDs := make([]string, 0, len(activity))
	seenID := make(map[string]struct{}, len(activity))
	for _, day := range activity {
		if _, ok := seenID[day.UserID]; ok {
			continue
		}
		seenID[day.UserID] = struct{}{}
		userIDs = append(userIDs, day.UserID)
	}

	accounts, err := s.repo.Accounts(ctx, emails, userIDs)
	if err != nil {
		return nil, err
	}

	byID := make(map[string]domain.Account, len(accounts))
	byEmail := make(map[string]domain.Account, len(accounts))
	for _, a := range accounts {
		byID[a.ID] = a
		byEmail[strings.ToLower(a.Email)] = a
	}

	rows := make([]*domain.TesterRow, 0, len(roster)+len(userIDs))
	rowByUser := make(map[string]*domain.TesterRow, len(rows))

	blank := func() []domain.DayCell {
		cells := make([]domain.DayCell, len(dates))
		for i, d := range dates {
			cells[i] = domain.DayCell{Date: d}
		}
		return cells
	}

	for _, entry := range roster {
		row := &domain.TesterRow{
			Email:         entry.Email,
			Name:          entry.Name,
			Note:          entry.Note,
			InRoster:      true,
			DaysSinceSeen: -1,
			Days:          blank(),
		}
		if a, ok := byEmail[entry.Email]; ok {
			row.HasAccount = true
			row.UserID = a.ID
			joined := a.CreatedAt
			row.JoinedAt = &joined
			if row.Name == "" {
				row.Name = a.DisplayName
			}
			rowByUser[a.ID] = row
		}
		rows = append(rows, row)
	}

	// Anyone using the app who is not on the roster still belongs in the
	// report — that is how a tester who signed in with a different Google
	// account than the one invited shows up at all.
	for _, id := range userIDs {
		if _, ok := rowByUser[id]; ok {
			continue
		}
		row := &domain.TesterRow{
			UserID:        id,
			DaysSinceSeen: -1,
			Days:          blank(),
		}
		if a, ok := byID[id]; ok {
			row.HasAccount = true
			row.Email = a.Email
			row.Name = a.DisplayName
			joined := a.CreatedAt
			row.JoinedAt = &joined
		}
		rowByUser[id] = row
		rows = append(rows, row)
	}

	index := make(map[string]int, len(dates))
	for i, d := range dates {
		index[d] = i
	}

	for _, day := range activity {
		row, ok := rowByUser[day.UserID]
		if !ok {
			continue
		}
		i, ok := index[day.Date]
		if !ok {
			continue
		}
		first, last := day.FirstSeen, day.LastSeen
		row.Days[i] = domain.DayCell{
			Date:      day.Date,
			Active:    true,
			Requests:  day.Requests,
			FirstSeen: &first,
			LastSeen:  &last,
		}
		row.TotalRequests += day.Requests
		row.DaysActive++
		if day.Client != "" {
			row.Client = day.Client
		}
		if row.FirstSeen == nil || first.Before(*row.FirstSeen) {
			row.FirstSeen = &first
		}
		if row.LastSeen == nil || last.After(*row.LastSeen) {
			row.LastSeen = &last
		}
	}

	report := &domain.Report{
		Timezone: s.loc.String(),
		Today:    today,
		Days:     dates,
		Testers:  make([]domain.TesterRow, 0, len(rows)),
	}

	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, s.loc)
	for _, row := range rows {
		row.ActiveToday = row.Days[len(row.Days)-1].Active
		row.CurrentStreak = streak(row.Days)
		if row.LastSeen != nil {
			seen := row.LastSeen.In(s.loc)
			startOfSeen := time.Date(seen.Year(), seen.Month(), seen.Day(), 0, 0, 0, 0, s.loc)
			row.DaysSinceSeen = int(startOfToday.Sub(startOfSeen).Hours() / 24)
		}

		if row.InRoster {
			report.Summary.Roster++
			if row.HasAccount {
				report.Summary.Signed++
			} else {
				report.Summary.NeverOpened++
			}
			if !row.ActiveToday {
				report.Summary.MissingToday++
			}
			if row.DaysActive == len(dates) {
				report.Summary.PerfectWindow++
			}
		}
		if row.ActiveToday {
			report.Summary.ActiveToday++
		}
	}

	sortRows(rows)
	for _, row := range rows {
		report.Testers = append(report.Testers, *row)
	}
	return report, nil
}

// streak counts back from the newest day. Today being empty does not break a
// streak — the day is not over yet.
func streak(cells []domain.DayCell) int {
	count := 0
	for i := len(cells) - 1; i >= 0; i-- {
		if cells[i].Active {
			count++
			continue
		}
		if i == len(cells)-1 {
			continue
		}
		break
	}
	return count
}

// sortRows puts the people worth messaging at the top: never opened it first,
// then longest silent, and everyone who already opened it today at the bottom.
func sortRows(rows []*domain.TesterRow) {
	sort.SliceStable(rows, func(i, j int) bool {
		a, b := rows[i], rows[j]
		if a.ActiveToday != b.ActiveToday {
			return !a.ActiveToday
		}
		if (a.LastSeen == nil) != (b.LastSeen == nil) {
			return a.LastSeen == nil
		}
		if a.LastSeen != nil && !a.LastSeen.Equal(*b.LastSeen) {
			return a.LastSeen.Before(*b.LastSeen)
		}
		if a.InRoster != b.InRoster {
			return a.InRoster
		}
		return a.Email < b.Email
	})
}
