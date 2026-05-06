# 🎯 Workspace Tracker MVP - Complete Generation Prompt

## PROJECT VISION

Build a beautiful, modern workspace tracking application where users can manage daily tasks, track time spent on each task, monitor attendance, and view historical analytics with an intuitive calendar-based interface.

---

## 📋 CORE FEATURES (MVP)

### 1. **Authentication & Onboarding**

- Email/Password registration and login (Supabase Auth)
- First-time user gets onboarded to empty dashboard
- Session persistence with secure cookies

### 2. **Dashboard (Landing Page After Login)**

- Welcome message with user's name
- **Today's Section:**
  - Attendance check-in button (marks start of day)
  - Attendance status (✓ Checked in / Not checked in)
  - Current date and day name
- **Key Metrics (4 Cards):**
  - Total hours logged today
  - Tasks completed today
  - Success ratio (tasks completed on time / total tasks)
  - Current streak (consecutive days worked)

- **Quick Stats Graphs:**
  - Weekly hours breakdown (bar chart: Mon-Sun)
  - Task completion trend (line chart: last 7 days)
  - Success ratio gauge (circular progress)

- **Quick Actions:**
  - "Create New Task" button
  - "View Calendar" button
  - "View History" button

### 3. **Task Creation Modal**

- Fields:
  - Task name (required)
  - Description (optional)
  - Planned hours (numeric)
  - Planned minutes (numeric)
  - Work days selector (7 toggles: Mon-Sun) - which days will you work on this?
  - Priority (Low, Medium, High - color-coded)
  - Category (optional dropdown: Work, Personal, Learning, Health)
- Validation:
  - Task name required
  - At least one work day selected
  - Planned time > 0
- On success:
  - Close modal
  - Show toast notification "Task created!"
  - Refresh task list

### 4. **Daily Schedule Page** (/schedule or /today)

Shows the current day's tasks based on today's day name (Monday, Tuesday, etc.)

- **Attendance Section (Top):**
  - Large "Mark Attendance" button if not marked
  - Display "Attendance: ✓ Checked in at 09:45 AM" if marked
  - Time since check-in (updates live)

- **Tasks for Today (Card Layout):**
  For each task scheduled for today:
  - Task name
  - Planned time (e.g., "2h 30m")
  - Current status badge:
    - "Not started" (gray)
    - "In progress" (blue) - when timer is running
    - "Completed" (green) - when actual time >= planned time
    - "Pending" (amber) - when time remaining < 10%
  - Progress bar (actual time / planned time)
  - Action buttons:
    - "Start" (red timer button) - only if not started or paused
    - "Pause" (yellow) - only if in progress
    - "Resume" (blue) - only if paused
    - "Complete" (green checkmark) - to mark done manually

- **Active Timer Section:**
  When a task is running:
  - Task name (bold)
  - Large countdown timer (HH:MM:SS) in primary color
  - Seconds ticking down live
  - Visual feedback: timer box pulses subtly
  - Quick actions:
    - "Pause" button
    - "Add 5 min" button
    - "Done" button (turns green when time reaches 0)

- **Completed Tasks (Collapsed Section):**
  - Show tasks marked complete
  - Collapsible accordion
  - Show actual time spent vs planned time with checkmark/cross

### 5. **Calendar/History Page** (/calendar)

- **Monthly Calendar View:**
  - Standard calendar grid (Sun-Sat)
  - Current date highlighted
  - Past dates with work data show:
    - Small circle indicator: green (tasks completed) / orange (partial) / red (incomplete)
    - Hover tooltip: "3/4 tasks completed, 6.5h / 8h"

- **Weekly Card View (Default: Past 4 Weeks):**
  - For each week (rows):
    - Week number / date range (e.g., "Mar 10-16")
    - 5 day cards (Mon-Fri, or full 7 if working weekends):
      - Day name + date
      - Visual: colored circle or bar
        - Green: all tasks completed on time
        - Orange: partial completion
        - Red: incomplete tasks
      - Stats on hover: "4/5 tasks, 7h 30m / 8h"
  - Click any day card → see that day's detailed view

- **Detailed Day View (Modal/Expanded):**
  When clicking a past day:
  - Date and day name (header)
  - Attendance status if marked
  - List of all tasks scheduled for that day:
    - Task name
    - Status badge
    - Planned time vs actual time
    - Color-coded:
      - Green: time_spent >= planned_time (success)
      - Orange: 80% - 99% (almost there)
      - Red: < 80% (incomplete)
  - **Daily Score:**
    - "Success Ratio: 75%" (tasks completed on time / total scheduled)
    - "Hours: 6.5h / 8h" (actual / planned)
    - Streak indicator: "🔥 5-day streak!" if applicable

### 6. **Task Management Page** (/tasks)

- List all created tasks (not filtered by day)
- For each task:
  - Task name + description
  - Scheduled days (badges: "Mon, Wed, Fri")
  - Total hours planned across all days
  - Total hours logged across all days
  - Status badge (Active, Completed, On Hold)
  - Edit button (modal with same fields as creation)
  - Delete button (with confirmation)
  - View history button (shows all sessions for this task)

### 7. **Settings Page** (/settings) - Optional MVP+

- Profile section: name, email, profile picture
- Preferences:
  - Default work hours per day (for quick scheduling)
  - Notification preferences (when to mark attendance reminder)
  - Theme toggle (light/dark - if time permits)

---

## 🗄️ DATA SCHEMA (Supabase)

### Table: `users` (auto-managed by Supabase Auth)

- id (UUID, PK)
- email
- created_at
- updated_at

### Table: `tasks`

- id (UUID, PK)
- user_id (UUID, FK → users.id)
- title (text)
- description (text, nullable)
- category (enum: Work, Personal, Learning, Health, Other)
- priority (enum: Low, Medium, High)
- planned_hours (int)
- planned_minutes (int)
- work_days (array of booleans: [Mon, Tue, Wed, Thu, Fri, Sat, Sun])
- is_active (boolean, default: true)
- created_at (timestamp)
- updated_at (timestamp)
- **RLS:** users can only see/edit their own tasks

### Table: `attendance`

- id (UUID, PK)
- user_id (UUID, FK → users.id)
- date (date, unique per user)
- checked_in_at (timestamp)
- checked_out_at (timestamp, nullable)
- created_at (timestamp)
- **RLS:** users can only see/edit their own attendance

### Table: `timer_sessions`

- id (UUID, PK)
- user_id (UUID, FK → users.id)
- task_id (UUID, FK → tasks.id)
- started_at (timestamp)
- paused_at (timestamp, nullable)
- resumed_at (timestamp, nullable)
- ended_at (timestamp, nullable)
- total_seconds (int, default: 0)
- status (enum: running, paused, completed)
- created_at (timestamp)
- **RLS:** users can only see/edit their own sessions

### Computed Fields / Views (Postgres):

- Daily task completion stats per user
- Weekly hours aggregation
- Success ratio calculation

---

## 🎨 DESIGN SYSTEM

### Color Palette

- **Primary:** `#3B82F6` (Blue - actions, active states)
- **Secondary:** `#8B5CF6` (Purple - accent highlights)
- **Success:** `#10B981` (Green - completed, positive)
- **Warning:** `#F59E0B` (Amber - incomplete, caution)
- **Danger:** `#EF4444` (Red - overdue, alerts)
- **Neutral:** `#6B7280` (Gray - secondary text, borders)
- **Background:** `#F9FAFB` (Light gray)
- **Surface:** `#FFFFFF` (White)

### Typography

- Headings: Inter 600/700
- Body: Inter 400/500
- Mono (timers): JetBrains Mono or Courier

### Component Tokens

- Border radius: 8px (standard), 12px (cards), 20px (buttons)
- Shadows: `0 1px 2px rgba(0,0,0,0.05)` (subtle)
- Spacing: 4px, 8px, 12px, 16px, 24px, 32px multiples

### Interactive States

- Hover: 5% darker or +5% opacity
- Active: 10% darker + scale(0.98)
- Focus: 2px solid primary color ring
- Disabled: 50% opacity, not-allowed cursor

---

## 📁 PROJECT FILE STRUCTURE

```
workspace-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + providers
│   │   ├── page.tsx            # Landing/login redirect
│   │   ├── (auth)/
│   │   │   ├── layout.tsx      # Auth pages layout
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── callback/route.ts # OAuth callback
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # Dashboard sidebar + nav
│   │   │   ├── page.tsx        # Main dashboard
│   │   │   ├── today/page.tsx  # Daily schedule
│   │   │   ├── calendar/page.tsx # Calendar view
│   │   │   ├── tasks/page.tsx  # Task management
│   │   │   └── settings/page.tsx # Settings
│   │   ├── api/
│   │   │   ├── tasks/route.ts  # GET/POST/DELETE tasks
│   │   │   ├── timers/route.ts # Timer session management
│   │   │   ├── attendance/route.ts # Check-in/out
│   │   │   ├── stats/route.ts  # Dashboard stats
│   │   │   └── history/route.ts # Calendar/history queries
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── admin.ts        # Admin client (optional)
│   │   ├── utils/
│   │   │   ├── time.ts         # Time formatting, calculations
│   │   │   ├── date.ts         # Date helpers
│   │   │   ├── colors.ts       # Color utils
│   │   │   └── validation.ts   # Form validation
│   │   ├── hooks/
│   │   │   ├── useAuth.ts      # Auth context hook
│   │   │   ├── useTimer.ts     # Timer state management
│   │   │   ├── useAttendance.ts # Attendance tracking
│   │   │   └── useTasks.ts     # Task CRUD operations
│   │   └── types/
│   │       └── index.ts        # TypeScript interfaces
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── WeeklyChart.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── schedule/
│   │   │   ├── AttendanceButton.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TimerDisplay.tsx
│   │   │   └── TaskList.tsx
│   │   ├── calendar/
│   │   │   ├── Calendar.tsx
│   │   │   ├── WeeklyCards.tsx
│   │   │   ├── DayDetail.tsx
│   │   │   └── DayBadge.tsx
│   │   ├── modals/
│   │   │   ├── TaskCreateModal.tsx
│   │   │   ├── TaskEditModal.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── forms/
│   │   │   ├── TaskForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   └── ui/ (shadcn)
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       └── ... (other shadcn exports)
│   └── styles/
│       ├── globals.css
│       ├── animations.css
│       └── theme.css
├── .env.local          # Local env (git-ignored)
├── .env.example        # Example env
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🛠️ TECH STACK SPECIFICATIONS

### Frontend

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (pre-built accessible components)
- **Charts:** recharts (lightweight charting)
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Context API (auth, timer)
- **Date Library:** date-fns
- **HTTP Client:** fetch (built-in) + optional SWR for data fetching

### Backend

- **API:** Next.js API Routes
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth + Server-side sessions

### DevOps

- **Hosting:** Vercel (frontend + API routes, free tier)
- **Database Hosting:** Supabase (free tier)
- **Version Control:** Git + GitHub

---

## 🚀 DEVELOPMENT GUIDELINES

### Code Quality

- **Naming:** camelCase for variables/functions, PascalCase for components
- **File Naming:** kebab-case for files (e.g., `metric-card.tsx`)
- **Comments:** JSDoc for functions, inline for complex logic only
- **No Magic Numbers:** Use constants and env vars
- **Error Handling:** Try-catch in API routes, error boundaries in UI
- **Logging:** Console logs with context prefixes, e.g., `console.log('[TaskService]', message)`

### Component Structure

Each component should:

1. Have a single responsibility
2. Accept typed props (TypeScript)
3. Include prop validation (React.FC<Props>)
4. Export a named export + default export
5. Have a Storybook story (optional for MVP)

### API Routes

- Authenticate user from session/cookies
- Validate request body with Zod
- Return consistent JSON: `{ success: boolean, data?: T, error?: string }`
- Use HTTP status codes correctly (200, 201, 400, 401, 404, 500)
- Log errors with context

### Database Queries

- Use Supabase client with TypeScript support
- Always filter by `user_id` (RLS backup)
- Use parameterized queries (Supabase ORM/client does this)
- Cache where sensible (SWR, React Query, or Next.js revalidate)

### Performance

- Lazy load components where possible
- Image optimization with next/image
- API response pagination (optional for MVP)
- Debounce expensive operations (search, typing)

---

## 🎬 USER JOURNEY (Step-by-Step)

### Day 1: First-Time User

1. Lands on marketing page
2. Clicks "Get Started" → Redirected to register
3. Signs up with email + password
4. Email verification (Supabase)
5. Lands on empty dashboard
6. Sees onboarding: "👋 Welcome! Let's create your first task"
7. Clicks "Create Task" → Modal opens
8. Creates a task: "Learn TypeScript", 2.5 hours, Mon/Wed/Fri
9. Redirected to dashboard
10. Dashboard now shows 1 task created

### Regular Day: Mark Attendance → Work on Tasks

1. Morning: Logs in → Dashboard
2. Clicks "Mark Attendance" button
3. System records time, button grays out
4. Clicks "Go to Schedule" → Today's page
5. Sees Monday's tasks: "Learn TypeScript" (2.5h)
6. Clicks "Start" → Timer starts counting down from 2:30
7. Works for 45 minutes
8. Clicks "Pause" → Timer pauses
9. Takes break
10. Clicks "Resume" → Timer continues
11. Works 1:45 more
12. Total = 2:30, reaches 0, button turns green "✓ Complete"
13. Clicks "Done" → Task marked complete
14. Returns to dashboard
15. Dashboard updates: "2/2 tasks completed, 2h 30m logged"

### Day 2: Review Previous Day's Work

1. Next morning, opens calendar
2. Sees yesterday (Monday) with a green indicator
3. Clicks Monday card → See all tasks from yesterday
4. Shows "Success Ratio: 100%", "✓ 2 tasks completed"
5. Can see each task: "Learn TypeScript" ✓ 2h 30m / 2.5h

### Weekly Review

1. Opens calendar
2. Sees last 4 weeks in cards
3. Sees a 5-day streak: "🔥 On fire!"
4. Clicks a week card → See that week's overview
5. Charts on dashboard show trend: Hours increasing, success ratio stable

---

## 📝 KEY IMPLEMENTATION NOTES

### Timer Logic

- Timer counts DOWN from planned time to 0
- Pausing: store the remaining seconds when paused
- Resuming: continue from remaining seconds
- Completing: when time reaches 0, auto-complete OR user clicks "Done"
- Overtime: Allow working beyond planned time, show in red/warning

### Attendance

- One check-in per day per user
- Check-in timestamp recorded
- Dashboard shows "Checked in at HH:MM"
- Used to determine if day counts toward streak

### Success Calculation

- Success = (tasks_completed_on_time / tasks_scheduled) \* 100
- "On time" = actual_time >= planned_time
- Calculated per day, per week, per month

### Streak Logic

- Count consecutive days where attendance was marked AND (success_ratio >= 75% OR day had no tasks)
- Reset when user misses a day OR success falls below 50%
- Show "🔥 5-day streak" on dashboard and calendar

### Real-time Updates

- Timer display updates every 1 second (client-side)
- Task status updates via SWR polling (5-second intervals)
- Attendance status updates immediately on button click
- Charts update on dashboard after task completion

---

## ✅ ACCEPTANCE CRITERIA (MVP Complete When...)

- [ ] User can register and login securely
- [ ] Dashboard displays today's metrics and charts correctly
- [ ] User can create tasks with planned hours and work days
- [ ] User can check in attendance each day
- [ ] User can start/pause/resume timer for tasks
- [ ] User can mark task as complete
- [ ] Calendar shows past work with color indicators
- [ ] Clicking a past day shows detailed stats and tasks
- [ ] Success ratio and streak calculations are accurate
- [ ] All forms validate properly with clear error messages
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] App is deployed to Vercel and accessible
- [ ] Database is on Supabase with RLS enabled
- [ ] No console errors or TypeScript warnings
- [ ] Load time < 3 seconds on 4G connection
- [ ] All API routes protected by auth check

---

## 🎯 NEXT STEPS (Post-MVP)

- Notifications (email reminders, in-app toasts)
- Export/download history (PDF, CSV)
- Habit tracking widget
- Social features (share streaks, leaderboards)
- Mobile app (React Native)
- Background jobs (weekly summaries, cleanup)
- Dark mode
- Localization (i18n)
- Analytics dashboard for insights
- Integrations (Google Calendar, Slack)

---

## 🚀 GETTING STARTED WITH THIS PROMPT

### If using Claude Code:

1. Save this prompt to a file
2. Feed to Claude Code agent with: "Build this project using this spec"
3. Claude Code will scaffold the entire project structure
4. Review generated code, test locally

### If using Manual Implementation:

1. Create Next.js project: `npx create-next-app@latest workspace-tracker --typescript --tailwind`
2. Install dependencies: `npm install @supabase/supabase-js @supabase/ssr recharts date-fns zod react-hook-form`
3. Add shadcn/ui: `npx shadcn-ui@latest init`
4. Follow file structure above
5. Implement each page/component according to specs

### Environment Setup:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (backend only)
```

---

## 📚 REFERENCE LINKS

- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- Supabase Docs: https://supabase.com/docs
- Recharts: https://recharts.org
- React Hook Form: https://react-hook-form.com

---
