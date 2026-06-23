import { useCallback, useImperativeHandle, useState, type Ref } from "react";
import { Bookmark, BookmarkCheck, ChevronDown, Code, Filter, LayoutGrid, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SessionStatus } from "@/lib/types";
import { MetadataQueryBuilder } from "./MetadataQueryBuilder";
import { SessionPropertyFilters } from "./SessionPropertyFilters";
import type { MetadataCondition } from "@/lib/metadata-query";
import {
  createCondition,
  conditionsToQuery,
  queryToConditions,
} from "@/lib/metadata-query";
import type { PropertyFilters } from "@/lib/property-filters";
import { defaultFilters, KNOWN_REGIONS } from "@/lib/property-filters";
import { STATUS_OPTIONS, getStatusConfig } from "@/lib/status";
import {
  getSavedViews,
  saveView,
  deleteSavedView,
  type SavedView,
} from "@/lib/saved-views";

export interface SessionFiltersHandle {
  search: () => void;
}

interface SessionFiltersProps {
  ref?: Ref<SessionFiltersHandle>;
  onSearch: (params: { status?: SessionStatus; q?: string }) => void;
  onServerFilterChange?: () => void;
  propertyFilters: PropertyFilters;
  onPropertyFiltersChange: (filters: PropertyFilters) => void;
  keyPaths: string[];
  valuesForKey: (keyPath: string) => string[];
}

type QueryMode = "builder" | "raw";

/** Derive human-readable labels for active property filter pills */
function getActivePropertyPills(
  filters: PropertyFilters,
): Array<{ key: string; label: string; onRemove: (f: PropertyFilters) => PropertyFilters }> {
  const pills: Array<{ key: string; label: string; onRemove: (f: PropertyFilters) => PropertyFilters }> = [];

  if (filters.createdAfter || filters.createdBefore) {
    const after = filters.createdAfter ?? "";
    const before = filters.createdBefore ?? "";
    const label = after && before
      ? `${after} – ${before}`
      : after
      ? `After ${after}`
      : `Before ${before}`;
    pills.push({
      key: "date",
      label,
      onRemove: (f) => ({ ...f, createdAfter: undefined, createdBefore: undefined }),
    });
  }

  if (filters.durationMin != null || filters.durationMax != null) {
    const min = filters.durationMin ?? "0";
    const max = filters.durationMax ?? "∞";
    pills.push({
      key: "duration",
      label: `Duration ${min}–${max}s`,
      onRemove: (f) => ({ ...f, durationMin: undefined, durationMax: undefined }),
    });
  }

  if (
    filters.regions != null &&
    filters.regions.length > 0 &&
    filters.regions.length < KNOWN_REGIONS.length
  ) {
    pills.push({
      key: "region",
      label: filters.regions.join(", "),
      onRemove: (f) => ({ ...f, regions: [...KNOWN_REGIONS] }),
    });
  }

  if (filters.proxyBytesMin != null || filters.proxyBytesMax != null) {
    pills.push({
      key: "proxy",
      label: "Proxy filtered",
      onRemove: (f) => ({ ...f, proxyBytesMin: undefined, proxyBytesMax: undefined }),
    });
  }

  return pills;
}

export function SessionFilters({
  ref,
  onSearch,
  onServerFilterChange,
  propertyFilters,
  onPropertyFiltersChange,
  keyPaths,
  valuesForKey,
}: SessionFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState("ALL");
  const [mode, setMode] = useState<QueryMode>("builder");
  const [conditions, setConditions] = useState<MetadataCondition[]>([
    createCondition(),
  ]);
  const [rawQuery, setRawQuery] = useState("");
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => getSavedViews());
  const [saveViewName, setSaveViewName] = useState("");

  const getQueryString = useCallback((): string | undefined => {
    if (mode === "builder") {
      const q = conditionsToQuery(conditions);
      return q || undefined;
    }
    return rawQuery.trim() || undefined;
  }, [mode, conditions, rawQuery]);

  function handleSearch() {
    onSearch({
      status: status === "ALL" ? undefined : (status as SessionStatus),
      q: getQueryString(),
    });
  }

  useImperativeHandle(ref, () => ({ search: handleSearch }));

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handleStatusChange(val: string) {
    setStatus(val);
    onServerFilterChange?.();
  }

  function handleConditionsChange(next: MetadataCondition[]) {
    setConditions(next);
    onServerFilterChange?.();
  }

  function handleRawQueryChange(val: string) {
    setRawQuery(val);
    onServerFilterChange?.();
  }

  function handleModeChange(newMode: string | null) {
    if (newMode === null) return;
    const nextMode = newMode as QueryMode;
    if (nextMode === "raw" && mode === "builder") {
      setRawQuery(conditionsToQuery(conditions));
    } else if (nextMode === "builder" && mode === "raw") {
      const parsed = queryToConditions(rawQuery);
      if (parsed !== null) {
        setConditions(parsed.length > 0 ? parsed : [createCondition()]);
      }
    }
    setMode(nextMode);
  }

  function handleSaveView() {
    const name = saveViewName.trim();
    if (!name) return;
    saveView(name, status, getQueryString(), propertyFilters);
    setSavedViews(getSavedViews());
    setSaveViewName("");
  }

  function handleLoadView(view: SavedView) {
    setStatus(view.status);
    if (view.q) {
      const parsed = queryToConditions(view.q);
      if (parsed !== null && parsed.length > 0) {
        setConditions(parsed);
        setMode("builder");
      } else {
        setRawQuery(view.q);
        setMode("raw");
      }
    } else {
      setConditions([createCondition()]);
      setRawQuery("");
    }
    onPropertyFiltersChange(view.propertyFilters);
    onSearch({
      status: view.status === "ALL" ? undefined : (view.status as SessionStatus),
      q: view.q,
    });
  }

  function handleDeleteView(id: string) {
    deleteSavedView(id);
    setSavedViews(getSavedViews());
  }

  const pills = getActivePropertyPills(propertyFilters);
  const metadataActive = getQueryString() != null;
  const statusActive = status !== "ALL";
  const totalCount = pills.length + (metadataActive ? 1 : 0) + (statusActive ? 1 : 0);

  return (
    <div className="space-y-2">
      {/* Compact summary bar — always visible */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setExpanded((v) => !v)}
        >
          <Filter className="size-3" />
          Filters
          {totalCount > 0 && (
            <Badge className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">{totalCount}</Badge>
          )}
          <ChevronDown
            className={cn(
              "size-3 opacity-50 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </Button>

        {/* Active status pill */}
        {statusActive && (() => {
          const cfg = getStatusConfig(status);
          return (
            <span
              className={cn(
                badgeVariants({ variant: cfg.badgeVariant }),
                "border flex items-center gap-1",
                cfg.className
              )}
            >
              {cfg.label}
              <button
                type="button"
                className="hover:opacity-70"
                onClick={() => {
                  handleStatusChange("ALL");
                  onSearch({
                    status: undefined,
                    q: getQueryString(),
                  });
                }}
              >
                <X className="size-2.5" />
              </button>
            </span>
          );
        })()}

        {/* Active metadata query pill */}
        {metadataActive && (
          <span className={cn(badgeVariants({ variant: "secondary" }), "flex items-center gap-1 font-mono text-xs")}>
            q:{getQueryString()!.slice(0, 30)}{getQueryString()!.length > 30 ? "…" : ""}
            <button
              type="button"
              className="hover:opacity-70"
              onClick={() => {
                handleConditionsChange([createCondition()]);
                handleRawQueryChange("");
                onSearch({
                  status: status === "ALL" ? undefined : (status as SessionStatus),
                  q: undefined,
                });
              }}
            >
              <X className="size-2.5" />
            </button>
          </span>
        )}

        {/* Active property filter pills */}
        {pills.map((pill) => (
          <span
            key={pill.key}
            className={cn(badgeVariants({ variant: "secondary" }), "flex items-center gap-1")}
          >
            {pill.label}
            <button
              type="button"
              className="hover:opacity-70"
              onClick={() => onPropertyFiltersChange(pill.onRemove(propertyFilters))}
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}

        {totalCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={() => {
              handleStatusChange("ALL");
              handleConditionsChange([createCondition()]);
              handleRawQueryChange("");
              onPropertyFiltersChange(defaultFilters());
              onSearch({});
            }}
          >
            <X className="size-3" />
            Clear all
          </Button>
        )}

        {/* Saved views */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground ml-auto">
                <Bookmark className="size-3" />
                Views
                {savedViews.length > 0 && (
                  <Badge className="h-4 min-w-4 px-1 text-[10px]">{savedViews.length}</Badge>
                )}
              </Button>
            }
          />
          <PopoverContent align="end" className="w-72">
            <div className="space-y-2">
              <p className="text-xs font-medium">Saved views</p>
              {savedViews.length === 0 && (
                <p className="text-xs text-muted-foreground">No saved views yet.</p>
              )}
              {savedViews.map((view) => (
                <div key={view.id} className="flex items-center gap-2 group">
                  <button
                    type="button"
                    className="flex-1 text-left text-xs truncate rounded px-1.5 py-1 hover:bg-muted transition-colors"
                    onClick={() => handleLoadView(view)}
                  >
                    <span className="font-medium">{view.name}</span>
                    {view.status !== "ALL" && (
                      <span className="ml-1 text-muted-foreground">· {view.status}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={() => handleDeleteView(view.id)}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              <div className="border-t pt-2 flex gap-1.5">
                <Input
                  placeholder="View name…"
                  value={saveViewName}
                  onChange={(e) => setSaveViewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveView()}
                  className="h-7 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  onClick={handleSaveView}
                  disabled={!saveViewName.trim()}
                >
                  <BookmarkCheck className="size-3" />
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Expandable filter panel */}
      {expanded && (
        <div className="rounded-lg border bg-card p-3 space-y-3">
          {/* Status chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = status === opt.value;
                const cfg = opt.value !== "ALL" ? getStatusConfig(opt.value) : null;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusChange(opt.value)}
                    className={cn(
                      badgeVariants({ variant: isActive ? (cfg?.badgeVariant ?? "default") : "outline" }),
                      "cursor-pointer select-none",
                      isActive && cfg && cn("border", cfg.className),
                      isActive && "ring-2 ring-ring ring-offset-1 ring-offset-background"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Property filters */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Property Filters</label>
            <SessionPropertyFilters
              filters={propertyFilters}
              onChange={onPropertyFiltersChange}
            />
          </div>

          {/* Metadata query */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Metadata Query</label>
            <Tabs value={mode} onValueChange={handleModeChange}>
              <TabsList>
                <TabsTrigger value="builder">
                  <LayoutGrid className="size-3.5" />
                  Builder
                </TabsTrigger>
                <TabsTrigger value="raw">
                  <Code className="size-3.5" />
                  Raw Query
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder">
                <MetadataQueryBuilder
                  conditions={conditions}
                  onChange={handleConditionsChange}
                  onSearch={handleSearch}
                  keyPaths={keyPaths}
                  valuesForKey={valuesForKey}
                />
              </TabsContent>

              <TabsContent value="raw">
                <div className="space-y-1.5">
                  <Input
                    id="raw-query"
                    placeholder="user_metadata['key']:'value'"
                    value={rawQuery}
                    onChange={(e) => handleRawQueryChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example:{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      user_metadata['order']['status']:'shipped'
                    </code>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
