package progress

import (
	"embed"
	"encoding/json"
	"fmt"
	"path"
	"sort"
	"sync"
)

// SeedDataVersion is bumped whenever the embedded curriculum changes in a way
// that must replace what an existing database holds (levels are otherwise
// insert-if-absent). On boot, if the stored version is older, the levels
// collection is replaced wholesale and per-user level progress is reset.
//
//	v2 — the 50-level "easy → normal" curriculum (content/qaida/*.json)
//	     replacing the original 33 hand-written levels, plus the
//	     coach-practice course (content/practice/*.json).
const SeedDataVersion = 2

// ContentChunkSchema is the identifier every chunk file must declare, so a
// future format change can be detected instead of silently misparsed.
const ContentChunkSchema = "deenquest.content.chunk/v1"

// contentFS embeds the curriculum. Content is data: adding or editing a level
// means editing a JSON chunk, running `make content-lint`, and redeploying —
// no Go code changes.
//
//go:embed content/qaida/*.json content/practice/*.json
var contentFS embed.FS

// ContentChunk is one JSON file of levels. Chunks are small on purpose
// (one section ≈ 10 levels) so authors can review diffs and the linter can
// point at a single file.
type ContentChunk struct {
	Schema       string     `json:"schema"`
	Course       CourseType `json:"course"`
	Section      int        `json:"section"`
	SectionTitle string     `json:"section_title"`
	Levels       []Level    `json:"levels"`

	// File is filled by the loader for error/lint messages.
	File string `json:"-"`
}

var (
	loadOnce   sync.Once
	loadedAll  []Level
	loadChunks []ContentChunk
	loadErr    error
)

// loadContent parses every embedded chunk exactly once. The content is
// compile-time embedded, so a parse failure is a build defect: SeedLevels
// panics rather than letting the service boot with half a curriculum.
// TestSeedContentLoads and `make content-lint` catch it long before that.
func loadContent() ([]Level, []ContentChunk, error) {
	loadOnce.Do(func() {
		dirs := []string{"content/qaida", "content/practice"}
		var chunks []ContentChunk

		for _, dir := range dirs {
			entries, err := contentFS.ReadDir(dir)
			if err != nil {
				loadErr = fmt.Errorf("read content dir %s: %w", dir, err)
				return
			}
			for _, entry := range entries {
				if entry.IsDir() || path.Ext(entry.Name()) != ".json" {
					continue
				}
				file := path.Join(dir, entry.Name())
				raw, err := contentFS.ReadFile(file)
				if err != nil {
					loadErr = fmt.Errorf("read %s: %w", file, err)
					return
				}
				var chunk ContentChunk
				if err := json.Unmarshal(raw, &chunk); err != nil {
					loadErr = fmt.Errorf("parse %s: %w", file, err)
					return
				}
				if chunk.Schema != ContentChunkSchema {
					loadErr = fmt.Errorf("%s: schema %q, want %q", file, chunk.Schema, ContentChunkSchema)
					return
				}
				chunk.File = file
				chunks = append(chunks, chunk)
			}
		}

		var all []Level
		for _, chunk := range chunks {
			for i := range chunk.Levels {
				level := chunk.Levels[i]
				// Derived fields: authors never repeat the course per level,
				// and course_level always mirrors the ID.
				level.CourseType = chunk.Course
				level.CourseLevel = level.ID
				all = append(all, level)
			}
		}
		sort.Slice(all, func(i, j int) bool { return all[i].ID < all[j].ID })

		loadedAll = all
		loadChunks = chunks
	})
	return loadedAll, loadChunks, loadErr
}

// SeedLevels returns every level of every course, loaded from the embedded
// JSON content chunks.
func SeedLevels() []Level {
	levels, _, err := loadContent()
	if err != nil {
		panic(fmt.Sprintf("progress: embedded content is invalid: %v", err))
	}
	return levels
}

// SeedContentChunks exposes the parsed chunk files (for the linter CLI and
// tests).
func SeedContentChunks() []ContentChunk {
	_, chunks, err := loadContent()
	if err != nil {
		panic(fmt.Sprintf("progress: embedded content is invalid: %v", err))
	}
	return chunks
}
