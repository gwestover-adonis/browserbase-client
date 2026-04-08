import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { listSessions } from "@/lib/api";
import type { Session, SessionsQueryParams } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SessionFilters } from "./SessionFilters";
import { SessionTable } from "./SessionTable";
import { SessionDetail } from "./SessionDetail";
import { columns } from "./columns";
import type { PropertyFilters } from "@/lib/property-filters";
import { EMPTY_FILTERS } from "@/lib/property-filters";
import { useMetadataSchema } from "@/lib/metadata-schema";

export function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastQuery, setLastQuery] = useState<SessionsQueryParams | undefined>();
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>(EMPTY_FILTERS);
  const { keyPaths, valuesForKey } = useMetadataSchema(sessions);

  const fetchSessions = useCallback(async (params?: SessionsQueryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listSessions(params);
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function handleSearch(params: SessionsQueryParams) {
    setStatusFilter(params.status ?? "ALL");
    setLastQuery(params);
    fetchSessions(params);
  }

  function handleRefresh() {
    fetchSessions(lastQuery);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <SessionFilters
            onSearch={handleSearch}
            isLoading={isLoading}
            propertyFilters={propertyFilters}
            onPropertyFiltersChange={setPropertyFilters}
            keyPaths={keyPaths}
            valuesForKey={valuesForKey}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          title="Refresh"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading && sessions.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="size-6" />
          <span className="text-sm">Loading sessions...</span>
        </div>
      ) : (
        <SessionTable
          columns={columns}
          data={sessions}
          onRowClick={setSelectedSession}
          statusFilter={statusFilter}
          propertyFilters={propertyFilters}
        />
      )}

      <SessionDetail
        session={selectedSession}
        open={selectedSession !== null}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
