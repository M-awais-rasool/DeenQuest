# Why We Use Kafka (Event System)

## What is Kafka doing here?

Kafka is a **message queue**. Think of it like a post office — one service drops a letter (event), and another service picks it up later and does something with it.

In our app, when something important happens (like a user signs up or completes a task), we don't do ALL the work right there. Instead, we send a small message to Kafka saying "hey, this thing happened." A separate **Worker Service** picks up that message and handles the extra work.

---

## Which services publish events?

### 1. Auth Service (Identity Service)

| When | Event Topic | What's in the message |
|------|------------|----------------------|
| User signs up | `user.created` | user_id, email, role |

### 2. Core Service

| When | Event Topic | What's in the message |
|------|------------|----------------------|
| User completes a daily task | `habit.completed` | user_id, task_id, xp |
| Streak gets updated | `streak.updated` | full streak object |
| User completes a level | `level.completed` | user_id, level_id, stars, xp |

---

## Who consumes (reads) these events?

The **Worker Service** listens to 4 Kafka topics:

| Topic | What the worker does |
|-------|---------------------|
| `user.created` | Logs the event (future: send welcome email, create default progress) |
| `habit.completed` | Logs the event (future: check badge triggers, send push notification) |
| `streak.updated` | Logs the event (future: award streak badges, leaderboard update) |
| `notification.send` | Logs the event (future: actually send push/email notifications) |

Right now the worker is mostly **logging events to MongoDB** in a `job_logs` collection. This gives us an audit trail and makes it easy to add real features later.

The worker also runs a **daily scheduler** (cron) that ticks every 24 hours for tasks like daily resets.

---

## Why not just do everything directly?

Here's the problem without Kafka:

```
User completes a task
  → Update completion in DB ✓
  → Award XP ✓
  → Update streak ✓
  → Check if badge earned ← slow
  → Send push notification ← slow, might fail
  → Update leaderboard ← slow
```

If all this runs in one request, the user waits for everything. If the push notification service is down, the whole request fails.

### With Kafka:

```
User completes a task
  → Update completion in DB ✓
  → Award XP ✓  
  → Update streak ✓
  → Send "habit.completed" event to Kafka ← instant
  → Return success to user ← fast response

Worker (in background):
  → Pick up "habit.completed" event
  → Check badge triggers
  → Send push notification
  → Update leaderboard
  → Log everything
```

The user gets a fast response. The heavy/risky stuff happens in the background.

---

## What happens if we remove Kafka?

| Feature | Impact |
|---------|--------|
| **App still works** | Yes, the core flow (complete task, get XP, streak) is all done directly in the Core Service. Kafka is only used for side-effects. |
| **No audit log** | We lose the `job_logs` collection that tracks every event. No history of what happened. |
| **No background processing** | Future features like push notifications, badge checking, leaderboard updates would need to run inline (slower API responses). |
| **No daily reset cron** | The scheduler in the worker runs daily jobs. Without it, you'd need a separate cron setup. |
| **Harder to scale** | With Kafka, you can run 5 workers to handle load. Without it, all processing is tied to the API server. |

### Short answer:

**If you remove Kafka today, the app works fine.** The critical path (complete task → award XP → update streak) doesn't depend on Kafka. But as the app grows and you add notifications, badges, leaderboards — you'll need it.

---

## How the flow looks in code

### Publishing (Core Service)

```go
// After completing a daily task successfully:
s.publisher.Publish(ctx, "habit.completed", queue.Event{
    Type: "daily_task.completed",
    Payload: map[string]interface{}{
        "user_id": userID,
        "task_id": taskID,
        "xp":      task.RewardXP,
    },
})
```

The `Publish` call is fire-and-forget — if Kafka is down, it logs an error but doesn't break the user's flow.

### Consuming (Worker Service)

```go
// Worker picks up the event and processes it:
func (c *Consumer) HandleHabitCompleted(ctx context.Context, event queue.Event) error {
    logger.Info("worker handled habit.completed")
    c.jobRepo.Save(ctx, "habit.completed", event.Type, event.Payload, "processed", "")
    return nil
}
```

---

## Architecture Diagram

```
┌──────────────┐     POST /signup      ┌──────────────┐
│   Mobile App │ ──────────────────────►│ Auth Service  │
│   (Expo)     │                        │              │
│              │     POST /complete     │  Publishes:  │
│              │ ──────────────────────►│ user.created │
│              │                        └──────┬───────┘
│              │     POST /complete            │
│              │ ──────────────────────►┌──────▼───────┐
│              │                        │ Core Service  │
│              │◄──────────────────────│              │
│              │   { xp, streak }      │  Publishes:  │
└──────────────┘                        │ habit.completed│
                                        │ streak.updated │
                                        │ level.completed│
                                        └──────┬───────┘
                                               │
                                        ┌──────▼───────┐
                                        │    Kafka      │
                                        │  (Message Q)  │
                                        └──────┬───────┘
                                               │
                                        ┌──────▼───────┐
                                        │Worker Service │
                                        │              │
                                        │ • Logs events │
                                        │ • Future:    │
                                        │   badges,    │
                                        │   push notif,│
                                        │   leaderboard│
                                        └──────────────┘
```
