import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import type { Session } from "@/lib/types";
import type { PropertyFilters } from "@/lib/property-filters";
import { filterSessions } from "@/lib/filter-sessions";

interface AnalyticsDashboardProps {
  sessions: Session[];
  statusFilter: string;
  propertyFilters: PropertyFilters;
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

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
      <BarChart3 className="size-10 opacity-40" />
      <p className="text-sm">
        Analytics for {filtered.length} session{filtered.length !== 1 ? "s" : ""} coming soon
      </p>
    </div>
  );
}
