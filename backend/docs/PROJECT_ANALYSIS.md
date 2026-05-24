# DeenQuest — Complete Project Analysis

> **Date**: 2026-05-24  
> **Project**: DeenQuest (Nuur) — Gamified Islamic Learning Platform  
> **Components**: Mobile App (Expo), Go Backend (Microservices), Landing Page (Vite), Admin Panel (React + Vite)

---

## 1. PROJECT OVERVIEW

DeenQuest (branded as "Nuur" on the landing page) is a **full-stack gamified Islamic learning platform** designed to make daily Islamic growth consistent and rewarding. The system consists of four major components:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **DeenQuestExpo** | React Native + Expo 54 | Mobile app for learners |
| **Backend** | Go 1.22 + Gin + MongoDB | Microservices API + Worker |
| **LandingPage** | React 19 + Vite + Tailwind CSS v4 | Marketing website |
| **Admin Panel** | React 18 + Vite + Tailwind CSS v3 | Content & analytics dashboard |

**Core Value Proposition**: Build Islamic habits through daily missions, Quran Qaida learning, Hadith lessons, Dua memorization, and a comprehensive XP/streak/level gamification system.

---

## 2. MOBILE APP — DeenQuestExpo

### 2.1 Technology Stack

```
Framework:        React Native 0.81.5 + Expo 54.0.33
Language:         TypeScript 5.9.2
Navigation:       React Navigation v7 (Native Stack + Bottom Tabs)
State Management: Redux Toolkit + RTK Query
Storage:          AsyncStorage + MMKV (fast native storage)
Animations:       React Native Reanimated 4.3.0
Haptics:          Expo Haptics
Audio:            Expo AV (audio playback)
Speech:           Expo Speech (TTS)
Push Notifications: Expo Notifications
Icons:            Lucide React Native
Graphics:         React Native SVG, Rive React Native
Deep Linking:     Custom scheme "deenquest://"
```

### 2.2 Design System & Color Palette

The app uses a **dark-first design philosophy** with rich emerald and gold accents. Every color is meticulously defined with alpha variations for layering, shadows, and depth effects.

#### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#161616` | Main app background |
| `surface` | `#1F1F1F` | Cards, elevated surfaces |
| `surfaceLow` | `#1B1B1B` | Subtle cards, streak card bg |
| `surfaceHigh` | `#2A2A2A` | Input backgrounds, subtle elevations |
| `surfaceBright` | `#393939` | Borders, dividers |
| `primary` | `#88D982` | Emerald green — CTAs, XP bars, progress |
| `primaryContainer` | `#2E7D32` | Darker green for button shadows |
| `onPrimary` | `#003909` | Text on primary buttons |
| `secondary` | `#FFDB3C` | Gold — streaks, stars, levels, badges |
| `onSecondary` | `#221B00` | Text on gold elements |
| `text` | `#E2E2E2` | Primary text |
| `textMuted` | `#BFCABA` | Secondary/muted text |
| `outline` | `#40493D` | Borders, inactive states |
| `error` | `#FFB4AB` | Soft error pink |
| `errorStrong` | `#d01818` | Strong error red |
| `errorBright` | `#ff8585` | Bright error for text |
| `errorAccent` | `#FF6B6B` | Accent error coral |

#### Accent Palette

| Color | Hex | Usage |
|-------|-----|-------|
| `cyan` | `#4FC3F7` | Social tasks |
| `lavender` | `#B39DDB` | Dhikr tasks |
| `pink` | `#FFB1C7` | Learning tasks |
| `yellowSoft` | `#FFD54F` | Reflection tasks |
| `magenta` | `#F472B6` | Special highlights |
| `silver` | `#C6D0E0` | Leaderboard 2nd place |
| `bronze` | `#CD7F32` | Leaderboard 3rd place |
| `warning` | `#FF8A65` | Warning states |

#### Alpha Overlays (Critical for Depth)

The theme defines **~60 alpha variations** for creating depth without additional layers:

- `primary05` through `primary90` — Green overlays from 5% to 90%
- `secondary05` through `secondary35` — Gold overlays
- `white05` through `white70` — White overlays
- `black10` through `black35` — Shadow overlays
- `surface60`, `surface80`, `surface82` — Semi-transparent surfaces

**Design Philosophy**: The dark theme reduces eye strain for extended reading sessions (Quran, Hadith). Emerald green evokes Islamic/natural associations. Gold represents achievement and spiritual value.

### 2.3 Typography

- **Primary Font**: System default (SF Pro on iOS, Roboto on Android)
- **Accent Font**: "Lexend" (used for profile name, stats, level badges)
- **Weights**: Heavy use of `fontWeight: "900"` for labels, `700` for body, `800` for emphasis
- **Case Strategy**: Extensive use of `textTransform: "uppercase"` with `letterSpacing` for a premium, gaming aesthetic
- **Scale**:
  - Hero titles: 30px (login), 22px (greeting)
  - Section headers: 16px
  - Body: 14px
  - Micro labels: 9-11px

### 2.4 Spacing & Shape System

```typescript
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
borderRadius: { sm: 8, md: 16, lg: 24, xl: 32, full: 9999 }
```

**Shape Language**:
- Cards: `borderRadius: 16` with `borderBottomWidth: 3-4` to create 3D "lifted" effect
- Buttons: `borderRadius: 10-16` with heavy bottom borders for tactile depth
- Pills/Badges: `borderRadius: 9999` (full round)
- Icons: `borderRadius: 12-14` for icon containers

### 2.5 Screen Architecture

The app has **18+ screens** organized into two navigation layers:

#### Stack Navigator (Root)
- `OnboardingScreen` — First-time user intro
- `Login` — Email/password auth
- `Signup` — Account creation
- `Demo` (Tab Navigator container)
- `DailyTaskDetail` — Individual task view
- `LevelMap` — Course level progression map
- `LevelDetail` — Level info popup
- `LessonPlayer` — Interactive lesson renderer
- `MiniGamePlayer` — Post-lesson games
- `Settings` — App preferences
- `EditProfile` — Profile editing
- `ChangePassword` — Security
- `PublicProfile` — Shared profile view (deep linkable)

#### Bottom Tab Navigator (5 Tabs)
1. **Home** (`HomeScreen`) — Daily missions, streak, XP
2. **Learn** (`LearnPathScreen`) — Course selection
3. **Rewards** (`RewardsScreen`) — Milestones & achievements
4. **Rank** (`LeaderboardScreen`) — Global leaderboard
5. **Profile** (`ProfileScreen`) — Stats, streak history, settings

### 2.6 Custom Tab Bar (Premium UX Detail)

The app features a **fully custom animated bottom tab bar** with:
- **Spring animations** on icon scale (`1.0 → 1.14`) and translateY (`0 → -3`)
- **Animated background pill** that scales and fades behind active tab
- **Opacity transitions** on labels (`0.45 → 1.0`)
- **Haptic feedback** on every tab press (`haptics.light()`)
- **Border top**: 4px solid `surface` color for visual separation
- **Safe area padding**: Extra bottom padding for notched devices

### 2.7 Key Screens Deep Dive

#### Home Screen
- **Streak Card**: 7-day calendar visualization with green checkmarks for completed days, gold highlight for "Today"
- **XP Progress Bar**: Animated fill showing XP to next level (`totalXP % 100`)
- **Daily Missions**: Scrollable list of task cards with:
  - Category-specific colored icons (salah=fire, quran=book, dhikr=circle, learning=graduation cap)
  - "Start" button (primary green) or checkmark (completed)
  - Category badge + XP reward

#### Learning Path Screen
- Vertical scrollable course cards connected by decorative connectors
- Courses: Noorani Qaida (available), Tajweed (locked with visual treatment)
- Each card shows title, subtitle, progress, and lock status

#### Level Map Screen
- Map-style visualization of levels in a course
- Nodes connected by paths (likely SVG-based)
- Level status: locked (gray), available (green), completed (gold star)
- Treasure chests every 5 levels

#### Lesson Player Screen
- **Progress bar** at top with animated fill (`current/total`)
- **Dynamic lesson renderer**: Maps `lesson.component` string to actual React components via `LESSON_COMPONENT_MAP`
- **Fade transitions** between lessons using `Animated.timing`
- **Auto-navigation** to `MiniGamePlayer` after last lesson
- Lessons supported:
  - `LetterIntroComponent` — Arabic letter introduction
  - `LetterFormsComponent` — Letter forms (beginning, middle, end)
  - `DuaCardComponent` — Dua with audio and meaning
  - `HadithComponent` — Hadith cards
  - `QuranReaderComponent` — Quran reading practice
  - `PronunciationComponent` — Voice recording + Whisper AI check
  - `QuizComponent` — Multiple choice quizzes
  - `PrayerChecklistComponent` — Salah tracking
  - `ReflectionComponent` — Journal/reflection prompts
  - `TipsComponent` — Tips and advice
  - `MCQGame`, `TapMatchGame` — Interactive mini-games

#### Profile Screen
- **Avatar**: 128px circular with green border, auto-generated from UI Avatars API if none set
- **Level Badge**: Floating gold pill overlay on avatar
- **Bento Grid Stats**: 2-column layout with Total XP and Barakah Score cards
- **Streak History**: 7-day grid (M T W T F S S) with green checkmarks
- **Reward Vault**: Horizontal scroll of reward pills with progress bar

#### Leaderboard Screen
- **Header card**: "Global Ranking" badge + player count
- **Rank rows**: Rank #, display name, level, XP
- **Top 3 coloring**: Gold (#1), Silver (#2), Bronze (#3)
- **Current user highlight**: Green border + green background tint
- **Pull-to-refresh**: Native RefreshControl

#### Rewards Screen
- **Stats header**: Total XP, unlocked count
- **Milestone list**: Vertical scroll of reward cards with rarity badges (rare/epic/legendary)
- **Unlock modal**: Celebratory overlay with spring animations + haptic success
- **Reward icons**: Crown, flame, gem, trophy, zap (mapped from backend)

### 2.8 State Management (Redux Toolkit + RTK Query)

```
Store Structure:
├── main (slice)
│   ├── isAuthenticated: boolean
│   ├── isLoading: boolean
│   ├── user: AuthUser | null
│   ├── accessToken: string | null
│   ├── error: string | null
│   └── pendingRewardUnlocks: NewlyGrantedReward[]
└── API (RTK Query)
    ├── Auth endpoints (signup, login, profile)
    ├── Daily Tasks endpoints
    ├── Progress endpoints
    ├── Leaderboard endpoints
    ├── Level Journey endpoints
    ├── Recitation endpoints
    └── Rewards endpoints
```

**Key Features**:
- Automatic token injection via `prepareHeaders` (reads from AsyncStorage + Redux state)
- Automatic cache invalidation on mutations (completing a task invalidates Progress, Leaderboard)
- `setupListeners` enables `refetchOnFocus` and `refetchOnReconnect`
- Auth state is **persisted** to AsyncStorage for cold-start restoration

### 2.9 API Integration

Base URL: `http://172.16.29.205:8080` (local dev)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/signup` | POST | Create account |
| `/api/v1/auth/login` | POST | Authenticate |
| `/api/v1/users/me` | GET/PUT | Profile management |
| `/api/v1/daily-tasks` | GET | Today's missions |
| `/api/v1/daily-tasks/:id/complete` | POST | Mark task done |
| `/api/v1/progress/me` | GET | XP, level, streak |
| `/api/v1/leaderboard` | GET | Global rankings |
| `/api/v1/levels` | GET | Course levels list |
| `/api/v1/levels/:id` | GET | Level detail |
| `/api/v1/levels/:id/lessons/complete` | POST | Complete lesson |
| `/api/v1/levels/:id/complete` | POST | Complete level + get rewards |
| `/api/v1/rewards` | GET | All rewards with status |
| `/api/v1/recitation/check` | POST | Upload audio for AI check |
| `/api/v1/notifications/register` | POST | Register push token |

### 2.10 Notification System

- `NotificationBootstrap` component initializes push notification permissions on app start
- Registers Expo push token with backend via `/api/v1/notifications/register`
- Backend sends: Daily task reminders, Streak warnings, Friday Surah Al-Kahf reminders, Leaderboard rank updates

### 2.11 Haptics & Micro-interactions

Every interactive element has tactile feedback:
- `haptics.light()` — Tab presses, toggles, card taps
- `haptics.medium()` — Button presses, submit actions
- `haptics.success()` — Reward unlocks, completions

### 2.12 Deep Linking

URL Scheme: `deenquest://`
- `deenquest://profile/:userId` — Opens public profile
- `deenquest://my-profile` — Opens own profile

---

## 3. BACKEND — Go Microservices

### 3.1 Architecture Overview

```
                    ┌─────────────────┐
                    │   API Gateway   │  (Gin, port 8080)
                    │   (Routing)     │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │   Identity  │   │    Core     │   │   Worker    │
    │  (Auth/JWT) │   │  (Business) │   │(Background) │
    │  port 8081  │   │  port 8082  │   │  port 8083  │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           └────────┬────────┘                 │
                    │                           │
             ┌──────▼──────┐              ┌──────▼──────┐
             │   MongoDB   │              │    Kafka    │
             │  (Primary)  │              │  (Events)   │
             └─────────────┘              └─────────────┘
                    ▲                           │
                    │                      ┌────▼────┐
                    │                      │  Redis  │
                    │                      │ (Cache) │
                    │                      └─────────┘
             ┌──────┴──────┐
             │  Whisper AI   │ (Python/FastAPI, port 8001)
             │ (Speech-to-   │
             │   Text)       │
             └───────────────┘
```

### 3.2 Services Breakdown

#### Gateway Service (`cmd/gateway/`)
- **Purpose**: Single entry point for all client requests
- **Technology**: Gin framework
- **Responsibilities**:
  - Request routing to downstream services
  - JWT validation (middleware)
  - Rate limiting (Redis-backed)
  - CORS handling
  - Request/response logging

#### Identity Service (`internal/identity-service/`)
- **Purpose**: Authentication & user management
- **Endpoints**:
  - `POST /auth/signup` — bcrypt password hashing
  - `POST /auth/login` — JWT access + refresh tokens
  - `POST /auth/refresh` — Token rotation
  - `POST /auth/logout` — Token revocation
  - `GET/PUT /users/me` — Profile CRUD
- **Models**:
  ```go
  type User struct {
    ID           string    `bson:"_id" json:"id"`
    Email        string    `bson:"email" json:"email"`
    PasswordHash string    `bson:"password_hash" json:"-"`
    DisplayName  string    `bson:"display_name" json:"display_name"`
    AvatarURL    string    `bson:"avatar_url" json:"avatar_url"`
    Bio          string    `bson:"bio" json:"bio"`
    Title        string    `bson:"title" json:"title"`
    Role         string    `bson:"role" json:"role"`
    IsVerified   bool      `bson:"is_verified" json:"is_verified"`
    CreatedAt    time.Time `bson:"created_at" json:"created_at"`
  }
  ```

#### Core Service (`internal/core-service/`)
- **Purpose**: All business logic — tasks, levels, progress, rewards
- **Sub-packages**:
  - `controller/` — HTTP handlers
  - `service/` — Business logic
  - `repository/` — MongoDB data access
  - `model/` — Data structures
  - `router/` — Route definitions

**Key Models**:

**DailyTask** (seeded templates):
```go
type DailyTask struct {
    ID             string         // UUID
    Title          string
    Category       TaskCategory   // salah, quran, dhikr, learning, character, social, reflection
    Description    string
    Blocks         []Block        // Structured content blocks
    CompletionType CompletionType // button, auto, quiz
    RewardXP       int
    Difficulty     Difficulty     // easy, medium
    IsFixed        bool           // Always included (e.g., Fajr)
}
```

**Block System** (Content Abstraction):
The backend sends tasks as arrays of typed blocks, making the frontend truly dynamic:
- `TextBlock` — Rich text content
- `AyahBlock` — Quran verse with reference
- `HadithBlock` — Hadith text with narrator chain
- `CounterBlock` — Increment/decrement counter (for dhikr)
- `QuizBlock` — Multiple choice questions
- `AudioBlock` — Audio player with transcript
- `ChecklistBlock` — Multi-item checklist
- `FlashCardBlock` — Flip cards for memorization
- `DragDropBlock` — Interactive ordering
- `MatchBlock` — Pair matching
- `ImageBlock` / `VideoBlock` — Media
- `VoicePracticeBlock` — Record and compare pronunciation

**Level System**:
```go
type Level struct {
    ID           int            // Sequential within course
    CourseType   CourseType   // "qaida" | "tajweed"
    CourseLevel  int           // Display level number
    Title        string
    Theme        string        // Thematic grouping
    Goal         string        // Learning objective
    Lessons      []Lesson      // Ordered lesson steps
    MiniGame     MiniGame      // Post-lesson challenge
    XPReward     int
    UnlockReward string        // Description of unlock
    Difficulty   LevelDifficulty // easy | medium | hard
}
```

**Lesson Types**:
- `qaida` — Arabic alphabet/reading
- `hadith` — Prophet's sayings
- `dua` — Supplications
- `quiz` — Knowledge check
- `pronunciation` — Voice practice (integrates Whisper AI)
- `manners` — Islamic etiquette
- `revision` — Spaced repetition

**Screen Types** (UI layout hints):
- `CHECKLIST`, `QURAN_READER`, `COUNTER`, `HADITH_CARD`
- `QUIZ`, `AUDIO_PLAYER`, `REFLECTION`, `TIPS`, `ACTION`

**Mini Game Types**:
- `tap_match` — Tap matching pairs
- `listen_choose` — Listen and select
- `drag_drop` — Drag and drop ordering
- `repeat_voice` — Voice repetition
- `mcq` — Multiple choice
- `memory_cards` — Card matching game

**Reward System**:
```go
type Reward struct {
    ID          string
    Title       string
    Description string
    Icon        string   // crown|flame|gem|trophy|zap
    Rarity      string   // rare|epic|legendary
    Trigger     RewardTrigger // levels_completed | xp | streak_days
    Required    int      // Threshold to unlock
    XPBonus     int      // Bonus XP on unlock
    SortOrder   int      // Display order
}
```

#### Worker Service (`internal/worker-service/` + `internal/ai-service/`)
- **Purpose**: Background processing and intelligent notifications
- **Technology**: Cron jobs + Kafka consumer
- **Runs every**: 10 minutes
- **Processes**:
  1. Fetches all users from MongoDB (single-pass)
  2. Evaluates against 4 notification rules:
     | Rule | Trigger | Cooldown |
     |------|---------|----------|
     | Daily Task Reminder | Pending tasks + inactive > 4h | 6 hours |
     | Streak Warning | Streak > 3 days + missed today | 12 hours |
     | Friday Special | Today is Friday | 24 hours |
     | Leaderboard Update | User rank improved | 24 hours |
  3. Sends push notifications via Expo Push API
  4. Retry with exponential backoff (3 attempts)

**Key Design Decision**: Template-based messages (no AI dependency) for instant, predictable notifications.

#### Notification Service (`internal/notification-service/`)
- Stores push tokens per user/device
- Platform-aware (iOS/Android/Web)
- Token refresh handling

### 3.3 Database Schema (MongoDB)

**Collections**:
1. `users` — Identity service user records
2. `daily_tasks` — Task templates (seeded)
3. `user_daily_tasks` — Per-user daily assignments
4. `levels` — Level templates (seeded)
5. `user_levels` — Per-user level progress
6. `rewards` — Reward definitions (seeded)
7. `user_rewards` — Unlocked rewards
8. `progress` — Aggregated user stats (XP, level, streak)
9. `notification_tokens` — Expo push tokens
10. `leaderboard` — Denormalized ranking data

### 3.4 AI / Whisper Integration

- **Whisper Service**: Python/FastAPI running OpenAI Whisper (small model)
- **Purpose**: Evaluate user's Quran/Arabic pronunciation
- **Flow**:
  1. App records audio (m4a format)
  2. Uploads to `/api/v1/recitation/check` as multipart form
  3. Backend forwards to Whisper service
  4. Whisper transcribes Arabic text
  5. Backend compares transcript to expected text
  6. Returns: `score` (0-100), `words[]` (with correct/wrong/missing/extra status), `xp_earned`

### 3.5 Infrastructure

**Docker Compose**:
- `zookeeper` — Kafka coordination
- `kafka` — Event streaming (port 9092)
- `redis` — Caching & rate limiting (port 6379, AOF persistence)

**Development Tools**:
- `Air` — Hot reload for Go services
- `tmux` — Multi-service dev layout
- `Makefile` — Comprehensive build/run/test commands
- `Nginx` — Reverse proxy configuration

**Build Output**:
```
backend/build/
├── gateway      # API Gateway binary
├── auth         # Identity service binary
├── core-service # Core business logic binary
└── worker-service # Background worker binary
```

### 3.6 API Versioning

All endpoints under `/api/v1/` prefix.
Response envelope:
```json
{
  "success": true,
  "message": "optional",
  "data": { ... },
  "error": "optional"
}
```

---

## 4. LANDING PAGE

### 4.1 Technology Stack

```
Framework:     React 19.2 + Vite 7.3
Router:        TanStack Router 1.168 (file-based routing)
Query:         TanStack Query 5.83
Styling:       Tailwind CSS 4.2.1 (with @theme inline)
Animations:    Framer Motion 12.38
Icons:         Lucide React 0.575
Forms:         React Hook Form 7.71 + Zod 3.24
Components:    Radix UI primitives (30+ components)
Carousels:     Embla Carousel 8.6
Charts:        Recharts 2.15
Toasts:        Sonner 2.0
Deployment:    Vercel (vercel.json present)
```

### 4.2 Design System

The landing page uses a **spiritual dark aesthetic** that mirrors the app's theme but with web-native enhancements.

#### Color Palette (CSS Custom Properties)

| Token | OKLCH Value | Hex Approx | Usage |
|-------|-------------|------------|-------|
| `background` | `oklch(0.18 0.04 165)` | `#0f1815` | Page background |
| `foreground` | `oklch(0.97 0.01 130)` | `#f5f5f0` | Primary text |
| `card` | `oklch(0.22 0.05 165 / 60%)` | `rgba(28,40,35,0.6)` | Glass cards |
| `primary` | `oklch(0.65 0.18 155)` | `#88D982` | Emerald — CTAs, accents |
| `accent` | `oklch(0.82 0.15 85)` | `#FFDB3C` | Gold — highlights, badges |
| `muted` | `oklch(0.25 0.04 165)` | `#1f2b26` | Subtle backgrounds |
| `muted-foreground` | `oklch(0.72 0.03 150)` | `#b8c4be` | Secondary text |
| `border` | `oklch(1 0 0 / 10%)` | `rgba(255,255,255,0.1)` | Dividers |
| `emerald` | `oklch(0.62 0.17 158)` | `#6ecf7a` | Brand emerald |
| `emerald-glow` | `oklch(0.78 0.2 150)` | `#a8f0a0` | Glowing accents |
| `emerald-deep` | `oklch(0.32 0.09 162)` | `#1a5e2e` | Dark green for text on glow |
| `gold` | `oklch(0.82 0.15 85)` | `#FFDB3C` | Achievement gold |
| `gold-soft` | `oklch(0.9 0.1 92)` | `#fff0a0` | Soft gold highlights |

**Background**: Multi-layer radial gradient creating an ethereal glow:
```css
--gradient-hero:
  radial-gradient(ellipse at top, oklch(0.32 0.12 158 / 0.55), transparent 60%),
  radial-gradient(ellipse at bottom right, oklch(0.55 0.15 95 / 0.18), transparent 55%),
  linear-gradient(180deg, oklch(0.15 0.04 165), oklch(0.12 0.03 165));
```

#### Typography

- **Font Family**: Inter (system fallback)
- **Scale**: 
  - Hero: `text-5xl` → `md:text-7xl`
  - Section titles: `text-3xl` → `md:text-4xl`
  - Body: `text-lg`
  - Micro: `text-xs` with `uppercase tracking-widest`

#### Custom Utilities

```css
.glass         /* Backdrop blur + translucent gradient + subtle border */
.glass-solid   /* Stronger opaque gradient for elevated cards */
.text-gradient-emerald  /* Emerald gradient clipped to text */
.text-gradient-gold     /* Gold gradient clipped to text */
.shimmer-text   /* Animated shimmer effect on text */
```

### 4.3 Sections Breakdown

#### Navbar (Fixed)
- **Glass morphism**: `backdrop-filter: blur(10px)` + rounded pill shape
- **Logo**: Sparkles icon in emerald gradient square + "Nuur" text
- **Links**: Features, How it Works, Levels, Ummah (hidden on mobile)
- **CTA**: "Star on GitHub" button with emerald gradient

#### Hero Section
- **Headline**: "Level Up Your Deen" with `text-gradient-emerald`
- **Subheadline**: "Build Islamic habits, learn Quran Qaida..."
- **CTAs**: "View on GitHub" (primary) + "Fork & Contribute" (secondary glass)
- **Stats row**: "100% Open Source" + "MIT Licensed"
- **Phone mockup**: Floating device image with `animate-float` (6s ease-in-out)
- **Floating cards**: XP earned (+250), Streak (47 days), Daily Mission (Read 3 Ayahs)
- **Background effects**:
  - Large emerald glow orb (blurred, opacity-only pulse)
  - Gold glow orb (static)
  - Dot grid pattern (radial gradient, 40px spacing, 5% opacity)
  - Particle system (14 floating particles)

#### Features Section
- **Grid**: 5 columns on XL, 3 on LG, 2 on SM, 1 on mobile
- **Cards**: Glass morphism with hover lift (`hover:-translate-y-2`) + glow shadow
- **Icons**: 12 gradient icon containers (emerald to emerald-deep)
- **Features listed**:
  1. Daily Islamic Tasks
  2. Quran Qaida Learning
  3. Interactive Mini Games
  4. Hadith Lessons
  5. Daily Duas
  6. XP & Rewards
  7. Streak Tracking
  8. Level Progression
  9. Smart Revision
  10. Gamified Journey

#### How It Works Section
- **Layout**: Alternating zig-zag grid (text left/image right, then reverse)
- **Steps**:
  1. Complete Daily Missions
  2. Earn XP & Rewards
  3. Unlock New Levels
  4. Master the Quran
- **Visual**: Central vertical glowing line connecting steps
- **Step cards**: Large glass squares with gradient icon containers
- **Number badges**: Floating gold circles with step numbers

#### Levels Section
- Showcases the course structure (Qaida → Tajweed progression)

#### Daily Tasks Section
- Shows task card mockups with category icons

#### Gamification Section
- **Stats grid**: 4 cards (Day Streak, Total XP, Achievements, Treasures)
- **Progress showcase**: 
  - Animated progress bars (Quran Reading 85%, Daily Duas 70%, Hadith Lessons 55%)
  - SVG progress ring with gradient stroke (78% weekly goal)
  - `motion.circle` with `strokeDashoffset` animation

#### Mini Games Section
- Interactive game previews

#### Community / Ummah Section
- Social proof and community features

#### Testimonials Section
- User quotes and reviews

#### Download / GitHub CTA Section
- **Large glass-solid card** with dual glow orbs
- **Repo card**: GitHub logo, repo name, Star/Fork buttons
- **Clone command**: Copy-to-clipboard with `$` prompt styling
- **Stats**: TypeScript, MIT License, Contributors, Made with Iman
- **Contributor pitches**: 3-column grid (Ship a feature, Improve content, Spread the word)

#### Footer
- **Quran quote**: "And whoever puts their trust in Allah — He is sufficient for them." (65:3)
- **Logo + tagline**: "Level up your Deen, one mission at a time."
- **Link columns**: Product, Company, Legal
- **Social icons**: Twitter, Instagram, YouTube
- **Copyright**: "© 2026 Nuur. Made with iman."

### 4.4 Animations

| Animation | CSS/JS | Duration | Effect |
|-----------|--------|----------|--------|
| `float` | CSS keyframes | 6s | translateY ±18px |
| `float-slow` | CSS keyframes | 9s | Slower float for background |
| `glow-pulse` | CSS keyframes | 3s | Opacity 0.55 → 0.95 |
| `shimmer` | CSS keyframes | 8s | Background-position shift |
| `fade-up` | CSS keyframes | 0.7s | Opacity + translateY entry |
| `rise` | CSS keyframes | 18s | Particles rising upward |
| Framer Motion | JS | varies | Viewport-triggered fade/scale/slide |

**Performance Optimizations**:
- `will-change: transform` on floating elements
- `will-change: opacity` on glow pulses
- No spin animations (avoid full-section repaints)
- `viewport={{ once: true }}` to prevent re-animation

### 4.5 SEO

Meta tags configured via TanStack Router `head`:
- **Title**: "Nuur — Level Up Your Deen | Gamified Islamic Learning"
- **Description**: "Build Islamic habits, learn Quran Qaida, complete daily missions..."
- **OG Tags**: Open Graph title/description for social sharing

---

## 5. ADMIN PANEL

### 5.1 Technology Stack

```
Framework:     React 18.3 + Vite 5.4
Router:        React Router DOM 6.26
Styling:       Tailwind CSS 3.4
UI Components: Headless UI 2.1 + Heroicons 2.1
Charts:        Chart.js 4.4 + React ChartJS 2
HTTP Client:   Axios 1.7
Notifications: React Hot Toast 2.4
```

### 5.2 Design System

The admin panel uses a **dark navy theme** optimized for data density and long working sessions.

#### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `bg` | `#f8fafc` | `#080a18` | Page background |
| `surface` | `#ffffff` | `#141837` | Cards, panels |
| `text` | `#1e293b` | `#f1f5f9` | Primary text |
| `text-muted` | `#64748b` | `#94a3b8` | Secondary text |
| `border` | `#e2e8f0` | `#1e2654` | Dividers |

#### Tailwind Extended Colors

```javascript
emerald: { 50..950 }  // Full emerald scale
gold: { 50..700 }      // Gold accent scale  
navy: { 50..950 }      // Navy base scale (700: #1a1f4e, 800: #141837, 950: #080a18)
```

#### Component Primitives

```css
.glass-card        /* White 5% bg + backdrop-blur-xl + white/10 border */
.gradient-emerald  /* emerald-500 to emerald-700 */
.gradient-gold     /* gold-400 to gold-600 */
.gradient-navy     /* navy-700 to navy-900 */
.sidebar-link      /* Flex row + padding + rounded-xl + hover:bg-white/10 */
.sidebar-link.active /* emerald-500/20 bg + emerald-400 text */
.table-row         /* Bottom border + hover:bg-white/5 */
.btn-primary       /* emerald-600 bg + rounded-xl + shadow */
.btn-secondary     /* white/10 bg + hover:white/20 */
.input-field       /* white/5 bg + white/10 border + focus:ring-emerald */
.badge             /* Inline-flex + rounded-full */
```

### 5.3 Pages

| Page | Route | Description |
|------|-------|-------------|
| **Login** | `/login` | Admin authentication |
| **Dashboard** | `/` | Analytics overview with charts |
| **Tasks** | `/tasks` | Content list (task type) |
| **Levels** | `/levels` | Content list (level type) |
| **Content Editor** | `/content/new`, `/content/:id` | Create/edit tasks and levels |
| **Themes** | `/themes` | Visual theme management |
| **Rewards** | `/rewards` | Reward configuration |
| **Events** | `/events` | Event/stream monitoring |
| **Audit Logs** | `/audit-logs` | Activity tracking |

### 5.4 Dashboard Deep Dive

**Stats Grid** (4 cards):
1. **Total Users** — emerald gradient, UsersIcon
2. **DAU** (Daily Active Users) — gold gradient, FireIcon
3. **Tasks Completed** — navy gradient, TrophyIcon
4. **Avg Session** — purple gradient, ClockIcon

**Charts**:
- **Line Chart** (2/3 width): "User Activity Trends" — 7-day active users with emerald fill
- **Doughnut Chart** (1/3 width): "Task Completion" — Completed/In Progress/Not Started with 70% cutout

**Quick Stats**:
- Top Completed Tasks list with progress bars
- Average User Streak display (large number with gold gradient text)

### 5.5 Layout

- **Sidebar**: Fixed left navigation with icons and labels
- **Main Content**: Scrollable area with padding
- **Top Bar**: Page title + contextual actions
- **Protected Routes**: Redirects to `/login` if not authenticated

---

## 6. CROSS-CUTTING CONCERNS

### 6.1 Color Consistency Across Components

| Purpose | App | Landing | Admin |
|---------|-----|---------|-------|
| Primary CTA | `#88D982` (emerald) | `oklch(0.78 0.2 150)` | `#10b981` (emerald-500) |
| Achievement/Gold | `#FFDB3C` | `oklch(0.82 0.15 85)` | `#fbbf24` (gold-400) |
| Background | `#161616` | `oklch(0.18 0.04 165)` | `#080a18` (navy-950) |
| Surface | `#1F1F1F` | `oklch(0.22 0.05 165/60%)` | `#141837` (navy-800) |
| Text | `#E2E2E2` | `oklch(0.97 0.01 130)` | `#f1f5f9` (slate-100) |

**Observation**: All three frontend components use the same **dark-spiritual-emerald-gold** aesthetic but adapted to their respective framework's color systems (hex for React Native, OKLCH for Tailwind v4, hex/slate for Tailwind v3).

### 6.2 Gamification Mechanics

| Mechanic | Implementation |
|----------|---------------|
| **XP System** | Every task completion awards XP. Level thresholds at every 100 XP (`totalXP % 100`) |
| **Levels** | Linear progression through courses. 5-level phases with treasure chests |
| **Streaks** | 7-day rolling completion tracking. Break = reset |
| **Leaderboard** | Global ranking sorted by `level DESC, xp DESC` |
| **Rewards** | Milestone-based unlocks (levels completed, total XP, streak days). Rarity tiers: rare/epic/legendary |
| **Barakah Score** | Separate metric for "good deeds" (distinct from XP) |
| **Mini Games** | Post-lesson challenges required to complete a level |
| **Treasure Chests** | Special reward every 5 levels completed |

### 6.3 Content Seeding

The backend includes **seed data** for:
- `seed_levels.go` — Pre-built Qaida and Tajweed levels with lessons
- `seed_tasks.go` — Daily task templates for all categories
- `seed_rewards.go` — Achievement reward definitions

This allows the app to work immediately after deployment without manual content entry.

### 6.4 Security

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT access tokens (short-lived) + refresh tokens |
| Password Storage | bcrypt hashing |
| API Protection | JWT middleware on all protected routes |
| Rate Limiting | Redis-backed rate limiting at gateway |
| Input Validation | Go Playground Validator v10 |
| CORS | Configured at gateway level |

### 6.5 Development Workflow

```bash
# Start all backend services
cd backend && make dev-tmux

# Start mobile app
cd DeenQuestExpo && npm run start

# Start landing page
cd LandingPage && npm run dev

# Start admin panel
cd admin-panel && npm run dev
```

**Build Commands**:
```bash
# Backend
cd backend && make build && make test

# Mobile
cd DeenQuestExpo && npx tsc --noEmit

# Admin
cd admin-panel && npm run build
```

---

## 7. FILE STRUCTURE SUMMARY

```
DeenQuest/
├── DeenQuestExpo/              # Mobile App
│   ├── app/
│   │   ├── components/          # Reusable UI (Header, ScreenWrapper, TactileButton, BlockRenderer, etc.)
│   │   ├── screens/             # 18+ screen components
│   │   │   ├── auth/            # Login, Signup, Onboarding
│   │   │   ├── home/            # HomeScreen
│   │   │   ├── level/           # LearnPath, LevelMap, LessonPlayer, MiniGame
│   │   │   ├── task/            # DailyTask, DailyTaskDetail
│   │   │   ├── profile/         # Profile, Settings, EditProfile, PublicProfile
│   │   │   ├── leaderboard/     # LeaderboardScreen
│   │   │   └── reward/          # RewardsScreen + components
│   │   ├── navigators/          # AppNavigator, DemoNavigator (tabs)
│   │   ├── store/               # Redux + RTK Query
│   │   │   ├── slices/          # mainSlice (auth state)
│   │   │   ├── services/        # API service definitions
│   │   │   └── storage/         # AsyncStorage helpers
│   │   ├── theme/               # themes.ts (comprehensive color system)
│   │   ├── utils/               # haptics, helpers
│   │   └── services/            # notificationService
│   ├── assets/                  # Logos, icons, screenshots, sounds
│   ├── App.js                   # Root component
│   └── app.json                 # Expo configuration
│
├── backend/                     # Go Microservices
│   ├── cmd/                     # Service entry points
│   │   ├── gateway/             # API Gateway
│   │   ├── auth/                # Identity service
│   │   ├── core-service/        # Core business logic
│   │   └── worker-service/      # Background worker
│   ├── internal/                # Private service code
│   │   ├── core-service/        # Controllers, services, repositories, models
│   │   ├── identity-service/    # Auth logic, user management
│   │   ├── worker-service/      # Cron jobs, notification scheduler
│   │   ├── notification-service/ # Push notification handling
│   │   └── ai-service/          # AI notification rules + logic
│   ├── pkg/                     # Shared packages
│   ├── scripts/                 # Dev tooling (tmux, etc.)
│   ├── dev/                     # Air hot-reload configs
│   ├── nginx/                   # Reverse proxy config
│   ├── whisper-service/         # Python Whisper API
│   ├── docker-compose.yml       # Kafka, Redis, Zookeeper
│   └── Makefile                 # Comprehensive build commands
│
├── LandingPage/                 # Marketing Website
│   ├── src/
│   │   ├── routes/              # TanStack file-based routes
│   │   │   ├── __root.tsx       # Root layout
│   │   │   └── index.tsx        # Home page (all sections)
│   │   ├── components/
│   │   │   ├── landing/         # 15 section components
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── Levels.tsx
│   │   │   │   ├── DailyTasks.tsx
│   │   │   │   ├── Gamification.tsx
│   │   │   │   ├── MiniGames.tsx
│   │   │   │   ├── Community.tsx
│   │   │   │   ├── Testimonials.tsx
│   │   │   │   ├── Download.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── FloatingNotification.tsx
│   │   │   │   └── Particles.tsx
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── assets/              # Images, mockups
│   │   ├── styles.css           # Tailwind v4 theme + animations
│   │   └── router.tsx           # Router configuration
│   └── index.html               # HTML entry point
│
├── admin-panel/                 # Admin Dashboard
│   ├── src/
│   │   ├── pages/               # 8 page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ContentListPage.tsx
│   │   │   ├── ContentEditorPage.tsx
│   │   │   ├── ThemesPage.tsx
│   │   │   ├── RewardsPage.tsx
│   │   │   ├── EventsPage.tsx
│   │   │   └── AuditLogPage.tsx
│   │   ├── components/          # Layout, StatCard, Sidebar
│   │   ├── context/             # AuthContext
│   │   ├── lib/                 # API client, utilities
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Route configuration
│   │   └── index.css            # Tailwind directives + custom utilities
│   └── tailwind.config.js       # Custom colors (emerald, gold, navy)
│
├── README.md                    # Project documentation
└── Requirements.md              # Original design requirements
```

---

## 8. KEY DESIGN DECISIONS

1. **Dark Theme Everywhere**: Reduces eye strain for Quran/Arabic text reading sessions. Creates a premium, focused atmosphere.

2. **Emerald + Gold**: Green is deeply associated with Islam/paradise. Gold represents achievement and divine reward. Together they create an "Islamic gaming" aesthetic.

3. **Block-Based Content**: Daily tasks use typed content blocks instead of hardcoded screen components. This makes the backend truly dynamic — new task types can be added without app updates.

4. **Template-Based Notifications**: The worker service uses rule-based templates instead of AI for notifications. This ensures instant, predictable, culturally-appropriate messaging.

5. **Single-Pass Processing**: The notification worker fetches users once and evaluates all rules in one loop. Efficient and scalable.

6. **Course Abstraction**: Levels are grouped by `course_type` (qaida/tajweed), making it easy to add future courses (fiqh, seerah, etc.) without schema changes.

7. **Component Map Pattern**: The lesson system maps `component` strings to React components. This allows the backend to specify which UI to render for each lesson step.

8. **OKLCH for Web**: The landing page uses OKLCH color space for perceptually uniform colors and better gradient quality than hex/RGB.

9. **File-Based Routing**: Landing page uses TanStack's file-based router (`routes/index.tsx` → `/` path). This is a modern, type-safe approach.

10. **Monorepo Structure**: All components in one repo enables coordinated releases and shared understanding, even though each can be deployed independently.

---

## 9. CONCLUSION

DeenQuest is a **production-grade, thoughtfully designed** gamified Islamic learning platform. Its strengths include:

- **Comprehensive gamification** (XP, levels, streaks, rewards, leaderboard)
- **Truly dynamic content** (block-based tasks, component-mapped lessons)
- **AI integration** (Whisper for pronunciation checking)
- **Event-driven architecture** (Kafka for scalability)
- **Intelligent notifications** (context-aware push notifications)
- **Beautiful, consistent design** across all three frontend components
- **Open source** (MIT licensed, GitHub-hosted)
- **Professional development tooling** (Air hot-reload, Docker Compose, tmux dev layout)

The project demonstrates **senior-level architecture decisions** in mobile development, backend microservices, and modern web frontend development.
