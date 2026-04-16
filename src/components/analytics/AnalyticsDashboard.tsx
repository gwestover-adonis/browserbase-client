import { useMemo } from "react";
import { Clock, AlertTriangle, Activity, ArrowDownUp } from "lucide-react";
import type { Session } from "@/lib/types";
import type { PropertyFilters } from "@/lib/property-filters";
import { filterSessions } from "@/lib/filter-sessions";
import {
  computeVolumeByDay,
  computeStatusBreakdown,
  computeDurationDistribution,
  computeConcurrency,
} from "@/lib/analytics";
import { analyzeFrequency } from "@/lib/fft";
import { formatBytes } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { VolumeChart } from "./VolumeChart";
import { StatusChart } from "./StatusChart";
import { DurationChart } from "./DurationChart";
import { MetadataGrouping } from "./MetadataGrouping";
import { ConcurrencyChart } from "./ConcurrencyChart";
import { FrequencyChart } from "./FrequencyChart";

interface AnalyticsDashboardProps {
  sessions: Session[];
  statusFilter: string;
  propertyFilters: PropertyFilters;
}

function formatAvgDuration(sessions: Session[]): string {
  const durations = sessions
    .filter((s) => s.startedAt && s.endedAt)
    .map((s) => new Date(s.endedAt!).getTime() - new Date(s.startedAt!).getTime());
  if (durations.length === 0) return "-";
  const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length;
  if (avgMs < 1000) return `${Math.round(avgMs)}ms`;
  const sec = avgMs / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = sec / 60;
  if (min < 60) return `${min.toFixed(1)}m`;
  return `${(min / 60).toFixed(1)}h`;
}

export function AnalyticsDashboard({
  sessions,
  statusFilter,
  propertyFilters,
}: AnalyticsDashboardProps) {
  const filtered = useMemo(
    () => filterSessions(sessions, statusFilter, propertyFilters),
    [sessions, statusFilter, propertyFilters],
  );

  const volume = useMemo(() => computeVolumeByDay(filtered), [filtered]);
  const statusBreakdown = useMemo(() => computeStatusBreakdown(filtered), [filtered]);
  const duration = useMemo(() => computeDurationDistribution(filtered), [filtered]);
  const concurrency = useMemo(() => computeConcurrency(filtered), [filtered]);
  const frequencyAnalysis = useMemo(() => {
    if (!concurrency.rawMinutePeaks || concurrency.rawMinutePeaks.length < 30) return null;
    return analyzeFrequency(concurrency.rawMinutePeaks, concurrency.rawMinutePeaks.length);
  }, [concurrency.rawMinutePeaks]);

  const errorRate = useMemo(() => {
    if (filtered.length === 0) return 0;
    return (filtered.filter((s) => s.status === "ERROR").length / filtered.length) * 100;
  }, [filtered]);

  const totalProxy = useMemo(
    () => filtered.reduce((sum, s) => sum + s.proxyBytes, 0),
    [filtered],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <VolumeChart data={volume} />
        <StatusChart data={statusBreakdown} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DurationChart data={duration} />
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <StatItem
                icon={<Activity className="size-4" />}
                label="Total Sessions"
                value={String(filtered.length)}
              />
              <StatItem
                icon={<Clock className="size-4" />}
                label="Avg Duration"
                value={formatAvgDuration(filtered)}
              />
              <StatItem
                icon={<AlertTriangle className="size-4" />}
                label="Error Rate"
                value={`${errorRate.toFixed(1)}%`}
              />
              <StatItem
                icon={<ArrowDownUp className="size-4" />}
                label="Total Proxy"
                value={formatBytes(totalProxy)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <ConcurrencyChart data={concurrency.data} summary={concurrency.summary} />
      <FrequencyChart analysis={frequencyAnalysis} />
      <MetadataGrouping sessions={filtered} />
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
