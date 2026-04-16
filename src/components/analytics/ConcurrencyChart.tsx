import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ConcurrencyDataPoint, ConcurrencySummary } from "@/lib/analytics";

interface ConcurrencyChartProps {
  data: ConcurrencyDataPoint[];
  summary: ConcurrencySummary;
}

function formatPeakTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTickLabel(epochMs: number, data: ConcurrencyDataPoint[]): string {
  if (data.length < 2) return "";
  const totalRange = data[data.length - 1].time - data[0].time;
  const d = new Date(epochMs);

  if (totalRange < 24 * 3600_000) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (totalRange < 7 * 24 * 3600_000) {
    return (
      d.toLocaleDateString("en-US", { weekday: "short" }) +
      " " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    );
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConcurrencyChart({ data, summary }: ConcurrencyChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Concurrent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between gap-4">
          <CardTitle>Concurrent Sessions</CardTitle>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              Peak: <strong className="text-foreground">{summary.peakConcurrency}</strong>
              {summary.peakTime && (
                <span className="ml-1">({formatPeakTime(summary.peakTime)})</span>
              )}
            </span>
            <span>
              Avg: <strong className="text-foreground">{summary.avgConcurrency.toFixed(1)}</strong>
            </span>
            <span>{summary.granularity} peaks</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(val) => formatTickLabel(val, data)}
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={(val) => {
                const d = new Date(val as number);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
              }}
              formatter={(value) => [
                `${value} session${Number(value) !== 1 ? "s" : ""}`,
                "Concurrent",
              ]}
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--popover-foreground)",
                fontSize: "0.75rem",
              }}
            />
            <Line
              type="monotone"
              dataKey="peak"
              stroke="var(--chart-status-running)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              name="Concurrent"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
