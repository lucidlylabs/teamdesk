# AI skills v2 — interactive / agent mode (design notes, not yet specced)

Status: **future work.** This captures the design so a later `/spec` can pick it up.
Today's shipped layer (v1) is the one-shot framework in [ai-skills.md](ai-skills.md):
`runSkill()` → prompt template + zod-validated I/O + deterministic fallback, behind
`POST /api/ai/run`, with four skills (sharpen, office-hours, ceo-review-the-3,
weekly-review). v2 makes that experience closer to the interactive gstack CLI.

## Goal
Get as close as a web app reasonably can to gstack's interactive skills — multi-turn,
decision-gated, tool-using — while being honest about what doesn't transfer.

## What transfers (the four levers)
1. **Multi-turn conversation.** Keep a message history and send it each turn so a skill
   becomes a real back-and-forth instead of one shot. Needs a chat UI + somewhere to hold
   the thread.
2. **Interactive decision gates.** gstack's signature move: pause, ask a structured
   question, the user picks, it proceeds. In-app = the model returns option buttons that
   feed the next turn (mirror the AskUserQuestion shape).
3. **Tool-calling over TeamDesk data.** The big lever. DeepSeek is OpenAI-compatible and
   supports function calling, so the agent can *read and act on* TeamDesk: read today's
   THE 3 / attendance / pipelines, and (behind approval) set the 3, mark status, write a
   recap. **The v1 skills become the tools the agent calls.**
4. **Faithful personas.** Port the actual gstack prompts/cognitive patterns (office-hours,
   plan-ceo-review) more richly than the compact v1 system prompts.

## The honest ceiling (what does NOT transfer)
gstack's real power is running against the **codebase + filesystem + git + browser** in a
CLI agent loop. A web app has none of that — it has TeamDesk's **business data**. So the
in-app agent is a faithful **AI ops advisor/agent over company data**, not a code agent.
The code-aware loop stays in the gstack CLI. This is a different surface, not a gap to fix.

## Proposed architecture (extends v1, does not replace it)
- **`runChat(skill, messages, ctx)`** alongside `runSkill()` — same registry, same
  guards, same fallback philosophy, but takes/returns a message array.
- **Tool layer:** define tool schemas (OpenAI function-calling format). Read tools
  (`get_today_focus`, `get_week_log`, `get_attendance`) and write tools
  (`set_focus_item`, `set_status`, `write_recap`). Each write tool reuses the existing
  `/api/focus/*` handlers and their role checks — the agent never bypasses authz.
- **Approval gates:** every write tool call is surfaced to the admin as a proposed action
  with Approve / Reject before it executes (the same trust-boundary pattern as Sharpen's
  "Apply"). No silent writes.
- **Conversation persistence (optional):** a `Conversation` / `Message` table if threads
  should survive reloads; or keep it client-side for v2.0 and add persistence later.
- **Streaming (optional):** stream tokens for responsiveness; not required for a first cut.
- **Personas as data:** richer per-skill system prompts; consider a `persona` field on the
  skill definition.

## Trust boundary (carries over, and gets stricter)
v1 already validates model output and never persists it. v2 adds tool-calling, so:
- Every **write** requires explicit admin approval before execution.
- Tool inputs are zod-validated server-side; tools run with the caller's role, not the
  model's say-so.
- Read tools only return data the caller is already authorized to see.

## Open questions to resolve at spec time
- **Write access:** does the v2 agent get write tools (set/edit THE 3, mark status) behind
  approval gates, or stay read-only (advice + reads) for the first cut?
- **Persistence:** client-side threads vs a `Conversation` table (history, audit).
- **Cost / rate limits:** multi-turn + tools = more tokens; do we cap turns, meter usage,
  or rate-limit `/api/ai/*`?
- **Which skills go conversational first:** office-hours is the obvious first multi-turn
  candidate; sharpen probably stays one-shot.
- **Surface:** a dedicated "Assistant" panel/tab vs upgrading the existing per-skill UIs.

## Why v1 is the right substrate
Nothing in v1 is throwaway: the registry, role gates, zod I/O validation, fallback, and
the four skills all become the tools and building blocks the v2 agent orchestrates. v2 is
additive — a chat/agent mode layered on top, not a rewrite.

## When ready
Run `/spec` against this doc (answer the open questions first), then build behind the same
`/review` → `/ship` loop used for v1.
