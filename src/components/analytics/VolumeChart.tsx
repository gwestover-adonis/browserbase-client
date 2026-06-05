import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { VolumeDataPoint } from "@/lib/analytics";
import { STATUS_COLORS } from "./chart-colors";

interface VolumeChartProps {
  data: VolumeDataPoint[];
}

function formatDateLabel(date: string): string {
  // "2024-01-15" → "Jan 15", "2024-W03" → "W03"
  if (date.includes("W")) return date.split("-").slice(1).join("-");
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Volume</CardTitle>
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
        <CardTitle>Session Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
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
              labelFormatter={(label) => formatDateLabel(String(label))}
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--popover-foreground)",
                fontSize: "0.75rem",
              }}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: "0.75rem" }}
            />
            <Bar dataKey="COMPLETED" stackId="a" fill={STATUS_COLORS.COMPLETED} name="Completed" />
            <Bar dataKey="RUNNING" stackId="a" fill={STATUS_COLORS.RUNNING} name="Running" />
            <Bar dataKey="TIMED_OUT" stackId="a" fill={STATUS_COLORS.TIMED_OUT} name="Timed Out" />
            <Bar dataKey="ERROR" stackId="a" fill={STATUS_COLORS.ERROR} name="Error" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
