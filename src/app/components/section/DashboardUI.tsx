"use client";

import React, { useMemo } from "react";
import CustomLineChart, { LineConfig } from "../ui/LineChart";

interface SensorApiResponse {
  "Time Stamp": string;
  System?: string;
  SensorId: number;
  Type?: string;
  PH?: number;
  Temperature?: number;
  Humidity?: number;
}

export default function DashboardUI({ data }: { data: SensorApiResponse[] }) {
  
  console.log("Raw API Data:", data);
  
  const { sensorsData, latestAir } = useMemo(() => {
    if (!data || data.length === 0) {
      return { sensorsData: [], latestAir: { temp: "-", humidity: "-" } };
    }

    //  เปลี่ยน Key จาก number เป็น string เพื่อรองรับ "A11", "B11"
    const sensorGroups: Record<string, { displayId: string; type: string; dataMap: Record<string, any> }> = {};
    let lastAirTemp = "-";
    let lastAirHum = "-";

    data.forEach((item) => {
      const sid = item.SensorId;
      const sys = item.System || "?";
      const displayId = `${sys}${sid}`; 
      
      const sType = item.Type || (sid === 15 ? "AIR" : sid >= 13 ? "PH" : "TH");

      if (sType === "AIR") {
        if (item.Temperature !== undefined) lastAirTemp = `${item.Temperature}`;
        if (item.Humidity !== undefined) lastAirHum = `${item.Humidity}`;
      }

      //  ใช้ displayId ในการแยกกล่องเซนเซอร์
      if (!sensorGroups[displayId]) {
        sensorGroups[displayId] = { displayId: displayId, type: sType, dataMap: {} };
      }

      const date = new Date(item["Time Stamp"]);
      const dateString = date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" });
      const timeString = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      const dateTimeKey = `${dateString} ${timeString}`;

      if (!sensorGroups[displayId].dataMap[dateTimeKey]) {
        sensorGroups[displayId].dataMap[dateTimeKey] = {
          fullTime: dateTimeKey,
          timestamp: date.getTime(),
        };
      }

      if (item.Temperature !== undefined) sensorGroups[displayId].dataMap[dateTimeKey].Temperature = item.Temperature;
      if (item.Humidity !== undefined) sensorGroups[displayId].dataMap[dateTimeKey].Humidity = item.Humidity;
      if (item.PH !== undefined) sensorGroups[displayId].dataMap[dateTimeKey].PH = item.PH;
    });

    const processedSensors = Object.values(sensorGroups).map((sensor) => {
      const sortedData = Object.values(sensor.dataMap).sort((a: any, b: any) => a.timestamp - b.timestamp);
      return {
        displayId: sensor.displayId, //  ส่ง displayId ออกไปให้ UI วาด
        type: sensor.type,
        chartData: sortedData,
      };
    });

    //  เรียงลำดับตัวอักษร เช่น A11 -> A12 -> B11
    processedSensors.sort((a, b) => a.displayId.localeCompare(b.displayId));

    return { 
      sensorsData: processedSensors, 
      latestAir: { temp: lastAirTemp, humidity: lastAirHum } 
    };
  }, [data]);

  if (!data || data.length === 0) return <div className="p-4 md:p-6 text-gray-500 font-medium">กำลังรอข้อมูล...</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 text-gray-800">IoT Smart Farm Dashboard</h1>

      {/* --- ส่วนที่ 1: Cards แสดงค่าสภาพอากาศล่าสุด --- */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-orange-500 p-4 md:p-6">
          <span className="text-xs md:text-sm font-medium text-gray-500 mb-1 md:mb-2 block">อุณหภูมิอากาศ (Air Temp)</span>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {latestAir.temp !== "-" ? `${latestAir.temp} °C` : "-"}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500 p-4 md:p-6">
          <span className="text-xs md:text-sm font-medium text-gray-500 mb-1 md:mb-2 block">ความชื้นสัมพัทธ์ (Air Hum)</span>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {latestAir.humidity !== "-" ? `${latestAir.humidity} %` : "-"}
          </div>
        </div>
      </div>

      {/* --- ส่วนที่ 2: วนลูปสร้างกราฟตาม Sensor ID --- */}
      <div className="space-y-6 md:space-y-8">
        {sensorsData.map((sensor) => (
          // ใช้ displayId เป็น Key 
          <div key={sensor.displayId} className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            
            <div className="mb-4 md:mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span>Sensor: {sensor.displayId}</span>
                <span className="text-xs md:text-sm font-normal text-gray-600 bg-gray-100 px-3 py-1 rounded-full w-fit">
                  {sensor.type === "AIR" ? "เซนเซอร์สภาพอากาศ" : sensor.type === "TH" ? "เซนเซอร์ดิน (ความชื้น/อุณหภูมิ)" : "เซนเซอร์ pH ดิน"}
                </span>
              </h2>
            </div>

            {(sensor.type === "TH" || sensor.type === "AIR") && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                <div className="bg-gray-50/50 p-2 md:p-4 rounded-lg border border-gray-50 w-full overflow-hidden">
                  <h3 className="text-sm md:text-md font-semibold text-gray-700 mb-2 md:mb-4 text-center">อุณหภูมิ (°C)</h3>
                  <CustomLineChart
                    data={sensor.chartData}
                    xAxisKey="fullTime"
                    height={250} 
                    lines={[{ dataKey: "Temperature", name: "อุณหภูมิ", color: "#ef4444" }]}
                    formatXAxis={(value) => (typeof value === "string" ? value.split(" ")[1] : value)}
                  />
                </div>

                <div className="bg-gray-50/50 p-2 md:p-4 rounded-lg border border-gray-50 w-full overflow-hidden">
                  <h3 className="text-sm md:text-md font-semibold text-gray-700 mb-2 md:mb-4 text-center">ความชื้น (%)</h3>
                  <CustomLineChart
                    data={sensor.chartData}
                    xAxisKey="fullTime"
                    height={250}
                    lines={[{ dataKey: "Humidity", name: "ความชื้น", color: "#3b82f6" }]}
                    formatXAxis={(value) => (typeof value === "string" ? value.split(" ")[1] : value)}
                  />
                </div>
              </div>
            )}

            {sensor.type === "PH" && (
              <div className="bg-gray-50/50 p-2 md:p-4 rounded-lg border border-gray-50 w-full md:w-3/4 lg:w-1/2 mx-auto overflow-hidden">
                <h3 className="text-sm md:text-md font-semibold text-gray-700 mb-2 md:mb-4 text-center">ระดับค่า pH</h3>
                <CustomLineChart
                  data={sensor.chartData}
                  xAxisKey="fullTime"
                  height={250}
                  lines={[{ dataKey: "PH", name: "ระดับ pH", color: "#10b981" }]}
                  formatXAxis={(value) => (typeof value === "string" ? value.split(" ")[1] : value)}
                />
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}