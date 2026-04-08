import { useState } from "react";
import {
  Calendar,
  Clock,
  Globe,
  ArrowDownUp,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertyFilters } from "@/lib/property-filters";
import {
  KNOWN_REGIONS,
  EMPTY_FILTERS,
  isFiltersActive,
} from "@/lib/property-filters";

interface SessionPropertyFiltersProps {
  filters: PropertyFilters;
  onChange: (filters: PropertyFilters) => void;
}

type ByteUnit = "B" | "KB" | "MB" | "GB";

const BYTE_MULTIPLIERS: Record<ByteUnit, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
};

function bytesToDisplay(
  bytes: number | undefined,
  unit: ByteUnit,
): string {
  if (bytes == null) return "";
  return String(Math.round(bytes / BYTE_MULTIPLIERS[unit]));
}

function displayToBytes(
  display: string,
  unit: ByteUnit,
): number | undefined {
  const num = parseFloat(display);
  if (isNaN(num) || display.trim() === "") return undefined;
  return num * BYTE_MULTIPLIERS[unit];
}

function FilterButton({
  icon: Icon,
  label,
  active,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant={active ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5"
          >
            <Icon className="size-3.5" />
            {label}
            {active && (
              <Badge variant="default" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">
                1
              </Badge>
            )}
            <ChevronDown className="size-3 opacity-50" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-72">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function SessionPropertyFilters({
  filters,
  onChange,
}: SessionPropertyFiltersProps) {
  const [proxyUnit, setProxyUnit] = useState<ByteUnit>("KB");

  function patch(partial: Partial<PropertyFilters>) {
    onChange({ ...filters, ...partial });
  }

  function clearAll() {
    onChange(EMPTY_FILTERS);
  }

  const hasCreated =
    filters.createdAfter != null || filters.createdBefore != null;
  const hasDuration =
    filters.durationMin != null || filters.durationMax != null;
  const hasRegion =
    filters.regions != null &&
    filters.regions.length > 0 &&
    filters.regions.length < KNOWN_REGIONS.length;
  const hasProxy =
    filters.proxyBytesMin != null || filters.proxyBytesMax != null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Created date range */}
      <FilterButton icon={Calendar} label="Created" active={hasCreated}>
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Filter by creation date
          </p>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="created-after" className="text-xs">
                From
              </Label>
              <Input
                id="created-after"
                type="date"
                value={filters.createdAfter ?? ""}
                onChange={(e) =>
                  patch({
                    createdAfter: e.target.value || undefined,
                  })
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="created-before" className="text-xs">
                To
              </Label>
              <Input
                id="created-before"
                type="date"
                value={filters.createdBefore ?? ""}
                onChange={(e) =>
                  patch({
                    createdBefore: e.target.value || undefined,
                  })
                }
                className="text-sm"
              />
            </div>
          </div>
          {hasCreated && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                patch({
                  createdAfter: undefined,
                  createdBefore: undefined,
                })
              }
              className="text-xs text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </FilterButton>

      {/* Duration range */}
      <FilterButton icon={Clock} label="Duration" active={hasDuration}>
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Filter by duration (seconds)
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="duration-min" className="text-xs">
                Min
              </Label>
              <Input
                id="duration-min"
                type="number"
                min={0}
                placeholder="0"
                value={filters.durationMin ?? ""}
                onChange={(e) =>
                  patch({
                    durationMin:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
                className="text-sm"
              />
            </div>
            <span className="pb-1.5 text-xs text-muted-foreground">to</span>
            <div className="flex-1 space-y-1">
              <Label htmlFor="duration-max" className="text-xs">
                Max
              </Label>
              <Input
                id="duration-max"
                type="number"
                min={0}
                placeholder="∞"
                value={filters.durationMax ?? ""}
                onChange={(e) =>
                  patch({
                    durationMax:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
                className="text-sm"
              />
            </div>
          </div>
          {hasDuration && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                patch({ durationMin: undefined, durationMax: undefined })
              }
              className="text-xs text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </FilterButton>

      {/* Region multi-select */}
      <FilterButton icon={Globe} label="Region" active={hasRegion}>
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Filter by region
          </p>
          <div className="space-y-2">
            {KNOWN_REGIONS.map((region) => {
              const checked = filters.regions?.includes(region) ?? false;
              return (
                <label
                  key={region}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => {
                      const current = filters.regions ?? [...KNOWN_REGIONS];
                      const next = checked
                        ? current.filter((r) => r !== region)
                        : [...current, region];
                      patch({ regions: next });
                    }}
                  />
                  <span className="font-mono text-xs">{region}</span>
                </label>
              );
            })}
          </div>
          {hasRegion && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => patch({ regions: [...KNOWN_REGIONS] })}
              className="text-xs text-muted-foreground"
            >
              Select all
            </Button>
          )}
        </div>
      </FilterButton>

      {/* Proxy bytes range */}
      <FilterButton icon={ArrowDownUp} label="Proxy" active={hasProxy}>
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Filter by proxy bytes
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="proxy-min" className="text-xs">
                Min
              </Label>
              <Input
                id="proxy-min"
                type="number"
                min={0}
                placeholder="0"
                value={bytesToDisplay(filters.proxyBytesMin, proxyUnit)}
                onChange={(e) =>
                  patch({
                    proxyBytesMin: displayToBytes(e.target.value, proxyUnit),
                  })
                }
                className="text-sm"
              />
            </div>
            <span className="pb-1.5 text-xs text-muted-foreground">to</span>
            <div className="flex-1 space-y-1">
              <Label htmlFor="proxy-max" className="text-xs">
                Max
              </Label>
              <Input
                id="proxy-max"
                type="number"
                min={0}
                placeholder="∞"
                value={bytesToDisplay(filters.proxyBytesMax, proxyUnit)}
                onChange={(e) =>
                  patch({
                    proxyBytesMax: displayToBytes(e.target.value, proxyUnit),
                  })
                }
                className="text-sm"
              />
            </div>
            <div className="w-20">
              <Select
                value={proxyUnit}
                onValueChange={(val) => {
                  if (val !== null) setProxyUnit(val as ByteUnit);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="KB">KB</SelectItem>
                  <SelectItem value="MB">MB</SelectItem>
                  <SelectItem value="GB">GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasProxy && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                patch({
                  proxyBytesMin: undefined,
                  proxyBytesMax: undefined,
                })
              }
              className="text-xs text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </FilterButton>

      {isFiltersActive(filters) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="gap-1 text-muted-foreground"
        >
          <X className="size-3.5" />
          Clear all
        </Button>
      )}
    </div>
  );
}
