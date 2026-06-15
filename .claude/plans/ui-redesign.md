# UI Redesign & Feature Plan

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

## Direction

**Full redesign + new features, within the existing shadcn/neutral aesthetic.**
No new font/color point-of-view — instead raise information density, fix the
usability problems found during review, and add ambitious features, all in the
current visual language. Goal: make it a *much better tool*, not a
different-looking one.

## How to work this plan

Phases are ordered by value and are independently shippable — stop after any
phase. Verify each phase in the browser against the mock backend before moving
on (see "Running with mock data" below). Check off items as completed and note
the implementing commit/PR.

## Findings this plan addresses (from browser review)

1. **Filter header eats the screen** — ~330px of persistent chrome above the
   content on both tabs; only ~2 table rows visible at 900px tall.
2. **Status badges unreadable in light mode** — all statuses render monochrome
   black/white; identical until you read the text. Status is the most-scanned
   column. (Status color logic is duplicated across `columns.tsx`,
   `SessionDetail.tsx`, and `chart-colors.ts`.)
3. **Session logs useless at a glance** — rendered as collapsed JSON array
   (`{ … }` × N), each needs a click to expand; no timestamp/method/summary
   visible. `react-json-view-lite` blue background clashes with the sheet.
4. **Metadata filter row always-visible but empty by default** — full-width
   `key.path = value` row occupies prime space even when unused, competing with
   the chip filters below that do a similar job.

---

## Phase 1 — Usability fixes (foundation, ship-able alone)

- [x] **1.1 Consolidated status config.** `src/lib/status.ts` — single source of
      truth for status color/label/badgeVariant/chartColor. `columns.tsx`,
      `SessionDetail.tsx`, `SessionFilters.tsx`, `chart-colors.ts` all consume
      it. ERROR=red, COMPLETED=green, RUNNING=blue, TIMED_OUT=amber in both
      light and dark.
- [x] **1.2 Readable logs.** `SessionLogs.tsx` rewritten as a timeline:
      timestamp · domain.method · summary line; chevron expands to structured
      params/result table; Raw JSON toggle available. No more blue background.
- [x] **1.3 Collapsible filter header.** `SessionFilters.tsx` now shows a
      compact "Filters (n)" bar by default. Expanding reveals status chips,
      property filters, and metadata query builder in a card panel. Active
      filters render as removable pills inline on the summary bar.

**Verify:** light + dark, table row count increased, logs legible, filter
collapse/expand + active-pill removal works.

## Phase 2 — Density & metrics

- [x] **2.1 Metrics strip** above the table: Total · Error rate · p50 duration ·
      Total proxy — derived from the *same filtered set* so it respects filters
      (reuse `filterSessions`). New component `MetricsStrip.tsx`, consumed by `SessionsPage`.
- [x] **2.2 Denser table rows** + left status accent bar; monospace session IDs
      (mono as a utility within the neutral palette, not an aesthetic change).
      Files: `SessionTable.tsx`, `columns.tsx`, `status.ts` (`accentClass` added).

**Verify:** metrics update when filters change; row density improved without
breaking sorting/pagination.

## Phase 3 — Ambitious features

- [x] **3.1 Live RUNNING strip** — pinned row of in-flight sessions with elapsed
      timers; polls `/api/sessions?status=RUNNING`. NOTE: meaningful only
      against the real API; mock shows static RUNNING rows.
- [x] **3.2 Saved views** — persist filter combinations to localStorage,
      switchable from a dropdown. Builds on the `PropertyFilters` +
      metadata-query state in `SessionsPage`.
- [x] **3.3 Replay preview in the detail sheet** — embed the debugger iframe
      using the `/api/sessions/:id/debug` `debuggerUrl` instead of only linking
      out. NOTE: mock can't serve a real CDP debugger — verify layout only;
      works against real API.
- [x] **3.4 Time-range brush** on the volume chart that drives the global
      created-date filter (`PropertyFilters.createdAfter/Before`).

**Verify:** each feature against mock for structure/layout; flag mock-vs-real
gaps for 3.1 and 3.3 explicitly.

---

## Mock-vs-real gaps to remember

- **3.1 Live RUNNING strip** and **3.3 Replay preview** need real Browserbase
  behavior (live polling, CDP debugger). Build them to work against the real
  API; only structure/layout is verifiable against the mock.

## Running with mock data

A standalone mock backend mirrors the real Hono `/api/*` routes so the Vite
client runs with zero app-code changes (no real API key needed):

```bash
node mock/mock-server.mjs &      # mock backend on :3002 (synthetic, deterministic)
npm run dev:client               # Vite client on :5173, proxies /api -> :3002
```

`mock/mock-server.mjs` generates ~130 deterministic sessions across 3 projects
with varied statuses/regions/metadata and clustered arrival times (so the
concurrency/FFT charts have signal). It supports `status` and `q`
(`user_metadata['k']:'v'`, AND-joined) filtering, plus `/logs` and `/debug`.

## Design constraints (keep)

- Stay within the existing shadcn/ui + neutral palette aesthetic.
- Two-layer filtering stays intact: server-side `q` (metadata) vs. client-side
  `PropertyFilters`. Table and analytics must show the same subset
  (`filter-sessions.ts` mirrors `columns.tsx`).
- Strict TS, `noUnusedLocals/Parameters`; run `npm run build` + `npm run lint`
  before considering a phase done.
