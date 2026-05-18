# Learning Agent — Full System Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Complete Workflow](#complete-workflow)
4. [Kafka Event Design](#kafka-event-design)
5. [Learning Agent Consumer Logic](#learning-agent-consumer-logic)
6. [Learning State Model](#learning-state-model)
7. [Decision Engine](#decision-engine)
8. [AI Layer Integration (Ollama)](#ai-layer-integration-ollama)
9. [File Structure & Architecture](#file-structure--architecture)
10. [Purpose of Each File/Module](#purpose-of-each-filemodule)
11. [How the System Is Triggered](#how-the-system-is-triggered)
12. [Data Flow & Execution Process](#data-flow--execution-process)
13. [Scalability & Reusable Architecture](#scalability--reusable-architecture)
14. [Adding New Agents](#adding-new-agents)

---

## Overview

The **Learning Agent** is an intelligent, event-driven brain for the DeenQuest gamified Islamic learning platform. Instead of relying on cron jobs or polling, it listens to real-time Kafka events produced by user actions, analyzes learning progress, updates user learning state, and decides the next best learning action for each user.

### Key Principles

- **Event-driven**: Every user action becomes a Kafka event; no polling or cron jobs
- **Real-time**: Learning state updates in near real-time after each event
- **Pattern-based**: Decisions are based on aggregated behavior patterns, not single events
- **Modular & Scalable**: Designed as a reusable agent framework for future expansion
- **AI-assisted, not AI-dependent**: Core logic is rule/event-based; AI is used only for enhancement (message generation, feedback text)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEENQUEST ECOSYSTEM                             │
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌───────────────────────────────────┐  │
│  │  Mobile  │    │   Admin  │    │         API Gateway (Gin)         │  │
│  │   App    │    │  Panel   │    │                                   │  │
│  │ (Expo)   │    │ (Vite)   │    │  ┌─────────┐    ┌──────────────┐  │  │
│  └────┬─────┘    └────┬─────┘    │  │  Auth   │    │   Core       │  │  │
│       │               │          │  │ Service │    │   Service    │  │  │
│       └───────┬───────┘          │  └────┬────┘    └──────┬───────┘  │  │
│               │                  │       │                │          │  │
│               ▼                  │       ▼                ▼          │  │
│  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │                        KAFKA BROKER                             │  │  │
│  │                                                                 │  │  │
│  │  Topics:                                                        │  │  │
│  │  - user.task.completed    - user.task.failed                    │  │  │
│  │  - user.task.skipped      - user.level.completed                │  │  │
│  │  - user.level.failed      - user.inactive.detected              │  │  │
│  │  - user.activity.logged   - notification.send                   │  │  │
│  └────┬────────────┬──────────────┬──────────────┬────────────────┘  │  │
│       │            │              │              │                    │  │
│       ▼            ▼              ▼              ▼                    │  │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌──────────────┐         │  │
│  │ Learning │ │  Worker   │ │  Future    │ │  Future      │         │  │
│  │  Agent   │ │  Service  │ │  Agent #1  │ │  Agent #2    │         │  │
│  │(Consumer)│ │(Consumer) │ │            │ │              │         │  │
│  └────┬─────┘ └───────────┘ └────────────┘ └──────────────┘         │  │
│       │                                                              │  │
│       ▼                                                              │  │
│  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │                    DECISION ENGINE OUTPUT                        │  │  │
│  │  - Next task assignment  - Difficulty adjustment                │  │  │
│  │  - Revision required     - Skill focus area                     │  │  │
│  └────┬────────────────────────────────────────────────────────────┘  │  │
│       │                                                               │  │
│       ▼ publishes to                                                  │  │
│  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │              KAFKA: learning.action.decided                      │  │  │
│  └─────────────────────────────────────────────────────────────────┘  │  │
│                                                                       │  │
│  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │                        DATABASES                                │  │  │
│  │  MongoDB: user_learning_states, learning_events, skill_profiles │  │  │
│  │  Redis:    user event buffers, engagement scores, rate limits   │  │  │
│  └─────────────────────────────────────────────────────────────────┘  │  │
└─────────────────────────────────────────────────────────────────────────┘
```

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LEARNING AGENT SYSTEM                     │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │   Event     │   │   Event      │   │   Learning       │  │
│  │  Ingestion  │──▶│  Aggregator  │──▶│   State          │  │
│  │   Layer     │   │   (Buffer)   │   │   Manager        │  │
│  └─────────────┘   └──────────────┘   └────────┬─────────┘  │
│                                                  │          │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────▼─────────┐ │
│  │   Action    │◀──│   Decision   │◀──│   Pattern        │ │
│  │  Publisher  │   │   Engine     │   │   Analyzer       │ │
│  └─────────────┘   └──────────────┘   └──────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AI Layer (Ollama - Optional)            │   │
│  │  - Feedback text generation                         │   │
│  │  - Learning explanation generation                  │   │
│  │  - Encouragement message personalization            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Workflow

### Step-by-Step Flow

```
1. USER ACTION
   User completes a task in the mobile app
        │
        ▼
2. API REQUEST
   POST /daily-tasks/:id/complete → Core Service
        │
        ▼
3. EVENT PRODUCTION
   Core Service publishes to Kafka:
   Topic: user.task.completed
   Payload: { user_id, task_id, category, score, time_spent }
        │
        ▼
4. EVENT CONSUMPTION
   Learning Agent consumes the event in real-time
        │
        ▼
5. EVENT AGGREGATION
   Event is buffered with other recent events for this user
   (window-based: e.g., last 5 events or last 10 minutes)
        │
        ▼
6. STATE UPDATE
   Learning State Manager updates user profile:
   - Skill proficiency scores
   - Engagement level
   - Learning speed metrics
   - Weak/strong area detection
        │
        ▼
7. PATTERN ANALYSIS
   Pattern Analyzer evaluates:
   - Is the user struggling with a specific category?
   - Is engagement dropping?
   - Is the user improving or regressing?
        │
        ▼
8. DECISION
   Decision Engine determines next best action:
   - Assign revision task? (weak area detected)
   - Increase difficulty? (consistent improvement)
   - Send encouragement? (engagement risk)
   - Continue normal path? (healthy progress)
        │
        ▼
9. ACTION PUBLISHING
   Learning Agent publishes decision to Kafka:
   Topic: learning.action.decided
   Payload: { user_id, action_type, target_task, reason }
        │
        ▼
10. DOWNSTREAM REACTION
    - Worker Service: may trigger notification
    - Core Service: updates task assignment
    - Notification Service: sends push if needed
```

---

## Kafka Event Design

### Event Types

| Event | Topic | Producer | Triggered When |
|-------|-------|----------|----------------|
| `task.completed` | `user.task.completed` | Core Service | User finishes a daily task successfully |
| `task.failed` | `user.task.failed` | Core Service | User fails a task or scores below threshold |
| `task.skipped` | `user.task.skipped` | Core Service | User skips a task intentionally |
| `level.completed` | `user.level.completed` | Core Service | User completes all lessons in a level |
| `level.failed` | `user.level.failed` | Core Service | User fails level assessment |
| `inactive.detected` | `user.inactive.detected` | Worker Service | User has been inactive beyond threshold |
| `activity.logged` | `user.activity.logged` | Core Service | Any user learning activity (lesson view, quiz attempt, etc.) |
| `action.decided` | `learning.action.decided` | Learning Agent | Agent decides next action for a user |

### Event Structure (Conceptual)

```json
{
  "type": "task.completed",
  "timestamp": "2026-05-18T10:30:00Z",
  "payload": {
    "user_id": "usr_abc123",
    "task_id": "task_qaida_01",
    "category": "qaida",
    "subcategory": "letter_recognition",
    "score": 85,
    "time_spent_seconds": 120,
    "attempts": 2,
    "difficulty": "easy"
  }
}
```

### Kafka Topic Strategy

```
Topics organized by domain:

user.*          → User behavior events (produced by Core/Worker services)
learning.*      → Learning Agent output events (produced by Learning Agent)
notification.*  → Notification delivery events (produced by any service)

This naming convention allows:
- Easy topic discovery
- Clear producer/consumer boundaries
- Future expansion without conflicts
```

### Topic Subscription Model

```
Learning Agent subscribes to:
├── user.task.completed
├── user.task.failed
├── user.task.skipped
├── user.level.completed
├── user.level.failed
├── user.inactive.detected
└── user.activity.logged

Other services subscribe to:
└── learning.action.decided  ← Learning Agent's output
```

---

## Learning Agent Consumer Logic

### How the Agent Consumes Events

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENT CONSUMPTION LOOP                   │
│                                                             │
│  while (running) {                                          │
│    1. Read message from Kafka topic                         │
│    2. Deserialize into Event struct                         │
│    3. Route to appropriate handler based on event type      │
│    4. Add to user's event buffer                            │
│    5. Check if buffer is ready for analysis                 │
│       (threshold: N events OR time window expired)          │
│    6. If ready → trigger analysis pipeline                  │
│    7. Commit Kafka offset                                   │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Event Aggregation Strategy

The agent does NOT react blindly to every single event. Instead:

```
User Event Buffer (per user, stored in Redis):
┌─────────────────────────────────────────────────────────┐
│ user_id: usr_abc123                                     │
│                                                         │
│ Events:                                                 │
│   [0] task.completed  → qaida/letter_recognition  85%   │
│   [1] task.completed  → qaida/letter_recognition  70%   │
│   [2] task.failed     → qaida/letter_joining    40%     │
│   [3] task.skipped    → tajweed/elongation        -     │
│   [4] task.completed  → qaida/letter_recognition  90%   │
│                                                         │
│ Window: last 10 minutes OR last 5 events               │
│                                                         │
│ Analysis triggers when:                                 │
│   - Buffer reaches 5 events                            │
│   - OR 10 minutes pass since first event in buffer     │
└─────────────────────────────────────────────────────────┘
```

### Pattern Detection Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    PATTERN DETECTION                         │
│                                                             │
│  WEAK AREA DETECTION:                                       │
│  - If avg score in a category < 60% over last N events     │
│  - If failure rate in a subcategory > 40%                  │
│  - If skip rate in a category is increasing                │
│                                                             │
│  STRONG AREA DETECTION:                                     │
│  - If avg score in a category > 85% consistently           │
│  - If completion time is decreasing (getting faster)       │
│  - If zero failures in last N attempts                     │
│                                                             │
│  LEARNING SPEED:                                            │
│  - Track time-to-competency per category                   │
│  - Compare against baseline averages                       │
│  - Classify: fast_learner / average / needs_support        │
│                                                             │
│  ENGAGEMENT RISK:                                           │
│  - Increasing skip rate                                    │
│  - Decreasing session frequency                            │
│  - Declining scores over time                              │
│  - Long gaps between activities                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Learning State Model

### User Learning Profile Structure

```json
{
  "user_id": "usr_abc123",
  "updated_at": "2026-05-18T10:30:00Z",
  
  "skill_profile": {
    "qaida": {
      "letter_recognition": { "proficiency": 0.85, "attempts": 12, "avg_score": 87 },
      "letter_joining":     { "proficiency": 0.40, "attempts": 8,  "avg_score": 42 },
      "basic_vowels":       { "proficiency": 0.65, "attempts": 5,  "avg_score": 68 }
    },
    "tajweed": {
      "elongation":         { "proficiency": 0.30, "attempts": 3,  "avg_score": 35 },
      "ghunnah":            { "proficiency": 0.55, "attempts": 6,  "avg_score": 58 }
    }
  },
  
  "engagement": {
    "level": "at_risk",
    "score": 0.35,
    "last_active": "2026-05-17T14:00:00Z",
    "session_frequency_7d": 2,
    "skip_rate_7d": 0.40
  },
  
  "learning_speed": {
    "classification": "needs_support",
    "avg_time_to_mastery_days": 14,
    "categories_mastered": 3,
    "categories_in_progress": 5
  },
  
  "weak_areas": ["letter_joining", "elongation"],
  "strong_areas": ["letter_recognition"],
  
  "current_level": 5,
  "recommended_next_action": {
    "type": "revision",
    "category": "qaida",
    "subcategory": "letter_joining",
    "difficulty": "easy"
  }
}
```

### State Evolution Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE EVOLUTION CYCLE                     │
│                                                             │
│  Initial State (new user):                                  │
│  - All skills: proficiency = 0.0                           │
│  - Engagement: level = "neutral", score = 0.5              │
│  - Learning speed: classification = "unknown"              │
│                                                             │
│  After Each Event Batch:                                    │
│  1. Update skill proficiencies (weighted average)          │
│  2. Recalculate engagement score                           │
│  3. Update learning speed classification                   │
│  4. Re-evaluate weak/strong areas                          │
│  5. Generate recommended next action                       │
│                                                             │
│  Decay Mechanism (optional, time-based):                   │
│  - Skills not practiced for 7+ days: -5% proficiency       │
│  - Engagement score decays with inactivity                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Decision Engine

### Decision Rules by User Type

```
┌─────────────────────────────────────────────────────────────┐
│                    DECISION ENGINE RULES                     │
│                                                             │
│  WEAK USER (avg proficiency < 50%):                         │
│  ├── Priority: Revision of weak areas                      │
│  ├── Action: Assign easier difficulty tasks                │
│  ├── Frequency: More frequent, shorter sessions            │
│  └── Support: AI-generated encouragement messages          │
│                                                             │
│  ACTIVE USER (engagement = "high", improving):             │
│  ├── Priority: Progress to next challenge                  │
│  ├── Action: Increase difficulty gradually                 │
│  ├── Frequency: Normal pace                                │
│  └── Support: Celebratory feedback                         │
│                                                             │
│  INACTIVE USER (last active > 48h):                        │
│  ├── Priority: Re-engagement                               │
│  ├── Action: Assign familiar, easy tasks                   │
│  ├── Frequency: Notification-triggered return              │
│  └── Support: Personalized re-engagement message           │
│                                                             │
│  IMPROVING USER (trend upward over 7 days):                │
│  ├── Priority: Maintain momentum                           │
│  ├── Action: Mix of review + new material                  │
│  ├── Frequency: Normal pace                                │
│  └── Support: Progress milestone feedback                  │
│                                                             │
│  PRIORITIZATION ORDER (always):                            │
│  1. Weak area revision (highest priority)                  │
│  2. Engagement recovery (if at risk)                       │
│  3. Progression to new material                            │
│  4. Reinforcement of strong areas (lowest priority)        │
└─────────────────────────────────────────────────────────────┘
```

### Decision Output Structure

```json
{
  "type": "action.decided",
  "timestamp": "2026-05-18T10:30:00Z",
  "payload": {
    "user_id": "usr_abc123",
    "action_type": "assign_revision",
    "reason": "weak_area_detected",
    "details": {
      "category": "qaida",
      "subcategory": "letter_joining",
      "difficulty": "easy",
      "task_ids": ["task_qj_01", "task_qj_02"],
      "ai_message": "Let's practice joining letters together. You're getting better!"
    }
  }
}
```

---

## AI Layer Integration (Ollama)

### Where AI IS Used

```
┌─────────────────────────────────────────────────────────────┐
│                    AI USAGE AREAS                            │
│                                                             │
│  1. FEEDBACK TEXT GENERATION:                               │
│     - Generate personalized feedback after task completion  │
│     - Input: task result + user learning state              │
│     - Output: Encouraging, context-aware message            │
│                                                             │
│  2. LEARNING EXPLANATIONS:                                  │
│     - Generate explanations for why a user got something    │
│       wrong                                                 │
│     - Input: incorrect answer + correct concept             │
│     - Output: Simple, age-appropriate explanation           │
│                                                             │
│  3. ENCOURAGEMENT MESSAGES:                                 │
│     - Generate motivational messages for at-risk users      │
│     - Input: engagement score + weak areas + streak info    │
│     - Output: Personalized encouragement                    │
└─────────────────────────────────────────────────────────────┘
```

### Where AI is NOT Used

```
┌─────────────────────────────────────────────────────────────┐
│                    AI EXCLUSION ZONES                        │
│                                                             │
│  ❌ DECISION MAKING:                                        │
│     - What task to assign next                              │
│     - When to increase/decrease difficulty                  │
│     - Whether to send a notification                        │
│                                                             │
│  ❌ CORE LOGIC:                                             │
│     - State update calculations                             │
│     - Pattern detection algorithms                          │
│     - Engagement scoring                                    │
│                                                             │
│  ❌ STATE UPDATES:                                          │
│     - Proficiency score calculations                        │
│     - Weak/strong area determination                        │
│     - Learning speed classification                         │
│                                                             │
│  REASON: AI is non-deterministic and slow. Core logic       │
│  must be fast, predictable, and rule-based.                 │
└─────────────────────────────────────────────────────────────┘
```

### AI Integration Point in Pipeline

```
Event → Aggregator → State Update → Pattern Analysis → Decision Engine
                                                                    │
                                                                    ▼
                                                          ┌─────────────────┐
                                                          │  AI LAYER       │
                                                          │  (Optional)     │
                                                          │                 │
                                                          │  Generate:      │
                                                          │  - feedback     │
                                                          │  - explanations │
                                                          │  - messages     │
                                                          └────────┬────────┘
                                                                   │
                                                                   ▼
                                                          Action Publisher
                                                          (publishes to Kafka)
```

---

## File Structure & Architecture

### Proposed Directory Layout

```
backend/
├── internal/
│   └── ai-service/
│       └── agents/
│           └── learning-agent/
│               ├── agent.go              → Agent entry point, lifecycle management
│               ├── config.go             → Agent configuration (thresholds, windows)
│               │
│               ├── consumer/
│               │   ├── consumer.go       → Kafka consumer setup and event loop
│               │   ├── router.go         → Routes events to appropriate handlers
│               │   └── handlers.go       → Event-specific handler functions
│               │
│               ├── aggregator/
│               │   ├── aggregator.go     → Event buffer management per user
│               │   ├── window.go         → Time-window and count-window logic
│               │   └── trigger.go        → Determines when to trigger analysis
│               │
│               ├── state/
│               │   ├── manager.go        → Learning state CRUD operations
│               │   ├── model.go          → Learning state data structures
│               │   ├── calculator.go     → Proficiency and engagement calculations
│               │   └── repository.go     → Interface for state persistence
│               │   └── mongo_repo.go     → MongoDB implementation of repository
│               │   └── redis_repo.go     → Redis implementation for event buffers
│               │
│               ├── analyzer/
│               │   ├── analyzer.go       → Pattern analysis orchestration
│               │   ├── weak_areas.go     → Weak area detection logic
│               │   ├── strong_areas.go   → Strong area detection logic
│               │   ├── engagement.go     → Engagement risk analysis
│               │   └── speed.go          → Learning speed classification
│               │
│               ├── decision/
│               │   ├── engine.go         → Decision engine orchestration
│               │   ├── rules.go          → Decision rules for each user type
│               │   ├── prioritizer.go    → Action prioritization logic
│               │   └── output.go         → Decision output formatting
│               │
│               ├── publisher/
│               │   ├── publisher.go      → Kafka publisher for agent decisions
│               │   └── formatter.go      → Formats decisions into Kafka events
│               │
│               └── ai/
│                   ├── client.go         → Ollama client wrapper
│                   ├── feedback.go       → Feedback text generation
│                   ├── explanation.go    → Learning explanation generation
│                   └── encouragement.go  → Encouragement message generation
│
├── pkg/
│   └── queue/
│       └── kafka.go                    → Shared Kafka producer/consumer (existing)
│
└── cmd/
    └── learning-agent/
        └── main.go                     → Learning Agent service entry point
```

---

## Purpose of Each File/Module

### Entry Point & Configuration

| File | Purpose |
|------|---------|
| `agent.go` | Main agent struct, lifecycle management (Start/Stop), wires all components together |
| `config.go` | Configuration struct: buffer sizes, time windows, score thresholds, Kafka settings |

### Consumer Layer

| File | Purpose |
|------|---------|
| `consumer/consumer.go` | Initializes Kafka consumer, runs the main consume loop, handles errors and retries |
| `consumer/router.go` | Switch statement that routes incoming events to the correct handler based on event type |
| `consumer/handlers.go` | Individual handler functions for each event type (task.completed, task.failed, etc.) |

### Aggregator Layer

| File | Purpose |
|------|---------|
| `aggregator/aggregator.go` | Manages per-user event buffers, adds events, checks readiness |
| `aggregator/window.go` | Implements time-window (e.g., 10 min) and count-window (e.g., 5 events) logic |
| `aggregator/trigger.go` | Evaluates whether a user's buffer is ready for analysis pipeline |

### State Layer

| File | Purpose |
|------|---------|
| `state/manager.go` | Orchestrates state reads, updates, and persistence after analysis |
| `state/model.go` | Defines all data structures: LearningState, SkillProfile, Engagement, etc. |
| `state/calculator.go` | Mathematical logic for proficiency scores, engagement scores, decay |
| `state/repository.go` | Interface definition for state persistence (enables swapping DB implementations) |
| `state/mongo_repo.go` | MongoDB implementation of the repository interface |
| `state/redis_repo.go` | Redis implementation for fast event buffer storage |

### Analyzer Layer

| File | Purpose |
|------|---------|
| `analyzer/analyzer.go` | Orchestrates all analyzers, aggregates results into a pattern report |
| `analyzer/weak_areas.go` | Detects categories/subcategories where user is struggling |
| `analyzer/strong_areas.go` | Detects categories where user excels |
| `analyzer/engagement.go` | Calculates engagement risk based on activity patterns |
| `analyzer/speed.go` | Classifies learning speed (fast/average/needs_support) |

### Decision Layer

| File | Purpose |
|------|---------|
| `decision/engine.go` | Main decision engine, takes pattern report and user state, produces decision |
| `decision/rules.go` | Rule definitions for each user type (weak, active, inactive, improving) |
| `decision/prioritizer.go` | Prioritizes actions when multiple actions are applicable |
| `decision/output.go` | Formats the decision into the standard output structure |

### Publisher Layer

| File | Purpose |
|------|---------|
| `publisher/publisher.go` | Publishes decisions to Kafka topic `learning.action.decided` |
| `publisher/formatter.go` | Converts internal decision struct into Kafka event payload |

### AI Layer

| File | Purpose |
|------|---------|
| `ai/client.go` | Wrapper around existing `pkg/ollama` for LLM calls |
| `ai/feedback.go` | Generates personalized feedback text after task events |
| `ai/explanation.go` | Generates learning explanations for incorrect answers |
| `ai/encouragement.go` | Generates motivational messages for at-risk users |

---

## How the System Is Triggered

### Trigger Chain

```
1. USER INTERACTION (Mobile App)
   User completes/fails/skips a task or level
        │
        ▼
2. API ENDPOINT (Core Service)
   POST /daily-tasks/:id/complete
   POST /levels/:id/lessons/complete
   POST /levels/:id/complete
        │
        ▼
3. EVENT PRODUCTION (Core Service)
   Core Service publishes event to Kafka topic
   Uses pkg/queue/kafka.go KafkaProducer
        │
        ▼
4. EVENT CONSUMPTION (Learning Agent)
   Learning Agent consumer is always running
   Listens to all user.* topics
   Processes events as they arrive (real-time)
        │
        ▼
5. ANALYSIS PIPELINE (Automatic)
   Triggered when event buffer reaches threshold
   No manual trigger needed — fully automatic
        │
        ▼
6. DECISION OUTPUT (Learning Agent)
   Decision published to learning.action.decided
   Other services can react to this event
```

### Service Startup

```
cmd/learning-agent/main.go
        │
        ▼
1. Load configuration (config.go)
2. Initialize Kafka consumer (consumer.go)
3. Initialize state repositories (mongo_repo.go, redis_repo.go)
4. Initialize AI client (ai/client.go) — optional, graceful degradation if unavailable
5. Start consumer loop (blocking)
6. On SIGTERM/SIGINT: graceful shutdown, commit offsets, close connections
```

---

## Data Flow & Execution Process

### Full End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXECUTION FLOW DIAGRAM                               │
│                                                                             │
│  ┌─────────┐     ┌─────────┐     ┌─────────────────────────────────────┐   │
│  │  User   │────▶│  Core   │────▶│  KAFKA: user.task.completed         │   │
│  │  Action │     │ Service │     │  { user_id, task_id, score, ... }   │   │
│  └─────────┘     └─────────┘     └──────────────┬──────────────────────┘   │
│                                                  │                          │
│                                                  ▼                          │
│                                   ┌──────────────────────────────┐          │
│                                   │  LEARNING AGENT CONSUMER     │          │
│                                   │                              │          │
│                                   │  1. Read event from Kafka    │          │
│                                   │  2. Deserialize              │          │
│                                   │  3. Route to handler         │          │
│                                   │  4. Add to user buffer       │          │
│                                   └──────────────┬───────────────┘          │
│                                                  │                          │
│                                    Buffer Ready? │ Yes                      │
│                                                  ▼                          │
│                                   ┌──────────────────────────────┐          │
│                                   │  AGGREGATOR                  │          │
│                                   │  - Collect last N events     │          │
│                                   │  - Group by category         │          │
│                                   │  - Calculate aggregates      │          │
│                                   └──────────────┬───────────────┘          │
│                                                  │                          │
│                                                  ▼                          │
│                                   ┌──────────────────────────────┐          │
│                                   │  STATE MANAGER               │          │
│                                   │  - Read current state        │          │
│                                   │  - Update proficiencies      │          │
│                                   │  - Update engagement         │          │
│                                   │  - Persist to MongoDB        │          │
│                                   └──────────────┬───────────────┘          │
│                                                  │                          │
│                                                  ▼                          │
│                                   ┌──────────────────────────────┐          │
│                                   │  PATTERN ANALYZER            │          │
│                                   │  - Detect weak areas         │          │
│                                   │  - Detect strong areas       │          │
│                                   │  - Assess engagement risk    │          │
│                                   │  - Classify learning speed   │          │
│                                   └──────────────┬───────────────┘          │
│                                                  │                          │
│                                                  ▼                          │
│                                   ┌──────────────────────────────┐          │
│                                   │  DECISION ENGINE             │          │
│                                   │  - Apply rules for user type │          │
│                                   │  - Prioritize actions        │          │
│                                   │  - Generate decision         │          │
│                                   └──────────────┬───────────────┘          │
│                                                  │                          │
│                                    ┌─────────────┴─────────────┐            │
│                                    ▼                           ▼            │
│                          ┌──────────────────┐    ┌──────────────────┐      │
│                          │  AI LAYER        │    │  PUBLISHER       │      │
│                          │  (Optional)      │    │                  │      │
│                          │  Generate:       │    │  Format decision │      │
│                          │  - feedback      │    │  Publish to      │      │
│                          │  - explanations  │    │  Kafka           │      │
│                          │  - messages      │    │                  │      │
│                          └────────┬─────────┘    └────────┬─────────┘      │
│                                   │                       │                │
│                                   └───────────┬───────────┘                │
│                                               ▼                            │
│                              ┌──────────────────────────────┐              │
│                              │  KAFKA: learning.action      │              │
│                              │  .decided                    │              │
│                              │  { user_id, action, reason } │              │
│                              └──────────────┬───────────────┘              │
│                                             │                              │
│                              ┌──────────────┼───────────────┐              │
│                              ▼              ▼               ▼              │
│                         ┌─────────┐   ┌──────────┐   ┌───────────┐        │
│                         │ Worker  │   │  Core    │   │ Notif.    │        │
│                         │ Service │   │ Service  │   │ Service   │        │
│                         │         │   │          │   │           │        │
│                         │ May     │   │ Updates  │   │ May send  │        │
│                         │ send    │   │ task     │   │ push to   │        │
│                         │ push    │   │ assign.  │   │ user      │        │
│                         └─────────┘   └──────────┘   └───────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Storage Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA STORAGE LAYERS                      │
│                                                             │
│  REDIS (Fast, Temporary):                                   │
│  ├── Key: learning:buffer:{user_id}                         │
│  ├── Value: JSON array of recent events                     │
│  ├── TTL: 15 minutes (auto-cleanup)                         │
│  └── Purpose: Event aggregation buffer                      │
│                                                             │
│  MONGODB (Persistent):                                      │
│  ├── Collection: user_learning_states                       │
│  │   └── Document: Full learning profile per user           │
│  ├── Collection: learning_events                            │
│  │   └── Document: Raw event log for analytics              │
│  └── Collection: skill_profiles                             │
│      └── Document: Detailed skill breakdown (optional)      │
│                                                             │
│  KAFKA (Ephemeral, Streaming):                              │
│  ├── Input topics: user.* (consumed, offsets committed)     │
│  └── Output topics: learning.action.decided (produced)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability & Reusable Architecture

### Agent Framework Design

The Learning Agent is built as a **pluggable agent** within a larger agent framework. This means:

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT FRAMEWORK                           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Agent Registry                        │  │
│  │  - Maintains list of all active agents                │  │
│  │  - Manages agent lifecycle (start, stop, restart)     │  │
│  │  - Routes events to subscribed agents                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Learning    │ │  Notification│ │  Future      │        │
│  │  Agent       │ │  Agent       │ │  Agent #N    │        │
│  │              │ │  (existing)  │ │              │        │
│  │  Subscribes: │ │  Subscribes: │ │  Subscribes: │        │
│  │  user.*      │ │  learning.*  │ │  (custom)    │        │
│  │              │ │              │ │              │        │
│  │  Publishes:  │ │  Publishes:  │ │  Publishes:  │        │
│  │  learning.*  │ │  notif.*     │ │  (custom)    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### How to Add a New Agent

```
Step 1: Create agent directory
  backend/internal/ai-service/agents/new-agent/

Step 2: Implement agent interface
  type Agent interface {
      Name() string
      SubscribedTopics() []string
      HandleEvent(ctx context.Context, event queue.Event) error
      Start(ctx context.Context) error
      Stop() error
  }

Step 3: Register agent
  Add to Agent Registry in agent.go

Step 4: Configure topics
  Define which Kafka topics the agent subscribes to

Step 5: Deploy
  Agent is automatically picked up by the framework
```

### Reusable Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED COMPONENTS                         │
│                                                             │
│  pkg/queue/kafka.go                                         │
│  ├── KafkaProducer (reuse for any agent that publishes)     │
│  ├── KafkaConsumer (reuse for any agent that consumes)      │
│  └── Event struct (standard event format)                   │
│                                                             │
│  pkg/logger/                                                │
│  └── Structured logging (reuse across all agents)           │
│                                                             │
│  pkg/config/                                                │
│  └── Configuration loading (reuse across all agents)        │
│                                                             │
│  pkg/ollama/                                                │
│  └── AI client (reuse for any agent that needs AI)          │
│                                                             │
│  internal/ai-service/agents/learning-agent/state/           │
│  ├── repository.go (interface — reusable pattern)           │
│  └── mongo_repo.go (implementation — reusable pattern)      │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Strategies

```
┌─────────────────────────────────────────────────────────────┐
│                    SCALING APPROACHES                       │
│                                                             │
│  HORIZONTAL SCALING (Kafka Consumer Groups):                │
│  - Multiple Learning Agent instances can run simultaneously │
│  - Kafka consumer groups distribute partitions across       │
│    instances automatically                                  │
│  - Each event is processed by exactly one instance          │
│                                                             │
│  PER-USER PARTITIONING:                                     │
│  - Use user_id as Kafka message key                         │
│  - Ensures all events for one user go to same partition     │
│  - Guarantees ordering per user                             │
│                                                             │
│  STATELESS PROCESSING:                                      │
│  - Agent instances are stateless                            │
│  - State is stored in MongoDB/Redis                         │
│  - Any instance can process any user's events               │
│                                                             │
│  BUFFER ISOLATION:                                          │
│  - Redis buffers are per-user, keyed by user_id             │
│  - No cross-user state conflicts                            │
│  - Safe for concurrent processing                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Adding New Agents

### Step-by-Step Guide

```
1. CREATE AGENT STRUCTURE
   mkdir -p backend/internal/ai-service/agents/engagement-agent
   cd backend/internal/ai-service/agents/engagement-agent

2. CREATE FILES
   ├── agent.go          → Main agent struct, implements Agent interface
   ├── config.go         → Agent-specific configuration
   ├── consumer/         → Kafka consumer setup
   ├── handler.go        → Event handling logic
   ├── analyzer/         → Analysis logic (if needed)
   ├── publisher/        → Event publishing (if needed)
   └── model.go          → Data structures

3. IMPLEMENT AGENT INTERFACE
   type EngagementAgent struct {
       config   *Config
       consumer *queue.KafkaConsumer
       producer *queue.KafkaProducer
       // ... other dependencies
   }

   func (a *EngagementAgent) Name() string {
       return "engagement-agent"
   }

   func (a *EngagementAgent) SubscribedTopics() []string {
       return []string{"user.activity.logged", "user.task.completed"}
   }

   func (a *EngagementAgent) HandleEvent(ctx context.Context, event queue.Event) error {
       // Process event
   }

   func (a *EngagementAgent) Start(ctx context.Context) error {
       // Start consumer loop
   }

   func (a *EngagementAgent) Stop() error {
       // Graceful shutdown
   }

4. REGISTER AGENT
   In backend/internal/ai-service/agents/agent.go:
   
   var agents = []Agent{
       &learningagent.Agent{},
       &engagementagent.Agent{},  // Add new agent
   }

5. CONFIGURE
   Add agent-specific config to environment or config file

6. DEPLOY
   Agent is automatically started with the service
```

### Agent Communication Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    INTER-AGENT COMMUNICATION                │
│                                                             │
│  Agents communicate ONLY through Kafka (loose coupling):    │
│                                                             │
│  Learning Agent ──publishes──▶ learning.action.decided      │
│       │                                                     │
│       ▼ subscribes                                          │
│  Engagement Agent ──consumes──▶ updates engagement scores   │
│       │                                                     │
│       ▼ publishes                                           │
│  engagement.score.updated                                   │
│       │                                                     │
│       ▼ subscribes                                          │
│  Notification Agent ──consumes──▶ may trigger notification  │
│                                                             │
│  Benefits:                                                  │
│  - No direct dependencies between agents                    │
│  - Agents can be added/removed independently                │
│  - Each agent can scale independently                       │
│  - Failure in one agent doesn't cascade                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

The Learning Agent is designed as a modular, event-driven system that:

1. **Listens** to user behavior events via Kafka in real-time
2. **Aggregates** events per user using time/count windows
3. **Analyzes** patterns to detect weak areas, engagement risk, and learning speed
4. **Updates** user learning state in MongoDB
5. **Decides** the next best action using rule-based decision engine
6. **Publishes** decisions to Kafka for other services to react
7. **Optionally enhances** output with AI-generated text (Ollama)

The architecture is designed for **future expansion**:
- New agents can be added by implementing the `Agent` interface
- Agents communicate only through Kafka (loose coupling)
- Shared components (Kafka, logging, config, AI client) are reusable
- Horizontal scaling is supported via Kafka consumer groups
