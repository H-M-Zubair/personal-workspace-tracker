# Workspace Tracker MVP

A Next.js + Supabase workspace tracker with authentication, attendance, task planning, timers, dashboard metrics, and calendar history.

## Tech Stack

- Next.js (App Router)
- TypeScript + Tailwind CSS
- Supabase Auth + Postgres + RLS
- React Hook Form + Zod

## 1) Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2) Database Setup (Supabase)

Run SQL from `supabase/schema.sql` in Supabase SQL Editor.

This creates:

- `tasks`
- `attendance`
- `timer_sessions`
- RLS policies for each table

## 3) Run Project

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 4) Build / Lint

```bash
npm run lint
npm run build
```

## Routes

- `/login`, `/register`
- `/` dashboard
- `/today`
- `/tasks`
- `/calendar`
- `/settings`
- APIs under `/api/*`
