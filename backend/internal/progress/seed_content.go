package progress

import (
	"embed"
	"encoding/json"
	"fmt"
	"path"
	"sort"
	"sync"
)

const SeedDataVersion = 3
const ContentChunkSchema = "deenquest.content.chunk/v1"

var contentFS embed.FS

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

func SeedLevels() []Level {
	levels, _, err := loadContent()
	if err != nil {
		panic(fmt.Sprintf("progress: embedded content is invalid: %v", err))
	}
	return levels
}

func SeedContentChunks() []ContentChunk {
	_, chunks, err := loadContent()
	if err != nil {
		panic(fmt.Sprintf("progress: embedded content is invalid: %v", err))
	}
	return chunks
}
