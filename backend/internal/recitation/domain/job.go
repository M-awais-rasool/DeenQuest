package domain

import "time"

type JobStatus string

const (
	JobQueued  JobStatus = "queued"
	JobRunning JobStatus = "running"
	JobDone    JobStatus = "done"
	JobFailed  JobStatus = "failed"
)

func (s JobStatus) Terminal() bool { return s == JobDone || s == JobFailed }

type Job struct {
	ID          string     `json:"id"`
	UserID      string     `json:"user_id"`
	LevelID     int        `json:"level_id"`
	LessonIndex int        `json:"lesson_index"`
	Filename    string     `json:"filename"`
	AudioID     string     `json:"audio_id"`
	Status      JobStatus  `json:"status"`
	EnqueuedAt  time.Time  `json:"enqueued_at"`
	StartedAt   *time.Time `json:"started_at,omitempty"`
	FinishedAt  *time.Time `json:"finished_at,omitempty"`

	Result *RecitationCheckResult `json:"result,omitempty"`
	Error  string                 `json:"error,omitempty"`
}

func (j *Job) Stale(lease time.Duration, now time.Time) bool {
	if j.Status != JobRunning || j.StartedAt == nil {
		return false
	}
	return now.Sub(*j.StartedAt) > lease
}

type JobAccepted struct {
	JobID         string    `json:"job_id"`
	Status        JobStatus `json:"status"`
	Position      int       `json:"position"`
	EstimatedWait int       `json:"estimated_wait_seconds"`
	PollAfterMS   int       `json:"poll_after_ms"`
}

type JobState struct {
	JobID         string                 `json:"job_id"`
	Status        JobStatus              `json:"status"`
	Position      int                    `json:"position,omitempty"`
	EstimatedWait int                    `json:"estimated_wait_seconds,omitempty"`
	PollAfterMS   int                    `json:"poll_after_ms,omitempty"`
	Result        *RecitationCheckResult `json:"result,omitempty"`
	Error         string                 `json:"error,omitempty"`
}
