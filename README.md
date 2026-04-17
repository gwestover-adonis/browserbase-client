# Browserbase Client

A local web client for browsing and inspecting [Browserbase](https://www.browserbase.com/) sessions. View session lists, metadata, logs, and debug info from your browser.

## Prerequisites

- Node.js 18+
- A [Browserbase](https://www.browserbase.com/) account and API key

## Setup

```bash
git clone <repo-url>
cd browserbase-client
npm install
cp .env.example .env
```

Edit `.env` and add your Browserbase API keys. Each project gets its own environment variable using the naming convention `BROWSERBASE_API_KEY_<NAME>`:

```env
BROWSERBASE_API_KEY_DEVELOPMENT=bb_live_...
BROWSERBASE_API_KEY_PRODUCTION=bb_live_...
BROWSERBASE_API_KEY_STAGE=bb_live_...
```

The `<NAME>` suffix (e.g. `DEVELOPMENT`, `PRODUCTION`) becomes the project label shown in the UI dropdown. You need at least one key to start the server. You can find your API keys in the [Browserbase dashboard](https://www.browserbase.com/settings) under each project.

## Usage

```bash
npm run dev
```

This starts both the API proxy server (port 3002) and the Vite dev server (port 5173). Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both server and client |
| `npm run dev:server` | Start only the API proxy server |
| `npm run dev:client` | Start only the Vite dev client |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |

## How it works

The app runs a lightweight [Hono](https://hono.dev/) server that proxies requests to the Browserbase API, keeping your API key server-side. The React frontend talks only to the local proxy.

## License

[MIT](LICENSE)
