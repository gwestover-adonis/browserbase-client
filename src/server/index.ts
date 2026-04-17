import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sessions } from "./routes/sessions.js";
import { getProjects } from "./projects.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(","),
    allowMethods: ["GET"],
    allowHeaders: ["X-BB-Project"],
  }),
);

app.get("/api/projects", (c) => c.json(getProjects()));

app.route("/api/sessions", sessions);

app.get("/api/health", (c) => c.json({ ok: true }));

const port = Number(process.env.PORT) || 3002;

console.log(`Hono server starting on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
