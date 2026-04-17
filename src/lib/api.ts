import type {
  Session,
  SessionLog,
  SessionDebugInfo,
  SessionsQueryParams,
} from "./types";
import { getSelectedProject } from "./project-state";

const API_BASE = "/api";

async function fetchJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {};
  const project = getSelectedProject();
  if (project) {
    headers["X-BB-Project"] = project;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function listSessions(
  params?: SessionsQueryParams,
): Promise<Session[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.q) searchParams.set("q", params.q);

  const qs = searchParams.toString();
  const url = qs
    ? `${API_BASE}/sessions?${qs}`
    : `${API_BASE}/sessions`;

  return fetchJson<Session[]>(url);
}

export async function getSession(id: string): Promise<Session> {
  return fetchJson<Session>(`${API_BASE}/sessions/${id}`);
}

export async function getSessionLogs(id: string): Promise<SessionLog[]> {
  return fetchJson<SessionLog[]>(`${API_BASE}/sessions/${id}/logs`);
}

export async function getSessionDebug(id: string): Promise<SessionDebugInfo> {
  return fetchJson<SessionDebugInfo>(`${API_BASE}/sessions/${id}/debug`);
}

export function getSessionReplayUrl(id: string): string {
  return `https://www.browserbase.com/sessions/${id}`;
}
