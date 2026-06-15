import type { SessionStatus } from "@/lib/types";
import { STATUS_CONFIG } from "@/lib/status";

export const STATUS_COLORS: Record<SessionStatus, string> = {
  COMPLETED: STATUS_CONFIG.COMPLETED.chartColor,
  RUNNING: STATUS_CONFIG.RUNNING.chartColor,
  ERROR: STATUS_CONFIG.ERROR.chartColor,
  TIMED_OUT: STATUS_CONFIG.TIMED_OUT.chartColor,
};

// Hue-shifted palette for metadata grouping (10 distinguishable colors)
const GROUP_HUES = [210, 150, 30, 280, 350, 180, 60, 310, 120, 240];

export function getGroupColor(index: number): string {
  const hue = GROUP_HUES[index % GROUP_HUES.length];
  return `oklch(0.65 0.15 ${hue})`;
}

export const SPECIAL_GROUP_COLOR = "var(--muted-foreground)";
