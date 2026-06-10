import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Search, TableProperties, BarChart3 } from "lucide-react";
import { listSessions } from "@/lib/api";
import type { Session, SessionsQueryParams } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SessionFilters, type SessionFiltersHandle } from "./SessionFilters";
import { SessionTable } from "./SessionTable";
import { SessionDetail } from "./SessionDetail";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { columns } from "./columns";
import type { PropertyFilters } from "@/lib/property-filters";
import { defaultFilters } from "@/lib/property-filters";
import { useMetadataSchema } from "@/lib/metadata-schema";

export function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastQuery, setLastQuery] = useState<SessionsQueryParams | undefined>();
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>(defaultFilters);
  const { keyPaths, valuesForKey } = useMetadataSchema(sessions);
  const filtersRef = useRef<SessionFiltersHandle>(null);

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
            ref={filtersRef}
            onSearch={handleSearch}
            propertyFilters={propertyFilters}
            onPropertyFiltersChange={setPropertyFilters}
            keyPaths={keyPaths}
            valuesForKey={valuesForKey}
          />
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && sessions.length > 0 && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </span>
          )}
          <Button onClick={() => filtersRef.current?.search()} disabled={isLoading}>
            <Search className="mr-1.5 size-4" />
            Search
          </Button>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              }
            />
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        </div>
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
        <Tabs defaultValue="table">
          <TabsList variant="line">
            <TabsTrigger value="table">
              <TableProperties className="size-3.5" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="size-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <SessionTable
              columns={columns}
              data={sessions}
              onRowClick={setSelectedSession}
              statusFilter={statusFilter}
              propertyFilters={propertyFilters}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard
              sessions={sessions}
              statusFilter={statusFilter}
              propertyFilters={propertyFilters}
            />
          </TabsContent>
        </Tabs>
      )}

      <SessionDetail
        session={selectedSession}
        open={selectedSession !== null}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
