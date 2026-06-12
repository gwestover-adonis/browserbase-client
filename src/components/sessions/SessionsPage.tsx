import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Search, TableProperties, BarChart3, Radio } from "lucide-react";
import { listSessions } from "@/lib/api";
import type { Session, SessionsQueryParams } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionFilters, type SessionFiltersHandle } from "./SessionFilters";
import { SessionTable } from "./SessionTable";
import { SessionDetail } from "./SessionDetail";
import { MetricsStrip } from "./MetricsStrip";
import { useLiveRunning } from "./LiveRunningStrip";
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
  const [isStale, setIsStale] = useState(false);
  const [activeTab, setActiveTab] = useState("table");
  const { keyPaths, valuesForKey } = useMetadataSchema(sessions);
  const filtersRef = useRef<SessionFiltersHandle>(null);
  const liveSessions = useLiveRunning();

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
    setIsStale(false);
    fetchSessions(params);
  }

  function handleRefresh() {
    fetchSessions(lastQuery);
  }

  function handleBrush(range: { startDate: string; endDate: string } | null) {
    if (!range) {
      setPropertyFilters((prev) => ({
        ...prev,
        createdAfter: undefined,
        createdBefore: undefined,
      }));
    } else {
      setPropertyFilters((prev) => ({
        ...prev,
        createdAfter: range.startDate,
        createdBefore: range.endDate,
      }));
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="flex-1">
          <SessionFilters
            ref={filtersRef}
            onSearch={handleSearch}
            onServerFilterChange={() => setIsStale(true)}
            propertyFilters={propertyFilters}
            onPropertyFiltersChange={setPropertyFilters}
            keyPaths={keyPaths}
            valuesForKey={valuesForKey}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => filtersRef.current?.search()}
            disabled={isLoading}
            variant={isStale ? "default" : "outline"}
            className={isStale ? "ring-2 ring-primary/40" : ""}
          >
            <Search className="mr-1.5 size-4" />
            Search
            {isStale && <span className="ml-1.5 size-1.5 rounded-full bg-primary-foreground/70 inline-block" />}
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
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive shrink-0">
          {error}
        </div>
      )}

      {isLoading && sessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="size-6" />
          <span className="text-sm">Loading sessions...</span>
        </div>
      ) : (
        <>
          <MetricsStrip
            sessions={sessions}
            statusFilter={statusFilter}
            propertyFilters={propertyFilters}
          />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
            <TabsList variant="line" className="shrink-0">
              <TabsTrigger value="table">
                <TableProperties className="size-3.5" />
                Sessions
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="size-3.5" />
                Analytics
              </TabsTrigger>
              {liveSessions.length > 0 && (
                <TabsTrigger value="live">
                  <Radio className="size-3.5 animate-pulse" />
                  Live
                  <span className="ml-1 rounded-full bg-current/20 px-1.5 py-0 text-[10px] font-mono tabular-nums">
                    {liveSessions.length}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="table" className="flex-1 overflow-hidden min-h-0">
              <SessionTable
                columns={columns}
                data={sessions}
                onRowClick={setSelectedSession}
                statusFilter={statusFilter}
                propertyFilters={propertyFilters}
              />
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 overflow-hidden min-h-0">
              <ScrollArea className="h-full overflow-hidden">
                <AnalyticsDashboard
                  sessions={sessions}
                  statusFilter={statusFilter}
                  propertyFilters={propertyFilters}
                  onBrush={handleBrush}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="live" className="flex-1 overflow-hidden min-h-0">
              <SessionTable
                columns={columns}
                data={liveSessions}
                onRowClick={setSelectedSession}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <SessionDetail
        session={selectedSession}
        open={selectedSession !== null}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
