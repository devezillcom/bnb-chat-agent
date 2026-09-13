"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

export type ChartSeries = {
  key: string;
  label: string;
  color?: string;
};

export type ChartData = Record<string, string | number>;

export type ChartSpec = {
  type: "bar" | "line" | "area";
  title?: string;
  xKey: string;
  series: ChartSeries[];
  data: ChartData[];
};

const DEFAULT_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function getColor(series: ChartSeries, index: number): string {
  return series.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? "#6366f1";
}

type ChartRendererProps = {
  spec: ChartSpec;
  className?: string;
};

export function ChartRenderer({ spec, className }: ChartRendererProps) {
  const { type, title, xKey, series, data } = spec;

  return (
    <div className={cn("my-3 rounded-lg border border-border bg-card p-4", className)}>
      {title ? (
        <p className="mb-3 text-sm font-medium text-foreground">{title}</p>
      ) : null}
      <ResponsiveContainer width="100%" height={260}>
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            {series.length > 1 ? <Legend wrapperStyle={{ fontSize: "12px" }} /> : null}
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={getColor(s, i)}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        ) : type === "area" ? (
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient
                  key={`grad-${s.key}`}
                  id={`grad-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={getColor(s, i)} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={getColor(s, i)} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            {series.length > 1 ? <Legend wrapperStyle={{ fontSize: "12px" }} /> : null}
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={getColor(s, i)}
                fill={`url(#grad-${s.key})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            {series.length > 1 ? <Legend wrapperStyle={{ fontSize: "12px" }} /> : null}
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={getColor(s, i)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Parse raw text from a ```chart code block into a ChartSpec.
 * Returns null if the text is not valid chart JSON.
 */
export function parseChartSpec(raw: string): ChartSpec | null {
  try {
    const parsed = JSON.parse(raw.trim()) as unknown;
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const obj = parsed as Record<string, unknown>;

    if (
      (obj.type !== "bar" && obj.type !== "line" && obj.type !== "area") ||
      typeof obj.xKey !== "string" ||
      !Array.isArray(obj.series) ||
      !Array.isArray(obj.data)
    ) {
      return null;
    }

    return obj as unknown as ChartSpec;
  } catch {
    return null;
  }
}
