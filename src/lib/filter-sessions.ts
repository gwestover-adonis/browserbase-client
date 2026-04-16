import type { Session } from "./types";
import type { PropertyFilters } from "./property-filters";

/**
 * Apply status + property filters to a session array.
 * Mirrors the column filter logic in columns.tsx so the analytics view
 * shows the same subset as the table view.
 */
export function filterSessions(
  sessions: Session[],
  statusFilter: string,
  propertyFilters: PropertyFilters,
): Session[] {
  return sessions.filter((s) => {
    // Status filter
    if (statusFilter && statusFilter !== "ALL" && s.status !== statusFilter) {
      return false;
    }

    // Created date range
    if (propertyFilters.createdAfter || propertyFilters.createdBefore) {
      const created = new Date(s.createdAt).getTime();
      if (
        propertyFilters.createdAfter &&
        created < new Date(propertyFilters.createdAfter).getTime()
      ) {
        return false;
      }
      if (
        propertyFilters.createdBefore &&
        created > new Date(propertyFilters.createdBefore + "T23:59:59").getTime()
      ) {
        return false;
      }
    }

    // Duration range
    if (propertyFilters.durationMin != null || propertyFilters.durationMax != null) {
      if (!s.startedAt) return false;
      const start = new Date(s.startedAt).getTime();
      const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
      const durationSec = (end - start) / 1000;
      if (propertyFilters.durationMin != null && durationSec < propertyFilters.durationMin) {
        return false;
      }
      if (propertyFilters.durationMax != null && durationSec > propertyFilters.durationMax) {
        return false;
      }
    }

    // Region filter
    if (
      propertyFilters.regions &&
      propertyFilters.regions.length > 0 &&
      !propertyFilters.regions.includes(s.region)
    ) {
      return false;
    }

    // Proxy bytes range
    if (propertyFilters.proxyBytesMin != null || propertyFilters.proxyBytesMax != null) {
      const bytes = s.proxyBytes ?? 0;
      if (propertyFilters.proxyBytesMin != null && bytes < propertyFilters.proxyBytesMin) {
        return false;
      }
      if (propertyFilters.proxyBytesMax != null && bytes > propertyFilters.proxyBytesMax) {
        return false;
      }
    }

    return true;
  });
}
