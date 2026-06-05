# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev (full stack):** `npm run dev` — runs Hono server (port 3002) and Vite client (port 5173) concurrently
- **Dev (server only):** `npm run dev:server` — tsx watch on `src/server/index.ts`
- **Dev (client only):** `npm run dev:client` — Vite dev server
- **Build:** `npm run build` — TypeScript type-check + Vite production build
- **Lint:** `npm run lint` — ESLint
- **Preview:** `npm run preview` — serve production build locally

## Architecture

Local web client for browsing and inspecting Browserbase sessions. React frontend + Hono backend proxy.

**Backend (Hono, `src/server/`):** Thin API proxy that keeps Browserbase API keys server-side. Routes mount at `/api/sessions` and `/api/projects`. All session routes require an `x-bb-project` header to select which project's API key to use.

**Frontend (React 19 + Vite, `src/`):** Single-page app — `SessionsPage` is the main orchestrator. Uses `@tanstack/react-table` for the session list with client-side sorting/filtering/pagination (25 rows/page). Session details render in a right-side sheet panel. UI built with shadcn/ui components (`src/components/ui/`), Tailwind CSS 4, and Lucide icons.

**Client-server communication (`src/lib/api.ts`):** All API calls go through this module. Vite proxies `/api` to localhost:3002 in dev.

**Project management (`src/lib/use-project.tsx`):** `ProjectProvider` context manages multi-project selection, persists to localStorage (`bb-project` key). Supports single project (`BROWSERBASE_API_KEY` env var) or multiple (`BROWSERBASE_PROJECTS` JSON env var).

**TypeScript config:** Separate configs for app (`tsconfig.app.json`, excludes `src/server`) and server (`tsconfig.server.json`, includes only `src/server`). Both use strict mode with `noUnusedLocals` and `noUnusedParameters`.

## Environment

Copy `.env.example` to `.env`. Single project needs `BROWSERBASE_API_KEY`. Multi-project uses `BROWSERBASE_PROJECTS` as JSON mapping names to keys. Server defaults to port 3002, client to 5173.

## Styling

Tailwind CSS 4 via `@tailwindcss/vite` plugin (no separate tailwind config file). Dark mode is class-based (`.dark`), toggled via `useTheme` hook with system preference detection and localStorage override. Theme colors use CSS custom properties.
