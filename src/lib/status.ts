import type { SessionStatus } from "./types";

export interface StatusConfig {
  label: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  /** CSS class string for inline badge coloring (overrides shadcn variant) */
  className: string;
  /** Tailwind class for the left accent bar on table rows */
  accentClass: string;
  /** Chart/recharts color — CSS var string */
  chartColor: string;
}

export const STATUS_CONFIG: Record<SessionStatus, StatusConfig> = {
  RUNNING: {
    label: "Running",
    badgeVariant: "default",
    className:
      "bg-blue-500/15 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-700",
    accentClass: "bg-blue-500",
    chartColor: "var(--chart-status-running)",
  },
  COMPLETED: {
    label: "Completed",
    badgeVariant: "secondary",
    className:
      "bg-green-500/15 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-700",
    accentClass: "bg-green-500",
    chartColor: "var(--chart-status-completed)",
  },
  ERROR: {
    label: "Error",
    badgeVariant: "destructive",
    className:
      "bg-red-500/15 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-700",
    accentClass: "bg-red-500",
    chartColor: "var(--chart-status-error)",
  },
  TIMED_OUT: {
    label: "Timed Out",
    badgeVariant: "outline",
    className:
      "bg-amber-500/15 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-700",
    accentClass: "bg-amber-500",
    chartColor: "var(--chart-status-timed-out)",
  },
};

export function getStatusConfig(status: string): StatusConfig {
  return (
    STATUS_CONFIG[status as SessionStatus] ?? {
      label: status,
      badgeVariant: "outline",
      className: "",
      accentClass: "bg-muted-foreground",
      chartColor: "var(--muted-foreground)",
    }
  );
}

/** Ordered list for status filter UI */
export const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All Statuses" },
  { value: "RUNNING", label: STATUS_CONFIG.RUNNING.label },
  { value: "COMPLETED", label: STATUS_CONFIG.COMPLETED.label },
  { value: "ERROR", label: STATUS_CONFIG.ERROR.label },
  { value: "TIMED_OUT", label: STATUS_CONFIG.TIMED_OUT.label },
];
