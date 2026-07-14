// Command contentlint validates the embedded curriculum chunks
// (internal/progress/content/**). It is the CI gate for content changes:
//
//	make content-lint
//
// Exit code 0 = clean; 1 = issues found (printed one per line).
package main

import (
	"fmt"
	"os"

	"github.com/chawais/deenquest/backend/internal/progress"
)

func main() {
	levels := progress.SeedLevels()
	chunks := progress.SeedContentChunks()

	issues := progress.LintLevels(levels)
	if len(issues) > 0 {
		fmt.Fprintf(os.Stderr, "content lint: %d issue(s)\n", len(issues))
		for _, issue := range issues {
			fmt.Fprintln(os.Stderr, "  ✗ "+issue.String())
		}
		os.Exit(1)
	}

	qaida, practice := 0, 0
	for _, l := range levels {
		switch l.CourseType {
		case progress.CourseQaida:
			qaida++
		case progress.CoursePractice:
			practice++
		}
	}
	fmt.Printf("content lint: clean ✓ (%d chunks · %d qaida levels · %d practice drills · seed v%d)\n",
		len(chunks), qaida, practice, progress.SeedDataVersion)
}
