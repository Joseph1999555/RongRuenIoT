"use client";

import React from "react";
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

export interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
}

interface CustomLineChartProps {
  data: any[];
  xAxisKey: string;
  lines: LineConfig[];
  height?: number | string;
  formatXAxis?: (value: any) => string;
  formatTooltipLabel?: (label: any) => string;
}

export default function CustomLineChart({
  data,
  xAxisKey,
  lines,
  height = 300, // 🌟 ลด Default Height ลงมาให้เหมาะกับมือถือมากขึ้น (ในคอมก็ยังสวย)
  formatXAxis = (val) => val,
  formatTooltipLabel = (val) => val,
}: CustomLineChartProps) {
  
  if (!data || data.length === 0) return <div className="text-gray-500 text-sm">ไม่มีข้อมูลสำหรับแสดงกราฟ</div>;

  return (
    // 🌟 ใช้สไตล์ที่อนุญาตให้ Container ยืดหยุ่นตาม Parent (บีบลงมาได้ดีในจอมือถือ)
    <div style={{ width: "100%", height: height, minHeight: 250 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        {/* 🌟 ปรับ margin ฝั่ง left ให้เป็น 0 (หรือเอาค่าติดลบออก) เพื่อไม่ให้ตัวเลขแกน Y ตกขอบจอมือถือ */}
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatXAxis}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            tickMargin={10}       // 🌟 ขยับข้อความแกน X ลงมานิดนึงให้ไม่เบียดเส้น
            minTickGap={30}       // 🌟 พระเอกกู้ชีพมือถือ! บังคับให้ป้ายแกน X เว้นระยะห่างกันอย่างน้อย 30px (ถ้าเบียดกัน มันจะซ่อนบางป้ายให้อัตโนมัติ)
          />
          
          <YAxis 
            tick={{ fill: "#6b7280", fontSize: 12 }} 
            tickLine={false} 
            axisLine={false}
            tickMargin={10}       // 🌟 ขยับข้อความแกน Y ออกมาไม่ให้ติดเส้นเกินไป
            width={40}            // 🌟 ล็อกความกว้างแกน Y ไว้เล็กน้อย ป้องกันกราฟกระตุกเวลาตัวเลขเปลี่ยนจาก 2 หลักเป็น 3 หลัก
          />
          
          <Tooltip
            labelFormatter={formatTooltipLabel}
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "14px"
            }}
          />
          
          {/* 🌟 ดัน Legend ลงมาข้างล่างนิดนึง จะได้ไม่กวนเส้นกราฟ */}
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