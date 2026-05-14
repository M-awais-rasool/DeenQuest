You are a senior backend engineer. We are building an Intelligent Notification System in Go using Cron Jobs, Rule Engine, and Ollama (local LLM) for message generation.

IMPORTANT:
You must follow steps in order.
Do NOT skip steps.
Do NOT change architecture unless required.
Each step builds on previous step.

We already have a Notification Service that can send push notifications (FCM abstraction is ready).

Goal:
Build a complete intelligent notification system that:
- checks user activity using cron
- decides which users need notifications
- generates messages using Ollama
- sends via existing notification service

-----------------------------------------
STEP 1 — PROJECT FOLDER STRUCTURE
-----------------------------------------

First create a clean Go project structure:

Explain briefly what each folder does.

DO NOT write full code yet. Only structure + explanation.

-----------------------------------------
STEP 2 — CRON JOB SYSTEM
-----------------------------------------

Now implement cron system:

Requirements:
- Use Go cron library (robfig/cron)
- Run every 10 minutes
- Trigger main notification cycle function: RunNotificationCycle()

Include:
- scheduler setup
- worker initialization
- clean separation of cron logic

Provide clean Go code only for scheduler module.

-----------------------------------------
STEP 3 — USER ACTIVITY FETCHING SYSTEM
-----------------------------------------

Now build user activity module.

Requirements:
- Fetch users from DB
- Get:
  - last_active
  - streak
  - tasks_completed_today
  - weak_area
- Support batch processing (avoid loading all users at once)

Add:
- function: GetInactiveUsers()
- function: GetActiveUsersWithRisk()

Return structured Go code.

-----------------------------------------
STEP 4 — RULE ENGINE (DECISION SYSTEM)
-----------------------------------------

Now build rule engine.

Rules:

1. If user inactive > 1 day → INACTIVITY_NOTIFICATION
2. If streak > 3 and missed today → STREAK_WARNING
3. If weak_area = "quran" → QURAN_REMINDER
4. If user completed milestone → ACHIEVEMENT

Output:
- function: DecideNotificationType(user User) string

Keep logic clean and extendable.

-----------------------------------------
STEP 5 — OLLAMA AI MESSAGE GENERATION
-----------------------------------------

Now integrate Ollama locally.

Requirements:
- Use llama3 or mistral model
- Generate short push notification message
- Max 2 sentences
- Islamic motivational tone
- Based on:
  - streak
  - weak_area
  - notification type

Create:
- function GenerateMessage(user User, notificationType string) string

Include:
- prompt template
- HTTP call to Ollama API (localhost:11434)
- response parsing

IMPORTANT:
If Ollama fails, fallback to default static message.

-----------------------------------------
STEP 6 — NOTIFICATION SENDING SYSTEM
-----------------------------------------

Now connect with existing notification service.

Requirements:
- function SendNotification(userID, title, message)
- integrate with existing service (do not rebuild FCM)
- support batch sending

Add:
- retry mechanism
- logging

-----------------------------------------
STEP 7 — MAIN WORKFLOW (ORCHESTRATION)
-----------------------------------------

Now create main pipeline:

RunNotificationCycle():

Flow:
1. Fetch users
2. Apply rule engine
3. Generate message via Ollama
4. Send notification
5. Log result

Add:
- error handling
- performance optimization
- batching (100 users per batch)

-----------------------------------------
FINAL OUTPUT REQUIREMENT:
-----------------------------------------

- Clean Go code for each step
- Modular architecture
- Production-ready structure
- No unnecessary explanation outside steps  