import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Tags } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Session } from "@/lib/types";
import { useMetadataSchema } from "@/lib/metadata-schema";
import { computeMetadataGroups, type MetadataGroup } from "@/lib/analytics";
import { formatBytes } from "@/lib/format";
import { getGroupColor, SPECIAL_GROUP_COLOR } from "./chart-colors";

interface MetadataGroupingProps {
  sessions: Session[];
}

function colorForGroup(group: MetadataGroup, index: number): string {
  return group.isSpecial ? SPECIAL_GROUP_COLOR : getGroupColor(index);
}

function formatDurationSec(sec: number | null): string {
  if (sec === null) return "-";
  if (sec < 1) return `${Math.round(sec * 1000)}ms`;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = sec / 60;
  if (min < 60) return `${min.toFixed(1)}m`;
  return `${(min / 60).toFixed(1)}h`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

const TOP_N_OPTIONS = [5, 10, 20, 50] as const;

export function MetadataGrouping({ sessions }: MetadataGroupingProps) {
  const { keyPaths } = useMetadataSchema(sessions);
  const [selectedKeyPath, setSelectedKeyPath] = useState<string | null>(null);
  const [topN, setTopN] = useState(10);

  const groups = useMemo(() => {
    if (!selectedKeyPath) return [];
    return computeMetadataGroups(sessions, selectedKeyPath, topN);
  }, [sessions, selectedKeyPath, topN]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata Grouping</CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            <Combobox
              items={keyPaths}
              value={selectedKeyPath}
              onValueChange={(val) => setSelectedKeyPath(val ?? null)}
            >
              <ComboboxInput
                placeholder="Select metadata key..."
                className="w-56 font-mono text-sm"
                showTrigger={keyPaths.length > 0}
              />
              {keyPaths.length > 0 && (
                <ComboboxContent>
                  <ComboboxEmpty>No matching keys.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem
                        key={item}
                        value={item}
                        className="font-mono text-sm"
                      >
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              )}
            </Combobox>

            <Select
              value={String(topN)}
              onValueChange={(val) => val && setTopN(Number(val))}
            >
              <SelectTrigger className="w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOP_N_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Top {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {!selectedKeyPath ? (
          <EmptyState keyPathsAvailable={keyPaths.length > 0} />
        ) : groups.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No sessions have a value for "{selectedKeyPath}"
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
            <GroupBarChart groups={groups} />
            <GroupTable groups={groups} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ keyPathsAvailable }: { keyPathsAvailable: boolean }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
      <Tags className="size-8 opacity-40" />
      <p className="text-sm">
        {keyPathsAvailable
          ? "Select a metadata key to see sessions grouped by value"
          : "No metadata keys found in the current sessions"}
      </p>
    </div>
  );
}

function GroupBarChart({ groups }: { groups: MetadataGroup[] }) {
  // For horizontal bar chart, we want items from top to bottom in count order,
  // but Recharts renders bottom-to-top, so reverse the data
  const chartData = [...groups].reverse();

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, groups.length * 36)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          className="text-xs fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="value"
          width={120}
          className="text-xs fill-muted-foreground"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => truncate(v, 18)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            borderColor: "var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--popover-foreground)",
            fontSize: "0.75rem",
          }}
          formatter={(value) => [
            `${value} session${Number(value) !== 1 ? "s" : ""}`,
            "Count",
          ]}
        />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} name="Sessions">
          {chartData.map((entry, i) => {
            // Compute the original (non-reversed) index for color assignment
            const originalIndex = groups.length - 1 - i;
            return (
              <Cell
                key={entry.value}
                fill={colorForGroup(entry, originalIndex)}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function GroupTable({ groups }: { groups: MetadataGroup[] }) {
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Value</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead className="text-right">Avg Duration</TableHead>
            <TableHead className="text-right">Error Rate</TableHead>
            <TableHead className="text-right">Avg Proxy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((g, i) => (
            <TableRow key={g.value}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorForGroup(g, i) }}
                  />
                  <span
                    className="max-w-[200px] truncate font-mono text-xs"
                    title={g.value}
                  >
                    {g.value}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{g.count}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDurationSec(g.avgDurationSec)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(g.errorRate * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBytes(g.avgProxyBytes)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
