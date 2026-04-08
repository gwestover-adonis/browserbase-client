export type SessionStatus = "RUNNING" | "ERROR" | "TIMED_OUT" | "COMPLETED";

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  startedAt: string | null;
  endedAt: string | null;
  expiresAt: string | null;
  status: SessionStatus;
  proxyBytes: number;
  avgCpuUsage: number;
  memoryUsage: number;
  keepAlive: boolean;
  contextId?: string;
  region: string;
  userMetadata?: Record<string, unknown>;
}

export interface SessionLog {
  timestamp: string;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SessionDebugInfo {
  debuggerFullscreenUrl: string;
  debuggerUrl: string;
  wsUrl: string;
}

export interface SessionsQueryParams {
  status?: SessionStatus;
  q?: string;
}
