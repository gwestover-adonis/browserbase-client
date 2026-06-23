import { useRef } from "react";
import {
  BarChart,
  Bar,
  Brush,
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
import { formatDateLabel } from "@/lib/format";

interface BrushRange {
  startDate: string;
  endDate: string;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  onBrush?: (range: BrushRange | null) => void;
}

export function VolumeChart({ data, onBrush }: VolumeChartProps) {
  // Track whether the user has interacted with the brush so we don't fire
  // onBrush on the initial render (Recharts calls onChange immediately at
  // full extent, which would wipe the default 7-day filter).
  const brushTouched = useRef(false);

  function handleBrushChange(brushData: { startIndex?: number; endIndex?: number }) {
    if (!onBrush) return;
    const { startIndex, endIndex } = brushData;
    if (startIndex == null || endIndex == null) return;

    if (!brushTouched.current) {
      brushTouched.current = true;
      // If the first interaction lands at full extent, it's still the
      // Recharts initialization — ignore it.
      if (startIndex === 0 && endIndex === data.length - 1) return;
    }

    if (startIndex === 0 && endIndex === data.length - 1) {
      onBrush(null);
      return;
    }
    onBrush({ startDate: data[startIndex].date, endDate: data[endIndex].date });
  }
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
        <ResponsiveContainer width="100%" height={onBrush ? 290 : 260}>
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
            {onBrush && (
              <Brush
                dataKey="date"
                height={20}
                tickFormatter={formatDateLabel}
                onChange={handleBrushChange}
                fill="var(--muted)"
                stroke="var(--border)"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
