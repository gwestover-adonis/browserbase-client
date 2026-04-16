import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { StatusCount } from "@/lib/analytics";
import { STATUS_COLORS } from "./chart-colors";

interface StatusChartProps {
  data: StatusCount[];
}

export function StatusChart({ data }: StatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No data
          </div>
        </CardContent>
      </Card>
    );
  }

  const withValues = data.filter((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width="50%" height={220}>
            <PieChart>
              <Pie
                data={withValues}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
              >
                {withValues.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--popover-foreground)",
                  fontSize: "0.75rem",
                }}
                formatter={(value: number, name: string) => [
                  `${value} (${((value / total) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
              {/* Center label */}
              <text
                x="50%"
                y="48%"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-foreground text-2xl font-semibold"
              >
                {total}
              </text>
              <text
                x="50%"
                y="60%"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-muted-foreground text-xs"
              >
                total
              </text>
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-2">
            {data.map((d) => (
              <div key={d.status} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[d.status] }}
                />
                <span className="text-muted-foreground">{d.status}</span>
                <span className="font-medium">{d.count}</span>
                <span className="text-xs text-muted-foreground">
                  ({d.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
