"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ModernAreaChartProps {
  data: any[];
  dataKey: string;
  color: string;
  height?: number;
  hideXAxis?: boolean;
}

export default function ModernAreaChart({ data, dataKey, color, height = 150, hideXAxis = false }: ModernAreaChartProps) {
  // สร้าง ID ไม่ซ้ำกันสำหรับ Gradient 
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
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} 
              tickLine={false} 
              axisLine={false}
              minTickGap={30}
            />
          )}
          
          {/* ซ่อนแกน Y เพื่อความมินิมอล แต่เปิด Tooltip ไว้ดูค่า */}
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "rgba(15, 23, 42, 0.9)", 
              border: "1px solid rgba(255,255,255,0.1)", 
              borderRadius: "8px", 
              color: "#fff",
              fontSize: "12px"
            }}
            itemStyle={{ color: "#fff" }}
          />
          
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
            activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 🌟 Component กล่องกระจก (Glassmorphism) สำหรับครอบเนื้อหา
export const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl ${className}`}>
    {children}
  </div>
);