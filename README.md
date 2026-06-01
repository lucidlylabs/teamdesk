# Lucidly · TeamDesk

A locked-in startup desk. Daily check-ins, live pipelines, shared research, Discord relay.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- Postgres + Prisma
- NextAuth (credentials, JWT sessions)
- Discord incoming webhooks

## Roles
- **TEAM** — must be on the `Whitelist` table (admin-controlled). Sees `/team` calendar; can mark today's attendance.
- **USER** — any signup. Sees `/desk` with three tabs: From the Desk, Product Pipelines, Research.
- **ADMIN** — same as TEAM plus future admin tooling.

## Run locally

```bash
cp .env.example .env
# fill DATABASE_URL, NEXTAUTH_SECRET, CRON_SECRET, Discord webhooks (optional)

npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000.

Default admin from the seed:
- email: `lucidlyfinance@gmail.com`
- password: `change-me-now` (change this immediately)

## Whitelist a new team member
Add a row to the `Whitelist` table (`prisma studio` → Whitelist → +). They can then sign up choosing the "Team member" role.

## Daily summary cron

Two options — both reuse the same logic.

**Option A — HTTP endpoint**, hit from any cron service (Vercel Cron, GitHub Actions, etc.):

```
POST /api/cron/daily-summary
Authorization: Bearer $CRON_SECRET
```

**Option B — standalone script** (any host with cron):

```bash
0 23 * * *  cd /path/to/teamdesk && npm run cron:daily
```

What it does:
1. For every whitelisted team member with no `PRESENT` record today, inserts an `ABSENT` row (this is what marks the red ✕ on missed days).
2. Builds a 4-line summary from today's check-ins.
3. Saves to `DailySummary` and posts to the Discord webhook.

## Discord setup
1. In Discord: Server Settings → Integrations → Webhooks → create two:
   - `#desk-relay` → paste URL into `DISCORD_DAILY_SUMMARY_WEBHOOK`
   - `#research` → paste URL into `DISCORD_RESEARCH_WEBHOOK`
2. When a team member posts a research item via the app, it relays into `#research`.
3. The cron job posts the daily 4-liner into `#desk-relay`.

## Files of interest
- `prisma/schema.prisma` — DB shape
- `src/lib/summarize.ts` — the 4-line summary generator (swap for an LLM call later)
- `src/lib/discord.ts` — webhook helpers
- `src/app/team/Calendar.tsx` — calendar UI with red-ring "today" animation
- `src/app/desk/Tabs.tsx` — three-tab dashboard for Lucidly users
- `src/app/api/cron/daily-summary/route.ts` — cron-trigger summary endpoint
