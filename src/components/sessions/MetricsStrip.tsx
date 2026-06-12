import { useMemo } from "react";
import type { Session } from "@/lib/types";
import type { PropertyFilters } from "@/lib/property-filters";
import { filterSessions } from "@/lib/filter-sessions";
import { formatBytes } from "@/lib/format";

interface MetricsStripProps {
  sessions: Session[];
  statusFilter: string;
  propertyFilters: PropertyFilters;
}

interface Metric {
  label: string;
  value: string;
  sub?: string;
}

function computeMetrics(filtered: Session[]): Metric[] {
  const total = filtered.length;

  const errors = filtered.filter((s) => s.status === "ERROR").length;
  const errorRate = total > 0 ? (errors / total) * 100 : 0;

  const durations = filtered
    .filter((s) => s.startedAt && s.endedAt)
    .map((s) => (new Date(s.endedAt!).getTime() - new Date(s.startedAt!).getTime()) / 1000)
    .sort((a, b) => a - b);

  let p50 = "-";
  if (durations.length > 0) {
    const mid = Math.floor(durations.length / 2);
    const val = durations[mid];
    p50 = val < 60 ? `${val.toFixed(0)}s` : `${(val / 60).toFixed(1)}m`;
  }

  const totalProxy = filtered.reduce((sum, s) => sum + (s.proxyBytes ?? 0), 0);

  return [
    { label: "Total", value: String(total) },
    {
      label: "Error rate",
      value: total > 0 ? `${errorRate.toFixed(1)}%` : "—",
      sub: total > 0 ? `${errors} errors` : undefined,
    },
    { label: "p50 duration", value: p50 },
    { label: "Total proxy", value: totalProxy > 0 ? formatBytes(totalProxy) : "—" },
  ];
}

export function MetricsStrip({ sessions, statusFilter, propertyFilters }: MetricsStripProps) {
  const filtered = useMemo(
    () => filterSessions(sessions, statusFilter, propertyFilters),
    [sessions, statusFilter, propertyFilters],
  );

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);

  return (
    <div className="flex items-center gap-4 rounded-md border bg-muted/40 px-3 py-1.5 shrink-0 text-xs">
      {metrics.map((m, i) => (
        <span key={i} className="flex items-baseline gap-1.5">
          <span className="text-muted-foreground">{m.label}</span>
          <span className="font-mono font-medium tabular-nums">{m.value}</span>
          {m.sub && (
            <span className="text-muted-foreground/70">({m.sub})</span>
          )}
        </span>
      ))}
    </div>
  );
}
