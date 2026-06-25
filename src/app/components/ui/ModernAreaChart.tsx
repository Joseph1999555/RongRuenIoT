"use client";

import React, { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDatum = {
  dateTimeLabel?: string;
  isStale?: boolean;
  [key: string]: boolean | number | string | null | undefined;
};

interface ModernAreaChartProps {
  data: unknown[];
  dataKey: string;
  color: string;
  height?: number;
  hideXAxis?: boolean;
  isDark?: boolean;
}

export default function ModernAreaChart({
  data,
  dataKey,
  color,
  height = 150,
  hideXAxis = false,
  isDark = true,
}: ModernAreaChartProps) {
  const rows = data as ChartDatum[];
  const chartId = useId();
  const gradientId = useMemo(
    () => `chart_${chartId.replaceAll(":", "_")}_${dataKey.replace(/\W/g, "_")}`,
    [chartId, dataKey],
  );

  const hasUnavailableData = rows.some(
    (item) => item?.isStale && item?.[dataKey] == null,
  );
  const hasAvailableData = rows.some((item) => {
    const value = item?.[dataKey];
    return typeof value === "number" && Number.isFinite(value);
  });
  const showUnavailableState = hasUnavailableData && !hasAvailableData;
  const chartData = showUnavailableState
    ? rows.map((item) => ({ ...item, [dataKey]: 0, dateTimeLabel: "" }))
    : rows;

  return (
    <div className="relative" style={{ width: "100%", height, minHeight: height }}>
      {showUnavailableState && (
        <div className="absolute right-2 top-1 z-10 text-[10px] font-medium text-[var(--muted)]">
          Sensor unavailable
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {!hideXAxis && !showUnavailableState && (
            <XAxis
              dataKey="dateTimeLabel"
              tick={{
                fill: isDark
                  ? "rgba(237, 246, 239, 0.56)"
                  : "rgba(23, 32, 22, 0.52)",
                fontSize: 10,
              }}
              tickLine={false}
              axisLine={false}
              minTickGap={15}
              interval="preserveStartEnd"
            />
          )}

          <YAxis
            hide
            domain={[
              (dataMin: number) => (Number.isFinite(dataMin) ? dataMin - 2 : 0),
              (dataMax: number) => (Number.isFinite(dataMax) ? dataMax + 2 : 1),
            ]}
          />

          <Tooltip
            formatter={(value) =>
              showUnavailableState || value === null || value === undefined
                ? "Unavailable"
                : String(value)
            }
            contentStyle={
              showUnavailableState
                ? { display: "none" }
                : {
                    backgroundColor: isDark
                      ? "rgba(17, 26, 32, 0.95)"
                      : "rgba(255, 255, 255, 0.95)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                    color: isDark ? "#edf6ef" : "#172016",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }
            }
            itemStyle={{ color: isDark ? "#edf6ef" : "#172016" }}
          />

          <Area
            type={showUnavailableState ? "linear" : "monotone"}
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fillOpacity={showUnavailableState ? 0 : 1}
            fill={`url(#${gradientId})`}
            activeDot={
              showUnavailableState
                ? false
                : {
                    r: 5,
                    fill: color,
                    stroke: isDark ? "#edf6ef" : "#172016",
                    strokeWidth: 2,
                  }
            }
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export const GlassCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--foreground)] shadow-sm ${className}`}
  >
    {children}
  </div>
);
