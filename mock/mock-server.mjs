// Standalone mock of the Browserbase client backend (port 3002).
// Implements the same /api/* routes the real Hono server exposes so the
// Vite client can run with no app-code changes. Data is synthetic.
import { createServer } from "node:http";

const PORT = 3002;
const PROJECTS = ["development", "staging", "production"];
const REGIONS = ["us-west-2", "us-east-1", "eu-central-1", "ap-southeast-1"];
const STATUSES = ["COMPLETED", "COMPLETED", "COMPLETED", "ERROR", "TIMED_OUT", "RUNNING"];
const ENVS = ["chromium", "firefox"];
const WORKFLOWS = ["checkout-scrape", "price-monitor", "login-flow", "form-fill", "pdf-export", "crawl"];
const TEAMS = ["growth", "platform", "data", "qa"];

let seed = 42;
function rng() {
  // deterministic LCG so reloads are stable
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

function buildSessions(count = 130) {
  const now = Date.now();
  const sessions = [];
  for (let i = 0; i < count; i++) {
    // Cluster arrivals: heavier during "business hours" of each day, with a
    // burst pattern so the concurrency/FFT charts have real periodicity.
    const daysAgo = rng() * 9.5;
    const hourBias = Math.pow(rng(), 0.6); // skew toward recent within the day
    const createdMs = now - daysAgo * 86400000 - hourBias * 3600000 * 8;
    const created = new Date(createdMs);

    const status = pick(STATUSES);
    const isRunning = status === "RUNNING";
    const startedMs = createdMs + randInt(200, 1500);
    const durationSec =
      status === "TIMED_OUT" ? randInt(280, 320)
      : status === "ERROR" ? randInt(2, 90)
      : randInt(5, 240);
    const endedMs = isRunning ? null : startedMs + durationSec * 1000;

    sessions.push({
      id: `sess_${(1000000 + i).toString(36)}${Math.floor(rng() * 1e6).toString(36)}`,
      createdAt: created.toISOString(),
      updatedAt: new Date(endedMs ?? startedMs).toISOString(),
      projectId: "proj_mock",
      startedAt: new Date(startedMs).toISOString(),
      endedAt: endedMs ? new Date(endedMs).toISOString() : null,
      expiresAt: new Date(createdMs + 3600000).toISOString(),
      status,
      proxyBytes: Math.floor(Math.pow(rng(), 2) * 90 * 1024 * 1024),
      avgCpuUsage: Math.round(rng() * 90),
      memoryUsage: Math.floor(rng() * 1500 * 1024 * 1024),
      keepAlive: rng() > 0.85,
      region: pick(REGIONS),
      userMetadata: {
        workflow: pick(WORKFLOWS),
        team: pick(TEAMS),
        environment: pick(ENVS),
        attempt: randInt(1, 3),
        customer: {
          tier: pick(["free", "pro", "enterprise"]),
          id: `cust_${randInt(100, 999)}`,
        },
      },
    });
  }
  return sessions.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

const ALL = buildSessions();

function buildLogs(id) {
  const methods = ["Page.navigate", "Runtime.evaluate", "Network.requestWillBeSent",
    "DOM.querySelector", "Input.dispatchMouseEvent", "Page.captureScreenshot"];
  const base = Date.now() - 120000;
  return Array.from({ length: 14 }, (_, i) => ({
    timestamp: new Date(base + i * 4200).toISOString(),
    method: methods[i % methods.length],
    params: { sessionId: id, frameId: `frame_${i % 3}`, url: i % 3 === 0 ? "https://example.com/cart" : undefined },
    result: { value: i % 2 === 0 ? "ok" : { status: 200 } },
  }));
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "X-BB-Project",
  });
  res.end(JSON.stringify(body));
}

createServer((req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;

  if (p === "/api/health") return json(res, 200, { ok: true });
  if (p === "/api/projects") return json(res, 200, PROJECTS.map((name) => ({ name })));

  if (p === "/api/sessions") {
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");
    let out = ALL;
    if (status) out = out.filter((s) => s.status === status);
    if (q) {
      // crude support for user_metadata['k']:'v' AND-joined clauses
      const clauses = [...q.matchAll(/user_metadata((?:\['[^']*'\])+):'([^']*)'/g)];
      out = out.filter((s) =>
        clauses.every(([, brackets, val]) => {
          const path = [...brackets.matchAll(/\['([^']*)'\]/g)].map((m) => m[1]);
          let cur = s.userMetadata;
          for (const seg of path) cur = cur?.[seg];
          return String(cur) === val;
        }),
      );
    }
    return json(res, 200, out);
  }

  let m;
  if ((m = p.match(/^\/api\/sessions\/([^/]+)\/logs$/))) return json(res, 200, buildLogs(m[1]));
  if ((m = p.match(/^\/api\/sessions\/([^/]+)\/debug$/)))
    return json(res, 200, {
      debuggerFullscreenUrl: `https://www.browserbase.com/devtools-fullscreen/${m[1]}`,
      debuggerUrl: `https://www.browserbase.com/devtools/${m[1]}`,
      wsUrl: `wss://connect.browserbase.com/debug/${m[1]}`,
    });
  if ((m = p.match(/^\/api\/sessions\/([^/]+)$/))) {
    const s = ALL.find((x) => x.id === m[1]);
    return s ? json(res, 200, s) : json(res, 404, { error: "not found" });
  }

  json(res, 404, { error: `no mock route for ${p}` });
}).listen(PORT, () => console.log(`Mock Browserbase backend on http://localhost:${PORT}`));
