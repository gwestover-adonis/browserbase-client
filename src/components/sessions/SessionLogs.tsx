import { useEffect, useState } from "react";
import { JsonView, darkStyles, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { getSessionLogs } from "@/lib/api";
import type { SessionLog } from "@/lib/types";

interface SessionLogsProps {
  sessionId: string;
}

export function SessionLogs({ sessionId }: SessionLogsProps) {
  const [logs, setLogs] = useState<SessionLog[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getSessionLogs(sessionId)
      .then(setLogs)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load logs"),
      )
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading logs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No logs available for this session.
      </div>
    );
  }

  return (
    <div className="mt-3 max-h-[500px] overflow-y-auto rounded-lg border bg-muted/30 p-3">
      <JsonView
        data={logs}
        shouldExpandNode={(level) => level < 1}
        style={isDark ? darkStyles : defaultStyles}
      />
    </div>
  );
}
