import { Hono } from "hono";

const BROWSERBASE_API = process.env.BROWSERBASE_API_URL ?? "https://api.browserbase.com/v1";

const sessions = new Hono();

function getApiKey(): string {
  const key = process.env.BROWSERBASE_API_KEY;
  if (!key) throw new Error("BROWSERBASE_API_KEY is not set");
  return key;
}

async function proxyGet(path: string, queryString?: string) {
  const url = queryString
    ? `${BROWSERBASE_API}${path}?${queryString}`
    : `${BROWSERBASE_API}${path}`;

  const res = await fetch(url, {
    headers: { "X-BB-API-Key": getApiKey() },
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

sessions.get("/", async (c) => {
  const params = new URLSearchParams();
  const status = c.req.query("status");
  const q = c.req.query("q");
  if (status) params.set("status", status);
  if (q) params.set("q", q);

  const qs = params.toString();
  return proxyGet("/sessions", qs || undefined);
});

sessions.get("/:id", async (c) => {
  const id = c.req.param("id");
  return proxyGet(`/sessions/${id}`);
});

sessions.get("/:id/logs", async (c) => {
  const id = c.req.param("id");
  return proxyGet(`/sessions/${id}/logs`);
});

sessions.get("/:id/debug", async (c) => {
  const id = c.req.param("id");
  return proxyGet(`/sessions/${id}/debug`);
});

export { sessions };
