package application

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/chawais/deenquest/backend/internal/tester/domain"
)

// ErrNoEmails is returned when a roster save carries nothing that looks like an
// address — almost always a paste that went wrong.
var ErrNoEmails = errors.New("no valid email addresses")

func (s *Service) Roster(ctx context.Context) ([]domain.RosterEntry, error) {
	return s.repo.Roster(ctx)
}

// SaveRoster adds the given addresses to the roster. `replace` makes the list
// authoritative — anyone absent from it is dropped — which is what pasting the
// current Play Console tester list should do.
//
// Input is deliberately forgiving: the Play Console hands you addresses
// separated by commas, newlines or spaces, sometimes as "Name <address>".
func (s *Service) SaveRoster(ctx context.Context, raw []string, replace bool) ([]domain.RosterEntry, error) {
	entries := parseEmails(raw, s.now().UTC())
	if len(entries) == 0 && !replace {
		return nil, ErrNoEmails
	}
	if err := s.repo.SaveRoster(ctx, entries, replace); err != nil {
		return nil, err
	}
	return s.repo.Roster(ctx)
}

func (s *Service) DeleteRoster(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return ErrNoEmails
	}
	return s.repo.DeleteRoster(ctx, email)
}

var emailSplitter = func(r rune) bool {
	switch r {
	case ',', ';', '\n', '\r', '\t', ' ', '<', '>', '"', '\'':
		return true
	}
	return false
}

func parseEmails(raw []string, at time.Time) []domain.RosterEntry {
	seen := make(map[string]struct{}, len(raw))
	entries := make([]domain.RosterEntry, 0, len(raw))

	for _, blob := range raw {
		for _, field := range strings.FieldsFunc(blob, emailSplitter) {
			email := strings.ToLower(strings.Trim(field, ".:"))
			if !looksLikeEmail(email) {
				continue
			}
			if _, dup := seen[email]; dup {
				continue
			}
			seen[email] = struct{}{}
			entries = append(entries, domain.RosterEntry{Email: email, AddedAt: at})
		}
	}
	return entries
}

func looksLikeEmail(s string) bool {
	at := strings.IndexByte(s, '@')
	if at <= 0 || at == len(s)-1 {
		return false
	}
	if strings.Count(s, "@") != 1 {
		return false
	}
	host := s[at+1:]
	dot := strings.IndexByte(host, '.')
	return dot > 0 && dot < len(host)-1
}
