# Intelligent Notification System - Workflow Guide

## Simple Overview

This system sends smart notifications to users who haven't used the app recently. Instead of using AI, it uses **pre-written templates** and **rules** to decide when and what to send.

---

## File Structure (DDD Monolith)

```
internal/notification/smart/         → Data shapes (NotificationRule, UserContext, NotificationLog)
├── entity.go                        → Structs and types
└── repository.go                    → LogRepository interface

internal/notification/smart/    → Intelligent notification orchestration
├── service.go                       → Main brain: loops users, checks rules, sends
├── rules.go                         → 3 rule definitions with message templates
├── user_fetcher.go                  → Fetches all users + their data from DB
└── scheduler.go                     → Cron job that runs every 60 seconds

internal/notification/smart/
└── mongo_log_repository.go  → MongoDB implementation of LogRepository
```

---

## File Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│  internal/notification/smart/scheduler.go                  │
│  "Runs every 60 seconds, tells service to start working"        │
└────────────────────────┬────────────────────────────────────────┘
                         │ calls
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  internal/notification/smart/service.go                    │
│  "The boss: fetches users, checks rules, sends messages"        │
└───┬──────────────────────┬──────────────────────┬───────────────┘
    │                      │                      │
    │ calls                │ calls                │ calls
    ▼                      ▼                      ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐
│ user_fetcher.go  │ │    rules.go      │ │ mongo_notification_      │
│ (app layer)      │ │  (app layer)     │ │ log_repository.go        │
│                  │ │                  │ │ (infra layer)            │
│ "Get all users   │ │ "Check if user   │ │                          │
│  from DB with    │ │  should receive  │ │ "Save logs + check       │
│  their data"     │ │  this notif"     │ │  cooldown: when was      │
│                  │ │                  │ │  last notification       │
│                  │ │                  │ │  sent to this user?"     │
└──────┬───────────┘ └──────┬───────────┘ └────────────┬─────────────┘
       │                    │                           │
       │                    │                           │
       ▼                    ▼                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  internal/notification/smart/entity.go + repository.go          │
│  "Defines all data shapes used by every file above"             │
│  - UserContext: user's streak, tasks, rank, token               │
│  - NotificationRule: rule + template for one type               │
│  - NotificationLog: record of sent notifications                │
│  - LogRepository interface                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## End-to-End Flow Diagram

```
                    ┌───────────────────────────────────────┐
                    │  Cron Scheduler                       │
                    │  (every 60 seconds)                   │
                    │  internal/notification/smart/    │
                    │         scheduler.go                  │
                    └─────────┬─────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────────────────────────┐
                    │  service.go                            │
                    │  ProcessAllNotifications()             │
                    │  internal/notification/smart/    │
                    └─────────┬─────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌────────────────────┐
│  Fetch Users     │ │  For each    │ │  For each rule     │
│  from DB         │ │  user:       │ │  (3 types):        │
│                  │ │              │ │                    │
│  - tokens        │ │  ┌─────────┐ │ │  1. Check cooldown │
│  - streaks       │ │  │ Check   │ │ │  2. Evaluate rule  │
│  - daily tasks   │ │  │ rules   │ │ │  3. Build message  │
│  - ranks         │ │  └────┬────┘ │ │  4. Send push      │
└──────────────────┘ │       │      │ │  5. Save log       │
                     └───────┼──────┘ └────────────────────┘
                             │
                             ▼
                    ┌───────────────────────────────────────┐
                    │  Push Sent via Expo Push API          │
                    │  (to user's phone)                    │
                    │  internal/platform/push/expo.go │
                    └───────────────────────────────────────┘
```

---

## Step-by-Step Walkthrough

### Step 1: Scheduler Starts (scheduler.go)

```
Every 60 seconds → Cron triggers → calls service.ProcessAllNotifications()
```

### Step 2: Fetch All Users (user_fetcher.go)

One batch of users is fetched with ALL their data in parallel:

```
Database Collections Queried:
├── notification_tokens  → Get users who have push tokens enabled
├── streaks              → Get current streak + last activity time
├── user_daily_tasks     → Get today's task progress (total + completed)
└── progress             → Get user's leaderboard rank

Result: []UserContext  (list of users with all their data attached)
```

### Step 3: Check Each Notification Type (rules.go)

For each user, the system checks 3 rules:

```
┌─────────────────────────────┬─────────────────────────────────────────────┐
│  Notification Type          │  When Does It Trigger?                      │
├─────────────────────────────┼─────────────────────────────────────────────┤
│  DailyTaskReminder          │  - Has pending tasks today                  │
│                             │  - Last activity > 4 hours ago              │
│                             │  - Cooldown: 6 hours                        │
├─────────────────────────────┼─────────────────────────────────────────────┤
│  StreakWarning              │  - Streak > 3 days                          │
│                             │  - Missed today's tasks                     │
│                             │  - Cooldown: 12 hours                       │
├─────────────────────────────┼─────────────────────────────────────────────┤
│  FridaySpecial              │  - Today is Friday                          │
│                             │  - Cooldown: 24 hours                       │
└─────────────────────────────┴─────────────────────────────────────────────┘
```

### Step 4: Check Cooldown (mongo_log_repository.go)

Before sending, check: "Did we already send this type of notification recently?"

```
Query: Find last sent log for (user_id + notification_type)
If: time since last send < cooldown → SKIP
Else: Continue to send
```

### Step 5: Build Message (rules.go)

Each rule has a `BuildMessage` function that creates a personalized message:

```go
// Example: StreakWarning message
"Your 7-day streak is at risk. Complete a task today to keep it alive!"
//          ↑ comes from UserContext.CurrentStreak
```

### Step 6: Send Notification (service.go)

```
Send via Expo Push API → User's phone receives notification
```

### Step 7: Save Log (mongo_log_repository.go)

```
Save to notification_logs collection:
{
  user_id: "abc123",
  notification_type: "streak_warning",
  status: "sent",
  message: "Your 7-day streak is at risk...",
  created_at: 2026-05-15T10:30:00Z
}
```

---

## Data Flow: One User Example

```
User: Ahmed
Streak: 7 days
Last Activity: 14 hours ago
Today's Tasks: 3 total, 1 completed

┌──────────────────────────────────────────────────────────────────┐
│  Rule Check Results:                                             │
├──────────────────────────┬──────────┬────────────────────────────┤
│  Rule                    │  Result  │  Reason                    │
├──────────────────────────┼──────────┼────────────────────────────┤
│  DailyTaskReminder       │  SEND    │  2 tasks pending, 14h ago  │
│  StreakWarning           │  SEND    │  7 > 3 streak, missed today│
│  FridaySpecial           │  SKIP    │  Not Friday                │
└──────────────────────────┴──────────┴────────────────────────────┘

Ahmed receives 2 notifications:
1. "You have 2 tasks left today. Keep going!"
2. "Your 7-day streak is at risk. Complete a task today!"
```

---

## Why This Design Is Better

| Old System (AI) | New System (Templates) |
|-----------------|------------------------|
| 30s timeout per user | Instant message generation |
| Needs Ollama server running | No external dependencies |
| Unpredictable messages | Consistent, controlled tone |
| One notification type | 3 notification types |
| Fetches users per type | Fetches users once |
| No per-type cooldown | Per-type cooldown tracking |

---

## Adding a New Notification Type

To add a 5th type, you only need to:

1. Add a new constant in `model.go`:
```go
NewNotification NotificationType = "new_type"
```

2. Add a new rule in `rules.go`:
```go
{
    Type:     NewNotification,
    Cooldown: 24 * time.Hour,
    Evaluate: func(ctx *UserContext, now time.Time) bool {
        // your logic here
    },
    BuildTitle: func(ctx *UserContext) string {
        return "Your title"
    },
    BuildMessage: func(ctx *UserContext) string {
        return "Your message"
    },
}
```

That's it. The service automatically picks it up.
