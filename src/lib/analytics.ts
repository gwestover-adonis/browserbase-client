import type { Session, SessionStatus } from "./types";

// ── Types ──────────────────────────────────────────────────────────

export interface VolumeDataPoint {
  date: string; // "2024-01-15" or "2024-W03" for weekly
  COMPLETED: number;
  ERROR: number;
  TIMED_OUT: number;
  RUNNING: number;
}

export interface StatusCount {
  status: SessionStatus;
  count: number;
  percentage: number;
}

export interface DurationBucket {
  label: string;
  min: number; // seconds
  max: number; // seconds (Infinity for last)
  count: number;
}

export interface MetadataGroup {
  value: string;
  count: number;
  avgDurationSec: number | null;
  errorRate: number; // 0-1
  avgProxyBytes: number;
  isSpecial?: boolean; // true for "No value" and "Other"
}

export interface ConcurrencyDataPoint {
  time: number;
  label: string;
  peak: number;
}

export interface ConcurrencySummary {
  peakConcurrency: number;
  avgConcurrency: number;
  peakTime: string | null;
  granularity: string;
}

export interface ConcurrencyResult {
  data: ConcurrencyDataPoint[];
  summary: ConcurrencySummary;
  rawMinutePeaks?: number[];
  minuteRangeStartMs?: number;
}

// ── Helpers ────────────────────────────────────────────────────────

function toDateKey(iso: string): string {
  return iso.slice(0, 10); // "2024-01-15"
}

function toWeekKey(iso: string): string {
  const d = new Date(iso);
  // ISO week: find the Thursday of this week, then compute the week number
  const day = d.getUTCDay();
  const thu = new Date(d);
  thu.setUTCDate(d.getUTCDate() - ((day + 6) % 7) + 3);
  const year = thu.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const weekNum =
    1 + Math.round(((thu.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

function sessionDurationSec(s: Session): number | null {
  if (!s.startedAt) return null;
  const start = new Date(s.startedAt).getTime();
  const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
  return (end - start) / 1000;
}

export function resolveKeyPath(
  metadata: Record<string, unknown> | undefined,
  keyPath: string,
): unknown {
  if (!metadata) return undefined;
  const segments = keyPath.split(".");
  let current: unknown = metadata;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

// ── Volume by day ──────────────────────────────────────────────────

export function computeVolumeByDay(sessions: Session[]): VolumeDataPoint[] {
  if (sessions.length === 0) return [];

  // Determine date range to decide day vs week bucketing
  const dates = sessions.map((s) => new Date(s.createdAt).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const rangeInDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  const useWeeks = rangeInDays > 90;

  const bucketKey = useWeeks ? toWeekKey : toDateKey;

  const buckets = new Map<string, VolumeDataPoint>();

  for (const s of sessions) {
    const key = bucketKey(s.createdAt);
    let point = buckets.get(key);
    if (!point) {
      point = { date: key, COMPLETED: 0, ERROR: 0, TIMED_OUT: 0, RUNNING: 0 };
      buckets.set(key, point);
    }
    point[s.status]++;
  }

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ── Status breakdown ───────────────────────────────────────────────

const ALL_STATUSES: SessionStatus[] = ["COMPLETED", "ERROR", "TIMED_OUT", "RUNNING"];

export function computeStatusBreakdown(sessions: Session[]): StatusCount[] {
  const counts = new Map<SessionStatus, number>();
  for (const status of ALL_STATUSES) counts.set(status, 0);
  for (const s of sessions) counts.set(s.status, (counts.get(s.status) ?? 0) + 1);

  const total = sessions.length || 1;
  return ALL_STATUSES.map((status) => ({
    status,
    count: counts.get(status)!,
    percentage: (counts.get(status)! / total) * 100,
  }));
}

// ── Duration distribution ──────────────────────────────────────────

const DURATION_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: "0-10s", min: 0, max: 10 },
  { label: "10-30s", min: 10, max: 30 },
  { label: "30s-1m", min: 30, max: 60 },
  { label: "1-5m", min: 60, max: 300 },
  { label: "5-15m", min: 300, max: 900 },
  { label: "15-30m", min: 900, max: 1800 },
  { label: "30m-1h", min: 1800, max: 3600 },
  { label: "1h+", min: 3600, max: Infinity },
];

export function computeDurationDistribution(sessions: Session[]): DurationBucket[] {
  const buckets: DurationBucket[] = DURATION_BUCKETS.map((b) => ({ ...b, count: 0 }));

  for (const s of sessions) {
    const dur = sessionDurationSec(s);
    if (dur === null) continue;
    for (const bucket of buckets) {
      if (dur >= bucket.min && dur < bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets;
}

// ── Metadata-driven grouping ───────────────────────────────────────

export function computeMetadataGroups(
  sessions: Session[],
  keyPath: string,
  topN: number,
): MetadataGroup[] {
  // Group sessions by resolved metadata value
  const groups = new Map<string, Session[]>();

  for (const s of sessions) {
    const raw = resolveKeyPath(s.userMetadata, keyPath);
    let key: string;
    if (raw === undefined || raw === null) {
      key = "No value";
    } else if (typeof raw === "object") {
      key = "[object]";
    } else {
      key = String(raw);
    }

    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(s);
  }

  // Convert to MetadataGroup and sort by count desc
  const allGroups: MetadataGroup[] = [];
  for (const [value, groupSessions] of groups) {
    allGroups.push(aggregateGroup(value, groupSessions, value === "No value" || value === "[object]"));
  }
  allGroups.sort((a, b) => b.count - a.count);

  // Apply top N + "Other" bucketing
  if (allGroups.length <= topN) return sortSpecialLast(allGroups);

  const top = allGroups.slice(0, topN);

  // Merge the rest into "Other"
  const rest = allGroups.slice(topN);
  const otherCount = rest.reduce((sum, g) => sum + g.count, 0);
  const otherDurations = rest.filter((g) => g.avgDurationSec !== null);
  const otherAvgDur =
    otherDurations.length > 0
      ? otherDurations.reduce((sum, g) => sum + g.avgDurationSec! * g.count, 0) /
        otherDurations.reduce((sum, g) => sum + g.count, 0)
      : null;
  const otherErrors = rest.reduce((sum, g) => sum + g.errorRate * g.count, 0);
  const otherProxy = rest.reduce((sum, g) => sum + g.avgProxyBytes * g.count, 0);

  top.push({
    value: "Other",
    count: otherCount,
    avgDurationSec: otherAvgDur,
    errorRate: otherCount > 0 ? otherErrors / otherCount : 0,
    avgProxyBytes: otherCount > 0 ? otherProxy / otherCount : 0,
    isSpecial: true,
  });

  return sortSpecialLast(top);
}

function aggregateGroup(value: string, sessions: Session[], isSpecial: boolean): MetadataGroup {
  const count = sessions.length;

  const durations = sessions.map(sessionDurationSec).filter((d): d is number => d !== null);
  const avgDurationSec =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

  const errorCount = sessions.filter((s) => s.status === "ERROR").length;
  const errorRate = count > 0 ? errorCount / count : 0;

  const avgProxyBytes =
    count > 0 ? sessions.reduce((sum, s) => sum + s.proxyBytes, 0) / count : 0;

  return { value, count, avgDurationSec, errorRate, avgProxyBytes, isSpecial };
}

function sortSpecialLast(groups: MetadataGroup[]): MetadataGroup[] {
  const normal = groups.filter((g) => !g.isSpecial);
  const special = groups.filter((g) => g.isSpecial);
  return [...normal, ...special];
}

// ── Concurrency over time ─────────────────────────────────────────

const EMPTY_CONCURRENCY: ConcurrencyResult = {
  data: [],
  summary: { peakConcurrency: 0, avgConcurrency: 0, peakTime: null, granularity: "1-minute" },
};

function floorMinute(ms: number): number {
  return ms - (ms % 60_000);
}

function ceilMinute(ms: number): number {
  const rem = ms % 60_000;
  return rem === 0 ? ms : ms + (60_000 - rem);
}

function determineBucketSize(totalMinutes: number): { size: number; granularity: string } {
  if (totalMinutes < 1440) return { size: 1, granularity: "1-minute" };
  if (totalMinutes < 10_080) return { size: 5, granularity: "5-minute" };
  if (totalMinutes < 43_200) return { size: 15, granularity: "15-minute" };
  return { size: 60, granularity: "1-hour" };
}

function formatBucketLabel(epochMs: number, totalRangeMs: number): string {
  const d = new Date(epochMs);
  if (totalRangeMs < 24 * 3600_000) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (totalRangeMs < 7 * 24 * 3600_000) {
    return (
      d.toLocaleDateString("en-US", { weekday: "short" }) +
      " " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    );
  }
  if (totalRangeMs < 30 * 24 * 3600_000) {
    return (
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    );
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function computeConcurrency(sessions: Session[]): ConcurrencyResult {
  // Phase 1: Build events
  const now = Date.now();
  const events: Array<{ time: number; delta: number }> = [];

  for (const s of sessions) {
    if (!s.startedAt) continue;
    const startMs = new Date(s.startedAt).getTime();
    const endMs = s.endedAt ? new Date(s.endedAt).getTime() : now;
    if (endMs <= startMs) continue;
    events.push({ time: startMs, delta: 1 });
    events.push({ time: endMs, delta: -1 });
  }

  if (events.length === 0) return EMPTY_CONCURRENCY;

  // Phase 2: Sweep line
  events.sort((a, b) => a.time - b.time || a.delta - b.delta);

  const changePoints: Array<{ time: number; count: number }> = [];
  let runningCount = 0;
  for (const e of events) {
    runningCount += e.delta;
    changePoints.push({ time: e.time, count: runningCount });
  }

  // Phase 3: Minute-level bucketing
  const rangeStart = floorMinute(changePoints[0].time);
  const rangeEnd = ceilMinute(changePoints[changePoints.length - 1].time);
  const totalMinutes = Math.max(1, (rangeEnd - rangeStart) / 60_000);

  const minutePeaks: number[] = new Array(totalMinutes);
  let cpIdx = 0;
  let carry = 0;
  let overallPeak = 0;
  let overallPeakMinuteIdx = 0;
  let peakSum = 0;

  for (let i = 0; i < totalMinutes; i++) {
    const bucketStart = rangeStart + i * 60_000;
    const bucketEnd = bucketStart + 60_000;
    let peak = carry;

    while (cpIdx < changePoints.length && changePoints[cpIdx].time < bucketEnd) {
      if (changePoints[cpIdx].time >= bucketStart) {
        peak = Math.max(peak, changePoints[cpIdx].count);
      }
      carry = changePoints[cpIdx].count;
      cpIdx++;
    }

    minutePeaks[i] = peak;
    peakSum += peak;

    if (peak > overallPeak) {
      overallPeak = peak;
      overallPeakMinuteIdx = i;
    }
  }

  const avgConcurrency = peakSum / totalMinutes;
  const peakTimeMs = rangeStart + overallPeakMinuteIdx * 60_000;

  // Phase 4: Downsample for rendering
  const { size: bucketSizeMin, granularity } = determineBucketSize(totalMinutes);
  const totalRangeMs = rangeEnd - rangeStart;
  const data: ConcurrencyDataPoint[] = [];

  for (let i = 0; i < totalMinutes; i += bucketSizeMin) {
    const sliceEnd = Math.min(i + bucketSizeMin, totalMinutes);
    let maxPeak = 0;
    for (let j = i; j < sliceEnd; j++) {
      if (minutePeaks[j] > maxPeak) maxPeak = minutePeaks[j];
    }
    const time = rangeStart + i * 60_000;
    data.push({
      time,
      label: formatBucketLabel(time, totalRangeMs),
      peak: maxPeak,
    });
  }

  return {
    data,
    summary: {
      peakConcurrency: overallPeak,
      avgConcurrency,
      peakTime: new Date(peakTimeMs).toISOString(),
      granularity,
    },
    rawMinutePeaks: Array.from(minutePeaks),
    minuteRangeStartMs: rangeStart,
  };
}
