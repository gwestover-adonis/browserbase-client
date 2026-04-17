import type { Context } from "hono";
import { Hono } from "hono";
import { getApiKeyForProject } from "../projects.js";

const BROWSERBASE_API = process.env.BROWSERBASE_API_URL ?? "https://api.browserbase.com/v1";

const sessions = new Hono();

function resolveApiKey(c: Context): string {
  const project = c.req.header("X-BB-Project");
  if (!project) throw new Error("Missing X-BB-Project header");
  return getApiKeyForProject(project);
}

async function proxyGet(c: Context, path: string, queryString?: string) {
  const url = queryString
    ? `${BROWSERBASE_API}${path}?${queryString}`
    : `${BROWSERBASE_API}${path}`;

  const res = await fetch(url, {
    headers: { "X-BB-API-Key": resolveApiKey(c) },
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
  return proxyGet(c, "/sessions", qs || undefined);
});

sessions.get("/:id", async (c) => {
  const id = c.req.param("id");
  return proxyGet(c, `/sessions/${id}`);
});

sessions.get("/:id/logs", async (c) => {
  const id = c.req.param("id");
  return proxyGet(c, `/sessions/${id}/logs`);
});

sessions.get("/:id/debug", async (c) => {
  const id = c.req.param("id");
  return proxyGet(c, `/sessions/${id}/debug`);
});

export { sessions };
