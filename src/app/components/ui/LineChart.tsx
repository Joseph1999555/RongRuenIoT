"use client";

import React, { type ReactNode } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";

export interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
}

type ChartDatum = Record<string, string | number | null | undefined>;
type ChartLabel = string | number;

interface CustomLineChartProps {
  data: ChartDatum[];
  xAxisKey: string;
  lines: LineConfig[];
  height?: number | string;
  formatXAxis?: (value: ChartLabel) => string;
  formatTooltipLabel?: (
    label: ReactNode,
    payload: readonly Payload<ValueType, NameType>[]
  ) => ReactNode;
}

export default function CustomLineChart({
  data,
  xAxisKey,
  lines,
  height = 300,
  formatXAxis = (val) => String(val),
  formatTooltipLabel = (label) => String(label ?? ""),
}: CustomLineChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-sm">ไม่มีข้อมูลสำหรับแสดงกราฟ</div>;
  }

  return (
    <div style={{ width: "100%", height: height, minHeight: 250 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatXAxis}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            tickMargin={10}
            minTickGap={30}
          />

          <YAxis
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            width={40}
          />

          <Tooltip
            labelFormatter={formatTooltipLabel}
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "14px",
            }}
          />

          <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "14px" }} />

          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name={line.name}
              connectNulls
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}