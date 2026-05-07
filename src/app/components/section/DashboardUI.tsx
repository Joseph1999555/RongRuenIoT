"use client";

import React, { useMemo, useState } from "react";
import { CloudRain, Droplets, ThermometerSun, Wind, Sprout, Activity, Settings, Moon, Sun, Globe } from "lucide-react";
import ModernAreaChart, { GlassCard } from "../ui/ModernAreaChart";
import { translations } from "@/app/data/mock/language";

interface SensorApiResponse {
  "Time Stamp": string;
  System?: string;
  SensorId: number;
  Type?: string;
  PH?: number;
  Temperature?: number;
  Humidity?: number;
}

interface ProcessedSensor {
  displayId: string;
  type: string;
  latest: { temp: string; humidity: string; ph: string; time: string };
  chartData: any[];
}

export default function DashboardUI({ data }: { data: SensorApiResponse[] }) {

  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<"en" | "th">("en");
  const [showSettings, setShowSettings] = useState(false);

  const translation = translations[lang];
  
  // 1. ประมวลผลข้อมูล (จัดกลุ่มและเรียงเวลา)
  const { sensorsData, airSensor } = useMemo(() => {
    if (!data || data.length === 0) return { sensorsData: [], airSensor: null };

    const sensorGroups: Record<string, ProcessedSensor> = {};
    let mainAirSensor: ProcessedSensor | null = null;

    data.forEach((item) => {
      const sid = item.SensorId;
      const sys = item.System || "SYS";
      const displayId = `${sys}-${sid}`;
      const sType = item.Type || (sid === 15 ? "AIR" : sid >= 13 ? "PH" : "TH");

      if (!sensorGroups[displayId]) {
        sensorGroups[displayId] = {
          displayId, type: sType,
          latest: { temp: "-", humidity: "-", ph: "-", time: "-" },
          chartData: [],
        };
      }

      const date = new Date(item["Time Stamp"]);
      const timeOnly = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      const timestamp = date.getTime();

      const dataPoint = { timeOnly, timestamp, Temperature: item.Temperature, Humidity: item.Humidity, PH: item.PH };
      
      // อัปเดตค่าล่าสุด
      sensorGroups[displayId].latest = {
        temp: item.Temperature !== undefined ? String(item.Temperature) : sensorGroups[displayId].latest.temp,
        humidity: item.Humidity !== undefined ? String(item.Humidity) : sensorGroups[displayId].latest.humidity,
        ph: item.PH !== undefined ? String(item.PH) : sensorGroups[displayId].latest.ph,
        time: timeOnly
      };

      sensorGroups[displayId].chartData.push(dataPoint);
    });

    const processed = Object.values(sensorGroups).map(sensor => {
      sensor.chartData.sort((a, b) => a.timestamp - b.timestamp);
      return sensor;
    });

    mainAirSensor = processed.find(s => s.type === "AIR") || null;
    const otherSensors = processed.filter(s => s.type !== "AIR").sort((a, b) => a.displayId.localeCompare(b.displayId));

    return { sensorsData: otherSensors, airSensor: mainAirSensor };
  }, [data]);

  // กำหนดสีธีมหลักตาม State isDark
  const themeClasses = isDark 
    ? "bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] text-white" 
    : "bg-gradient-to-br from-slate-50 via-gray-100 to-slate-50 text-slate-800";

  // กำหนดสีของการ์ดกระจกให้เปลี่ยนตามโหมด
  const glassClasses = isDark
    ? "bg-white/5 border-white/10"
    : "bg-black/5 border-black/10 shadow-lg";

  return (
    //  ใช้ min-h-screen และ w-full เพื่อขยายเต็มจอ
    <div className={`min-h-screen w-full p-4 md:p-6 lg:p-8 font-sans overflow-x-hidden transition-colors duration-500 ${themeClasses}`}>
      
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative">
        <div>
          <h1 className="text-2xl md:text-3xl font-light tracking-wide">
            {translation.title1}<span className={`font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>{translation.title2}</span>
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-white/40" : "text-slate-500"}`}>{translation.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* ป้าย LIVE SYNC */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-100 border-emerald-200"}`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isDark ? "bg-emerald-500" : "bg-emerald-600"}`}></span>
            </span>
            <span className={`text-xs font-medium tracking-wider ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{translation.live}</span>
          </div>

          {/* 🌟 ป้ายฟันเฟือง (Settings Dropdown) */}
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-full backdrop-blur-md border transition-all duration-300 hover:rotate-90 ${
                isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/70" : "bg-black/5 border-black/10 hover:bg-black/10 text-slate-700"
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showSettings && (
              <div className={`absolute right-0 top-12 w-56 rounded-2xl backdrop-blur-xl border p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 ${
                isDark ? "bg-[#0f172a]/90 border-white/10 text-white" : "bg-white/90 border-black/10 text-slate-800"
              }`}>
                <div className="px-3 py-2 border-b border-gray-500/20 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{translation.settings}</p>
                </div>

                {/* เปลี่ยนธีม */}
                <button 
                  onClick={() => setIsDark(!isDark)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                >
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span>{translation.theme}</span>
                  </div>
                  <span className="text-xs opacity-50">{isDark ? "Dark" : "Light"}</span>
                </button>

                {/* เปลี่ยนภาษา */}
                <button 
                  onClick={() => setLang(lang === "en" ? "th" : "en")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>{translation.language}</span>
                  </div>
                  <span className="text-xs font-medium uppercase bg-gray-500/20 px-2 py-0.5 rounded-md">{lang}</span>
                </button>
              </div>
            )}
          </div>
          {/* 🌟 จบโซนฟันเฟือง */}

        </div>
      </header>

      {/* --- HERO SECTION (AIR SENSOR) - จัดเต็มแนวนอน --- */}
      {airSensor && (
        <GlassCard className="mb-8 relative overflow-hidden group">
          {/* แสง Background เรืองรอง */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* โซนตัวเลขหลัก (ซ้าย) */}
            <div className="lg:col-span-4">
              <h2 className="text-white/50 text-sm font-medium mb-4 uppercase tracking-wider flex items-center gap-2">
                <CloudRain className="w-4 h-4" /> {translation.atmosphere} (Node {airSensor.displayId})
              </h2>
              <div className="flex items-start gap-4">
                <span className="text-7xl xl:text-8xl font-extralight tracking-tighter">{airSensor.latest.temp}</span>
                <div className="mt-2 xl:mt-4">
                  <span className="text-2xl xl:text-4xl font-light text-white/50">°C</span>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-6 bg-black/20 p-4 rounded-xl border border-white/5 w-fit">
                <div>
                  <p className="text-white/40 text-xs uppercase mb-1">{translation.humidity}</p>
                  <p className="text-xl font-medium">{airSensor.latest.humidity} <span className="text-sm text-white/50">%</span></p>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div>
                  <p className="text-white/40 text-xs uppercase mb-1">{translation.lastUpdate}</p>
                  <p className="text-xl font-medium text-white/80">{airSensor.latest.time}</p>
                </div>
              </div>
            </div>

            {/* โซนกราฟจัดเต็ม (ขวา) */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/10 p-4 rounded-xl border border-white/5">
                <p className="text-white/50 text-xs mb-2">{translation.tempTrend}</p>
                <ModernAreaChart data={airSensor.chartData} dataKey="Temperature" color="#60a5fa" height={140} />
              </div>
              <div className="bg-black/10 p-4 rounded-xl border border-white/5">
                <p className="text-white/50 text-xs mb-2">{translation.humTrend}</p>
                <ModernAreaChart data={airSensor.chartData} dataKey="Humidity" color="#22d3ee" height={140} />
              </div>
            </div>

          </div>
        </GlassCard>
      )}

      {/* --- SOIL NODES GRID - ตอบโจทย์จอใหญ่ใส่กราฟเยอะๆ --- */}
      <div>
        <h3 className="text-lg font-medium text-white/70 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" /> {translation.soilNodes}
        </h3>
        
        {/* 🌟 Grid 1 คอลัมน์(มือถือ) -> 2(แท็บเล็ต) -> 3(จอคอม) -> 4(จอ Wide) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {sensorsData.map((sensor) => (
            <GlassCard key={sensor.displayId} className="flex flex-col h-full hover:bg-white/10 transition duration-300">
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${sensor.type === "PH" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {sensor.type === "PH" ? <Sprout className="w-5 h-5" /> : <ThermometerSun className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg tracking-wide">{sensor.displayId}</h4>
                    <p className="text-xs text-white/40">{sensor.type === "PH" ? translation.phSensor : translation.thSensor}</p>
                  </div>
                </div>
              </div>

              {/* ข้อมูลล่าสุด & กราฟย่อยๆ ดันลงไปชิดด้านล่าง */}
              <div className="mt-auto space-y-4">
                
                {sensor.type === "PH" ? (
                  // กราฟเดี่ยวสำหรับ PH
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-white/40 text-xs">{translation.phSensor}</span>
                      <span className="text-xl font-bold text-emerald-400">{sensor.latest.ph}</span>
                    </div>
                    <ModernAreaChart data={sensor.chartData} dataKey="PH" color="#34d399" height={70} hideXAxis />
                  </div>
                ) : (
                  // กราฟคู่สำหรับ TH (บน-ล่าง)
                  <>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-white/40 text-xs">{translation.tempTrend}</span>
                        <span className="text-lg font-bold text-amber-400">{sensor.latest.temp}</span>
                      </div>
                      <ModernAreaChart data={sensor.chartData} dataKey="Temperature" color="#fbbf24" height={50} hideXAxis />
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-white/40 text-xs">{translation.humTrend}</span>
                        <span className="text-lg font-bold text-cyan-400">{sensor.latest.humidity}</span>
                      </div>
                      <ModernAreaChart data={sensor.chartData} dataKey="Humidity" color="#22d3ee" height={50} hideXAxis />
                    </div>
                  </>
                )}

              </div>
            </GlassCard>
          ))}
        </div>
      </div>

    </div>
  );
}