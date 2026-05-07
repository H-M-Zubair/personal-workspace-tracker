# Workplace Tracker

Workplace Tracker is a simple web app to help teams or individuals manage daily work in one place.
It includes login, attendance tracking, task management, work timer sessions, and a dashboard view.

## Why this project is helpful

- Keeps daily work records organized
- Shows progress and activity in one dashboard
- Helps improve focus with tracked work sessions
- Makes it easier to review work history from calendar and reports

## Tech stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)

## How to run locally

1. Install dependencies:

```bash
npm install
```

2. Create local environment file:

```bash
cp .env.example .env.local
```

3. Add your Supabase values in `.env.local` (see env section below).

4. Run database schema in Supabase:
   - Open Supabase SQL Editor
   - Run SQL from `supabase/schema.sql`

5. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Set these in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key for client-side auth
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for privileged server actions

## Useful scripts

- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm run build` - Build production app
- `npm run start` - Start production server
