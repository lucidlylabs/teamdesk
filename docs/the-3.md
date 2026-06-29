# THE 3 — shared daily company focus

A company-level daily focus that lives at the top of `/desk`: every day the whole
team commits to **exactly three things that move revenue or sales**, each done to a
defined standard ("perfection"). Everything below the banner (the existing Desk
tabs) is unchanged.

Branch: `feat/the-3-daily-focus`. Stack: Next.js 14 (App Router) + Prisma + NextAuth.

---

## What it does

- A **hero banner above the Desk tabs**, visible only to TEAM and ADMIN.
- A **North Star** (the one number the company drives) and **this week's revenue goal**.
- Up to **3 focus items** per day. Each item carries:
  - a **title**
  - an optional **owner**
  - a **revenue why** (how it moves revenue/sales) — required
  - a **definition of perfection** (what "done" means) — required
  - a **status**: `Not started -> In progress -> Done — perfection`
- An **end-of-day recap** ("did we nail the 3?").
- A read-only **Focus Log** tab — the last 30 days of focus, with each day's items,
  their final statuses, and the recap.
- **Carry-over**: when today has no items, one click copies the previous day's
  unfinished items into today.

The hard rules are enforced by the system, not by convention:
- **Three, not four.** A 4th item is rejected (UI hides "add" at 3; API returns 400).
- **Revenue/perfection are required.** You can't add an item without both.
- **Today only.** You can only edit/score today's focus; past days are read-only history.

---

## Who can do what

| Action | USER | TEAM | ADMIN |
|--------|:----:|:----:|:-----:|
| See the banner + Focus Log | — | ✓ | ✓ |
| Change an item's status | — | ✓ | ✓ |
| Add / edit / delete items | — | — | ✓ |
| Set North Star + week goal | — | — | ✓ |
| Write the end-of-day recap | — | — | ✓ |
| Carry over unfinished items | — | — | ✓ |

A plain USER (any signup, not whitelisted) never sees the banner or the Focus Log tab.
Roles come from the existing `Role` enum; TEAM requires being on the `Whitelist`.

---

## How to use it (daily)

**Admin, in the morning**
1. Open `/desk`. The THE 3 banner is at the top.
2. Set/adjust **North Star** and **this week's revenue goal** ("Edit goals").
3. Add up to **3 items**. For each, fill the title, owner (optional), the revenue
   line, and what perfection looks like. The "add" control disappears at 3.
4. (Optional) If today is empty and yesterday had unfinished work, click
   **"Carry over unfinished"** to seed today from it.

**The team, during the day**
- Move each item along: **Not started -> In progress -> Done — perfection** by
  clicking the status pill. Anyone on the team can do this; only admins change the
  items themselves.

**Admin, end of day**
- Write the **recap** ("did we nail the 3?") and Save. It shows up against today in
  the **Focus Log** tab.

**Anyone (team), anytime**
- Open the **Focus Log** tab to see the track record: which days hit
  `N/3 done-to-perfection`, the items, and the recaps.

---

## What changed in the codebase

### Data model (`prisma/schema.prisma` + migration `20260629180000_add_daily_focus`)
- `enum FocusStatus { NOT_STARTED, IN_PROGRESS, DONE_PERFECT }`
- `FocusSettings` — singleton row (id `"singleton"`): `northStar`, `weekGoal`.
- `DailyFocus` — one row per day (`date @db.Date @unique`): holds `recap` + items.
- `FocusItem` — belongs to a `DailyFocus`; `@@unique([focusId, rank])` caps each day
  at 3 and prevents duplicate ranks. Cascade-deletes with its day.
- Migration is **additive** (3 new tables, nothing touched on existing tables), so
  rollback is a clean drop.

### API (`src/app/api/focus/**`, guards in `src/lib/guards.ts`, helpers in `src/lib/focus.ts`)
| Route | Method | Role | Purpose |
|-------|--------|------|---------|
| `/api/focus` | GET | TEAM/ADMIN | Today's (or `?date=`) settings + focus |
| `/api/focus/log` | GET | TEAM/ADMIN | Last 30 days for the Focus Log tab |
| `/api/focus/item` | POST | ADMIN | Add an item (rejects the 4th) |
| `/api/focus/item` | PATCH | ADMIN | Edit an item's fields (today only) |
| `/api/focus/item` | DELETE | ADMIN | Remove an item (today only) |
| `/api/focus/item/status` | PATCH | TEAM/ADMIN | Change status only (today only) |
| `/api/focus/settings` | PUT | ADMIN | Set North Star / week goal |
| `/api/focus/recap` | PUT | ADMIN | Write today's recap |
| `/api/focus/carry-over` | POST | ADMIN | Seed today from prior day's unfinished items |

All routes are zod-validated, role-gated in the handler, and protected by the
NextAuth middleware (`/api/focus/:path*` added to `src/middleware.ts`). Writes are
restricted to the current UTC day, mirroring the attendance route.

### UI (`src/app/desk/`)
- `TheThree.tsx` — the banner (client component): goals, the 3 cards, status controls,
  add/edit/delete (admin), carry-over, recap.
- `page.tsx` — loads focus data **only for TEAM/ADMIN** and renders the banner above
  the tabs.
- `Tabs.tsx` — adds the read-only **Focus Log** tab (TEAM/ADMIN only). The tab row's
  scrollbar is hidden via a `no-scrollbar` utility (`globals.css`).

### Tooling fixes made this session
- **`db:seed` / `cron:daily` now load `.env`** (`tsx --env-file=.env ...`). Previously
  `npm run db:seed` failed with "Environment variable not found: DATABASE_URL" because
  `tsx` doesn't auto-load `.env` the way the Prisma CLI does.
- `.gstack/` added to `.gitignore` (local tooling output).
- Review fix: `carry-over` returns **409** instead of an unhandled 500 if two admins
  trigger it in the same second (the unique index already protected data integrity).

---

## Setup / running locally

```bash
cp .env.example .env          # fill DATABASE_URL (+ DIRECT_URL), NEXTAUTH_SECRET, NEXTAUTH_URL
npm install
npx prisma migrate deploy     # applies add_daily_focus (use migrate dev only on a scratch DB)
npm run db:seed               # creates the FocusSettings singleton (+ existing seed data)
npm run dev                   # http://localhost:3000
```

The seed leaves North Star and week goal empty; set them from the banner as admin.

---

## QA status

Verified live against the database (all acceptance criteria passed): role gating
(USER 403 / TEAM status-only / ADMIN full), the max-3 cap, the today-only guard,
carry-over (happy path + 409 + 404), recap, and the Focus Log. A plain USER sees
neither the banner nor the tab. See the screenshots under `.gstack/qa-reports/`
(gitignored).

## Not included (possible follow-ups)
- A "Backlog" / parking-lot tab for non-focus ideas.
- Linking each attendance check-in to which of THE 3 it pushes.
- The Discord daily summary leading with THE 3 and whether each hit perfection.
