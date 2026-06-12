# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Active plans

- **UI redesign & feature plan:** `.claude/plans/ui-redesign.md` — phased plan to improve density, fix usability issues, and add features within the existing shadcn aesthetic. Check it before UI work; update checkboxes as phases land. Includes how to run against the mock backend (`mock/mock-server.mjs`).

## Commands

- **Dev (full stack):** `npm run dev` — runs Hono server (port 3002) and Vite client (port 5173) concurrently
- **Dev (server only):** `npm run dev:server` — tsx watch on `src/server/index.ts`
- **Dev (client only):** `npm run dev:client` — Vite dev server
- **Build:** `npm run build` — TypeScript type-check (`tsc -b`) + Vite production build
- **Lint:** `npm run lint` — ESLint
- **Preview:** `npm run preview` — serve production build locally

No test runner is configured.

## Architecture

Local web client for browsing and inspecting Browserbase sessions. React 19 frontend + Hono backend proxy.

**Backend (Hono, `src/server/`):** Thin API proxy that keeps Browserbase API keys server-side. `index.ts` mounts `/api/projects`, `/api/sessions/*`, `/api/health`. Session routes (`routes/sessions.ts`) proxy GET to the Browserbase API (`BROWSERBASE_API_URL`), forwarding only `status` and `q` query params; the API key is injected as the `X-BB-API-Key` header. Every session request must carry an `X-BB-Project` header naming the project; `projects.ts` resolves that name to a key.

**Project resolution (`src/server/projects.ts`):** Projects are defined by env vars matching `BROWSERBASE_API_KEY_<NAME>`. The `<NAME>` suffix (lowercased) is the project's id/label. At least one is required or the server exits at startup. There is no single-key or JSON-map mode.

**Frontend (React 19 + Vite, `src/`):** Single-page app. `SessionsPage` (`src/components/sessions/`) is the orchestrator: it fetches sessions once, then renders a `Tabs` UI with a **Sessions** table view and an **Analytics** dashboard, plus a right-side `SessionDetail` sheet. The session list uses `@tanstack/react-table` with client-side sorting/pagination (25 rows/page). UI is shadcn/ui (`src/components/ui/`) + `@base-ui/react` primitives, Tailwind CSS 4, Lucide icons.

**Two-layer filtering — important:** Filtering happens in two distinct places, do not conflate them.
- *Server-side* (`q` param): metadata queries. `SessionsPage` passes `status`/`q` to `listSessions`, which the backend forwards to Browserbase. The `q` string is built/parsed by `metadata-query.ts` (dot-path → `user_metadata['a']['b']:'value'` bracket notation, space-separated = AND) via the `MetadataQueryBuilder` UI.
- *Client-side* (`PropertyFilters`): created-date range, duration, region, proxy-bytes. Held as React state in `SessionsPage` and applied in-memory by `filter-sessions.ts`. **Both the table and analytics must show the same subset**, so `filterSessions` mirrors the column-filter logic in `columns.tsx`. `property-filters.ts` defines the shape and `defaultFilters()` — note the default constrains `createdAfter` to the last 7 days and selects all `KNOWN_REGIONS`.

**Metadata schema (`src/lib/metadata-schema.ts`):** `useMetadataSchema` walks every session's `userMetadata` (depth ≤ 5) to derive available key-paths and their observed values, feeding autocomplete in the metadata query builder.

**Analytics (`src/components/analytics/`, `src/lib/analytics.ts`):** `AnalyticsDashboard` re-applies `filterSessions` then derives chart data (volume, status breakdown, duration histogram, concurrency, metadata grouping) consumed by recharts charts. `ConcurrencyChart`/`FrequencyChart` use an FFT in `src/lib/fft.ts` to surface dominant periodicities in session arrival times.

**Client API (`src/lib/api.ts`):** All client→server calls go through here. It reads the selected project from `project-state.ts` and attaches the `X-BB-Project` header. Vite proxies `/api` → localhost:3002 in dev.

**Project selection state:** Split deliberately — `project-state.ts` is a plain module-level store (so non-React `api.ts` can read the current project synchronously and persist to localStorage key `browserbase-project`), while `project-provider.tsx` (`ProjectProvider` / `use-project.tsx`) wraps it for React components. Changing the project in the UI updates both.

**TypeScript config:** Separate configs — `tsconfig.app.json` (excludes `src/server`) and `tsconfig.server.json` (only `src/server`). Both strict, with `noUnusedLocals`/`noUnusedParameters`. Server files use `.js` import specifiers (NodeNext).

## Environment

Copy `.env.example` to `.env`. Define one `BROWSERBASE_API_KEY_<NAME>` per project (the suffix becomes the dropdown label). Optional: `PORT` (default 3002), `CORS_ORIGIN` (default `http://localhost:5173`), `BROWSERBASE_API_URL` (default `https://api.browserbase.com/v1`).

## Styling

Tailwind CSS 4 via `@tailwindcss/vite` plugin (no tailwind config file). Dark mode is class-based (`.dark`), toggled via `useTheme` (`src/lib/use-theme.ts`) with system-preference detection + localStorage override. Theme colors are CSS custom properties; chart palette lives in `src/components/analytics/chart-colors.ts`.
