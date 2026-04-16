import type { SessionStatus } from "@/lib/types";

export const STATUS_COLORS: Record<SessionStatus, string> = {
  COMPLETED: "var(--chart-status-completed)",
  RUNNING: "var(--chart-status-running)",
  ERROR: "var(--chart-status-error)",
  TIMED_OUT: "var(--chart-status-timed-out)",
};

// Hue-shifted palette for metadata grouping (10 distinguishable colors)
const GROUP_HUES = [210, 150, 30, 280, 350, 180, 60, 310, 120, 240];

export function getGroupColor(index: number): string {
  const hue = GROUP_HUES[index % GROUP_HUES.length];
  return `oklch(0.65 0.15 ${hue})`;
}

export const SPECIAL_GROUP_COLOR = "var(--muted-foreground)";
