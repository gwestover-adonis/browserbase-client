import { useEffect, useState } from "react";
import { ChevronRight, Code2 } from "lucide-react";
import { JsonView, darkStyles, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { getSessionLogs } from "@/lib/api";
import type { SessionLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatLogTime } from "@/lib/format";

interface SessionLogsProps {
  sessionId: string;
}

function summarize(log: SessionLog): string {
  if (log.params) {
    const all = log.params as Record<string, unknown>;
    const { url, expression, selector } = all;
    const skip = new Set(["frameId", "sessionId", "url", "expression", "selector"]);
    const rest = Object.fromEntries(Object.entries(all).filter(([k]) => !skip.has(k)));
    if (url) return String(url);
    if (expression) return String(expression).slice(0, 80);
    if (selector) return String(selector);
    const keys = Object.keys(rest);
    if (keys.length > 0) return keys.slice(0, 3).join(", ");
  }
  if (log.result) {
    const entries = Object.entries(log.result as Record<string, unknown>);
    if (entries.length > 0) {
      const [k, v] = entries[0];
      return `${k}: ${JSON.stringify(v)}`.slice(0, 80);
    }
  }
  return "";
}

function LogEntry({ log }: { log: SessionLog }) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const method = log.method ?? "(unknown)";
  const domain = method.includes(".") ? method.split(".")[0] : method;
  const action = method.includes(".") ? method.split(".").slice(1).join(".") : "";
  const summary = summarize(log);
  const hasDetail = log.params || log.result;

  return (
    <div className="group border-b border-border/40 last:border-0">
      <button
        type="button"
        className={cn(
          "flex w-full items-start gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/40 transition-colors",
          expanded && "bg-muted/30"
        )}
        onClick={() => hasDetail && setExpanded((v) => !v)}
        disabled={!hasDetail}
      >
        {hasDetail ? (
          <ChevronRight
            className={cn(
              "mt-0.5 size-3 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        ) : (
          <span className="mt-0.5 size-3 shrink-0" />
        )}
        <span className="w-24 shrink-0 font-mono text-muted-foreground tabular-nums">
          {log.timestamp ? formatLogTime(log.timestamp) : "—"}
        </span>
        <span className="shrink-0">
          <span className="font-medium text-foreground">{domain}</span>
          {action && (
            <span className="text-muted-foreground">.{action}</span>
          )}
        </span>
        {summary && (
          <span className="truncate text-muted-foreground/70">{summary}</span>
        )}
      </button>

      {expanded && hasDetail && (
        <div className="pb-2 pl-8 pr-3">
          <div className="flex justify-end mb-1">
            <Button
              variant="ghost"
              size="xs"
              className="h-5 gap-1 text-[10px] text-muted-foreground"
              onClick={() => setShowRaw((v) => !v)}
            >
              <Code2 className="size-3" />
              {showRaw ? "Structured" : "Raw JSON"}
            </Button>
          </div>
          {showRaw ? (
            <div className="rounded border bg-muted/20 p-2">
              <JsonView
                data={{ params: log.params, result: log.result }}
                shouldExpandNode={(level) => level < 2}
                style={isDark ? darkStyles : defaultStyles}
              />
            </div>
          ) : (
            <div className="space-y-1.5 rounded border bg-muted/20 p-2">
              {log.params && (
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Params
                  </p>
                  <div className="space-y-0.5">
                    {Object.entries(log.params as Record<string, unknown>).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <span className="font-mono text-muted-foreground w-28 shrink-0 truncate">{k}</span>
                        <span className="font-mono truncate">{JSON.stringify(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {log.result && Object.keys(log.result).length > 0 && (
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Result
                  </p>
                  <div className="space-y-0.5">
                    {Object.entries(log.result as Record<string, unknown>).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <span className="font-mono text-muted-foreground w-28 shrink-0 truncate">{k}</span>
                        <span className="font-mono truncate">{JSON.stringify(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SessionLogs({ sessionId }: SessionLogsProps) {
  const [logs, setLogs] = useState<SessionLog[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="mt-3 max-h-[500px] overflow-y-auto rounded-lg border bg-background">
      {logs.map((log, i) => (
        <LogEntry key={i} log={log} />
      ))}
    </div>
  );
}
