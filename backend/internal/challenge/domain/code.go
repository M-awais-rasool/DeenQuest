package domain

import (
	"crypto/rand"
	"math/big"
	"strings"
)

const codeAlphabet = "ACDEFGHJKMNPQRTUVWXY3456789"

const InviteCodeLength = 6

func NewInviteCode() (string, error) {
	max := big.NewInt(int64(len(codeAlphabet)))
	var b strings.Builder
	b.Grow(InviteCodeLength)
	for i := 0; i < InviteCodeLength; i++ {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		b.WriteByte(codeAlphabet[n.Int64()])
	}
	return b.String(), nil
}

func NormalizeCode(raw string) string {
	var b strings.Builder
	for _, r := range strings.ToUpper(strings.TrimSpace(raw)) {
		if r == ' ' || r == '-' || r == '_' {
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}
