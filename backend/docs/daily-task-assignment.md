# How Daily Task Assignment Works

## The Problem

We have **10 master tasks** (templates) in the database. Every day, each user should get **5 tasks** to do. But we don't want every user getting the same 5 tasks — we want variety.

---

## The Approach: Deterministic Random Pick + Cache for the Day

Here's the step-by-step flow when a user opens their daily tasks:

### Step 1: Check if tasks already assigned today

```
GET /api/v1/daily-tasks
```

First thing we do is check: "Does this user already have tasks assigned for today?"

```go
assignments, err := s.repo.GetUserDailyTasks(ctx, userID, today)
```

- We look in the `user_daily_tasks` collection for records matching `user_id` + `date` (today's date like "2026-04-20").
- If records exist → skip to Step 4 (return them).
- If no records → go to Step 2 (generate new assignments).

### Step 2: Pick 5 tasks (1 fixed + 4 random)

We have two types of tasks:

| Type | Count | Example |
|------|-------|---------|
| **Fixed** (always included) | 1 | "Pray Fajr" — `is_fixed: true` |
| **Pool** (randomly picked) | 9 | "Read 3 Ayahs", "Quick Quiz", etc. |

We always include the fixed task(s), then pick from the pool to fill up to 5.

```go
var fixed []model.DailyTask   // Tasks with is_fixed = true
var pool []model.DailyTask    // Everything else

for _, t := range allTasks {
    if t.IsFixed {
        fixed = append(fixed, t)
    } else {
        pool = append(pool, t)
    }
}
```

### Step 3: Deterministic shuffle (the smart part)

We don't use pure random. We use a **seeded random number generator**:

```go
rng := rand.New(rand.NewSource(int64(hashString(userID + today))))
rng.Shuffle(len(pool), func(i, j int) { pool[i], pool[j] = pool[j], pool[i] })
```

**What does this mean?**

- We create a seed by hashing `userID + today's date`.
- Example: `hashString("abc123" + "2026-04-20")` → always gives the same number.
- This means: **same user + same day = same shuffle order = same 4 tasks picked**.
- But: **different day = different seed = different 4 tasks**.
- And: **different user = different seed = different 4 tasks**.

This gives us:
- **Consistency**: User sees the same tasks all day, even if they close and reopen the app.
- **Variety**: Different users get different task sets each day.
- **Fairness**: Over multiple days, every task gets rotated in.

### Step 4: Save and return

Once we pick the 5 tasks, we save them as `UserDailyTask` records:

```go
// Each assignment looks like:
{
    id:         "uuid-here",
    user_id:    "user123",
    task_id:    "3",           // reference to master task
    date:       "2026-04-20",
    completed:  false,
    created_at: now
}
```

We save all 5 at once using `UpsertUserDailyTasks`. Next time the user opens the app today, Step 1 finds these records and returns them directly — no re-picking needed.

---

## How Task Completion Works

When a user completes a task:

```
POST /api/v1/daily-tasks/:taskID/complete
```

1. **Mark completed**: Set `completed = true` and `completed_at = now` in `user_daily_tasks`.
2. **Award XP**: Add the task's `reward_xp` to the user's total XP in the `progress` collection.
3. **Update streak**: Check if the user completed tasks yesterday. If yes, increment streak. If they skipped a day, reset to 1.
4. **Publish event**: Send a Kafka message so the worker can log it (and later do badges, notifications, etc.).
5. **Double-complete protection**: If a task is already completed, it just returns success without awarding XP again.

---

## Database Collections Involved

| Collection | Purpose |
|-----------|---------|
| `daily_tasks` | 10 master templates (seeded on startup) |
| `user_daily_tasks` | User assignments per day (5 per user per day) |
| `progress` | User's total XP, level, barakah score |
| `streaks` | User's current streak, longest streak, last completed date |

### Indexes

- `user_daily_tasks`: Composite index on `(user_id, date)` — fast lookup for "what are my tasks today?"
- `progress`: Unique index on `user_id`
- `streaks`: Unique index on `user_id`

---

## Visual Flow

```
User opens app → GET /daily-tasks
                      │
                      ▼
           ┌─────────────────────┐
           │ Any tasks assigned   │
           │ for today?           │
           └──────┬──────────────┘
                  │
          ┌───────┴───────┐
          │ YES           │ NO
          │               │
          ▼               ▼
    Return them    ┌──────────────┐
                   │ Load all 10  │
                   │ master tasks │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Split into:  │
                   │ Fixed (1)    │
                   │ Pool (9)     │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Seed RNG     │
                   │ with hash of │
                   │ userID+date  │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Shuffle pool │
                   │ Pick first 4 │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ 1 fixed +    │
                   │ 4 random =   │
                   │ 5 tasks      │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Save to DB   │
                   │ Return to    │
                   │ user         │
                   └──────────────┘
```

---

## Why this approach?

| Approach | Pros | Cons |
|----------|------|------|
| **Same 5 tasks for everyone** | Simple | Boring, no variety |
| **Pure random every API call** | Maximum variety | User sees different tasks on refresh, confusing |
| **Our approach (seeded random + persist)** | Variety across users and days, consistent within a day | Slightly more complex, but worth it |

### Key Benefits:
1. **User sees same tasks all day** — no confusion on refresh.
2. **Different users get different mixes** — feels personal.
3. **Different days = different tasks** — keeps it fresh.
4. **Fajr is always there** — core Islamic practice never missed.
5. **Scalable** — works the same whether you have 10 or 100,000 users.

---

## The Hash Function

```go
func hashString(s string) uint32 {
    var h uint32
    for _, c := range s {
        h = h*31 + uint32(c)
    }
    return h
}
```

Simple string hash (same as Java's `String.hashCode()`). Takes `"user123 + 2026-04-20"` and turns it into a number like `2847193`. This number seeds the random generator so the shuffle is always the same for that user on that day.
