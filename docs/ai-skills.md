# In-app AI skills

A small framework for AI features inside TeamDesk, powered by the existing DeepSeek
integration. Each "skill" is a prompt template + input/output schemas + a deterministic
fallback. They are **one-shot, context-fed helpers** — distinct from the interactive
gstack CLI skills (`/office-hours`, `/plan-ceo-review`) that run in Claude Code against
the codebase.

## How it works

```
POST /api/ai/run  { skill, input }
        │
        ▼
  registry[skill]  ──>  runSkill()
                          1. prepare()        optional server-side DB context
                          2. inputSchema.parse   (400 on bad input)
                          3. no DEEPSEEK key? → fallback()
                          4. chatJSON() → outputSchema.parse()   (trust boundary)
                          5. any model error → fallback()
        │
        ▼
  { source: "llm" | "fallback", data }
```

- **Role-gated:** every skill declares `role: "ADMIN" | "TEAM"`; the route enforces it
  with the existing `requireAdmin`/`requireTeam` guards.
- **Trust boundary:** model output is validated against the skill's `outputSchema`
  before it leaves the server. Nothing the model returns is ever written to the DB.
- **Always degrades:** with no `DEEPSEEK_API_KEY`, or on any timeout/error/bad JSON,
  the skill returns its deterministic `fallback()` and the UI keeps working.

## Files
- `src/lib/ai/deepseek.ts` — `chatJSON()` (endpoint/model/timeout).
- `src/lib/ai/types.ts` — the `AiSkill` interface.
- `src/lib/ai/runSkill.ts` — prepare → validate → call → fallback.
- `src/lib/ai/registry.ts` — name → skill.
- `src/lib/ai/skills/*` — one file per skill.
- `src/app/api/ai/run/route.ts` — the single entry point.

## Adding a skill
1. Create `src/lib/ai/skills/<name>.ts` implementing `AiSkill<I, O>`: `name`, `role`,
   `inputSchema`, `outputSchema`, `buildMessages()`, `fallback()`, optional `prepare()`
   for DB context.
2. Register it in `src/lib/ai/registry.ts`.
3. Call it from the UI: `POST /api/ai/run` with `{ skill: "<name>", input }`.

No new route, no new plumbing.

## Skills
- **`sharpen-focus-item`** (ADMIN) — critiques a THE 3 focus item and proposes a tightened
  rewrite. "Sharpen with AI" on the add-item form (`TheThree.tsx`); admin Applies into the
  form then clicks Add. Fallback: heuristic critique, no rewrite.
- **`office-hours`** (ADMIN) — YC-style advisor Q&A. `prepare()` attaches today's THE 3,
  week goal, and team blockers; returns problem → options → recommendation. New
  **Office Hours** tab (`Tabs.tsx`). Fallback: echoes context, no advice.
- **`ceo-review-the-3`** (ADMIN) — pressure-tests today's items vs North Star + week goal;
  returns per-item keep/sharpen/cut + what's missing. "Review today's 3 (CEO)" button on
  the banner. Fallback: heuristic per-item call + done count.
- **`weekly-review`** (ADMIN) — synthesizes the last 7 days of focus + attendance into
  wins / risks / next focus. "Generate" button in the Focus Log tab. Fallback: deterministic
  hit-rate.

These advisors are **one-shot and context-fed**, distinct from the interactive gstack CLI
skills (`/office-hours`, `/plan-ceo-review`).

## Config
Reuses `DEEPSEEK_API_KEY` (see `.env.example`). No new env.
