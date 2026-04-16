import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { FrequencyAnalysis, SpectrumPoint } from "@/lib/fft";
import { formatPeriod } from "@/lib/fft";

interface FrequencyChartProps {
  analysis: FrequencyAnalysis | null;
}

const LOG_TICKS = [5, 15, 30, 60, 180, 360, 720, 1440, 4320, 10080];

const CHART_HEIGHT = 260;
const CHART_TOP_MARGIN = 5;
const CHART_BOTTOM_MARGIN = 25;

function makeSpectrumBar(color: string, width: number, dotRadius: number) {
  return function SpectrumBar(props: Record<string, unknown>) {
    const { cx, cy } = props as { cx: number; cy: number };
    if (cx == null || cy == null) return null;
    const baseline = CHART_HEIGHT - CHART_BOTTOM_MARGIN;
    const top = Math.max(cy, CHART_TOP_MARGIN);
    return (
      <>
        <line x1={cx} y1={baseline} x2={cx} y2={top} stroke={color} strokeWidth={width} opacity={0.8} />
        <circle cx={cx} cy={top} r={dotRadius} fill={color} />
      </>
    );
  };
}

const NormalBar = makeSpectrumBar("var(--chart-status-running)", 1.5, 2);
const PeakBar = makeSpectrumBar("var(--chart-frequency-peak)", 2.5, 3.5);

export function FrequencyChart({ analysis }: FrequencyChartProps) {
  const { normalData, peakData } = useMemo(() => {
    if (!analysis) return { normalData: [], peakData: [] };
    const normal: SpectrumPoint[] = [];
    const peaks: SpectrumPoint[] = [];
    for (const p of analysis.spectrum) {
      if (p.isPeak) peaks.push(p);
      else normal.push(p);
    }
    return { normalData: normal, peakData: peaks };
  }, [analysis]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frequency Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Not enough data for frequency analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysis.spectrum.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frequency Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No periodic patterns detected
          </div>
        </CardContent>
      </Card>
    );
  }

  const top3 = analysis.dominantPeriods.slice(0, 3);
  const minPeriod = analysis.spectrum[analysis.spectrum.length - 1]?.periodMinutes ?? 5;
  const maxPeriod = analysis.spectrum[0]?.periodMinutes ?? 10080;
  const ticks = LOG_TICKS.filter((t) => t >= minPeriod * 0.8 && t <= maxPeriod * 1.2);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between gap-4">
          <CardTitle>Frequency Analysis</CardTitle>
          {top3.length > 0 && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              {top3.map((p) => (
                <span key={p.rank}>
                  #{p.rank}:{" "}
                  <strong className="text-[var(--chart-frequency-peak)]">{p.periodLabel}</strong>
                  <span className="ml-1">({(p.power * 100).toFixed(0)}%)</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="periodMinutes"
              type="number"
              scale="log"
              domain={[minPeriod * 0.8, maxPeriod * 1.2]}
              ticks={ticks}
              tickFormatter={formatPeriod}
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
              reversed
            />
            <YAxis
              dataKey="power"
              type="number"
              domain={[0, 1]}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload as SpectrumPoint;
                return (
                  <div
                    style={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      color: "var(--popover-foreground)",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: d.isPeak ? "var(--chart-frequency-peak)" : undefined }}>
                      {formatPeriod(d.periodMinutes)}
                    </div>
                    <div>Relative Power: {(d.power * 100).toFixed(1)}%</div>
                  </div>
                );
              }}
            />
            <Scatter data={normalData} fill="var(--chart-status-running)" shape={<NormalBar />} />
            <Scatter data={peakData} fill="var(--chart-frequency-peak)" shape={<PeakBar />} />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
