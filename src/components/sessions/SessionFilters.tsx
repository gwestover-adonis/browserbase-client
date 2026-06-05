import { useCallback, useImperativeHandle, useState, type Ref } from "react";
import { Code, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { badgeVariants } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All Statuses" },
  { value: "RUNNING", label: "Running" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ERROR", label: "Error" },
  { value: "TIMED_OUT", label: "Timed Out" },
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  RUNNING: "default",
  COMPLETED: "secondary",
  ERROR: "destructive",
  TIMED_OUT: "outline",
};

export interface SessionFiltersHandle {
  search: () => void;
}

interface SessionFiltersProps {
  ref?: Ref<SessionFiltersHandle>;
  onSearch: (params: { status?: SessionStatus; q?: string }) => void;
  propertyFilters: PropertyFilters;
  onPropertyFiltersChange: (filters: PropertyFilters) => void;
  keyPaths: string[];
  valuesForKey: (keyPath: string) => string[];
}

type QueryMode = "builder" | "raw";

export function SessionFilters({
  ref,
  onSearch,
  propertyFilters,
  onPropertyFiltersChange,
  keyPaths,
  valuesForKey,
}: SessionFiltersProps) {
  const [status, setStatus] = useState("ALL");
  const [mode, setMode] = useState<QueryMode>("builder");
  const [conditions, setConditions] = useState<MetadataCondition[]>([
    createCondition(),
  ]);
  const [rawQuery, setRawQuery] = useState("");

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

  return (
    <div className="space-y-3">
      <Tabs value={mode} onValueChange={handleModeChange}>
        <div className="flex items-center justify-between">
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
        </div>

        <TabsContent value="builder">
          <MetadataQueryBuilder
            conditions={conditions}
            onChange={setConditions}
            onSearch={handleSearch}
            keyPaths={keyPaths}
            valuesForKey={valuesForKey}
          />
        </TabsContent>

        <TabsContent value="raw">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="raw-query">
              Metadata Query
            </label>
            <Input
              id="raw-query"
              placeholder="user_metadata['key']:'value'"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Browserbase query syntax. Example:{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                user_metadata['order']['status']:'shipped'
              </code>
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <SessionPropertyFilters
        filters={propertyFilters}
        onChange={onPropertyFiltersChange}
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Status</label>
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = status === opt.value;
              const variant = isActive
                ? (STATUS_VARIANT[opt.value] ?? "default")
                : "outline";
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    badgeVariants({ variant }),
                    "cursor-pointer select-none",
                    isActive && "ring-2 ring-ring ring-offset-1 ring-offset-background"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
