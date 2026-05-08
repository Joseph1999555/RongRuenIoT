"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ModernAreaChartProps {
  data: any[];
  dataKey: string;
  color: string;
  height?: number;
  hideXAxis?: boolean;
  isDark?: boolean; // 🌟 เพิ่ม Props สำหรับเช็ค Theme
}

export default function ModernAreaChart({ 
  data, 
  dataKey, 
  color, 
  height = 150, 
  hideXAxis = false,
  isDark = true // 🌟 รับค่า Default เป็น Dark
}: ModernAreaChartProps) {
  const gradientId = `glow_${dataKey}_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ width: "100%", height, minHeight: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {!hideXAxis && (
            <XAxis 
              dataKey="timeOnly" 
              // 🌟 เปลี่ยนสีตัวเลขแกน X ตาม Theme
              tick={{ fill: isDark ? "rgba(255,255,255,0.4)" : "rgba(15, 23, 42, 0.4)", fontSize: 10 }} 
              tickLine={false} 
              axisLine={false}
              minTickGap={15}
            />
          )}
          
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          
          <Tooltip 
            // 🌟 เปลี่ยนสีกล่อง Tooltip เวลาเอาเมาส์ชี้ตาม Theme
            contentStyle={{ 
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)", 
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", 
              borderRadius: "8px", 
              color: isDark ? "#fff" : "#0f172a",
              fontSize: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            }}
            itemStyle={{ color: isDark ? "#fff" : "#0f172a" }}
          />
          
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
            activeDot={{ r: 5, fill: color, stroke: isDark ? "#fff" : "#0f172a", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`
    backdrop-blur-md border rounded-2xl p-5 shadow-xl transition-colors duration-500
    bg-white/70 border-slate-200/60 shadow-slate-200/50 text-slate-800
    dark:bg-white/5 dark:border-white/10 dark:shadow-black/50 dark:text-white
    ${className}
  `}>
    {children}
  </div>
);