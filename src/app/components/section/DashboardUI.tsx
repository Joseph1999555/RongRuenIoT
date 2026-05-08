"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { CloudRain, Droplets, ThermometerSun, Wind, Sprout, Activity, Settings, Moon, Sun, Globe } from "lucide-react";
import ModernAreaChart, { GlassCard } from "../ui/ModernAreaChart";
import { translations } from "@/app/data/mock/language"; // ถ้าคุณมีไฟล์แยกแล้ว ใช้บรรทัดนี้ครับ

interface SensorApiResponse {
  "Time Stamp": string; System?: string; SensorId: number; Type?: string; PH?: number; Temperature?: number; Humidity?: number;
}

export default function DashboardUI({ data }: { data: SensorApiResponse[] }) {

  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"en" | "th">("en");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => setMounted(true), []);

  const translation = translations[lang];

  //  เช็คว่ากำลังแสดงโหมด Dark อยู่จริงๆ หรือไม่ (เผื่อเลือก System Theme อยู่)
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const { sensorsData, airSensor } = useMemo(() => {
    if (!data || data.length === 0) return { sensorsData: [], airSensor: null };
    const sensorGroups: Record<string, any> = {};
    let mainAirSensor = null;

    data.forEach((item) => {
      const sid = item.SensorId;
      const sys = item.System || "SYS";
      const displayId = `${sys}-${sid}`;
      const sType = item.Type || (sid === 15 ? "AIR" : sid >= 13 ? "PH" : "TH");

      if (!sensorGroups[displayId]) {
        sensorGroups[displayId] = { displayId, type: sType, latest: { temp: "-", humidity: "-", ph: "-", time: "-" }, chartData: [] };
      }

      const date = new Date(item["Time Stamp"]);
      const timeOnly = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      const timestamp = date.getTime();

      sensorGroups[displayId].latest = {
        temp: item.Temperature !== undefined ? String(item.Temperature) : sensorGroups[displayId].latest.temp,
        humidity: item.Humidity !== undefined ? String(item.Humidity) : sensorGroups[displayId].latest.humidity,
        ph: item.PH !== undefined ? String(item.PH) : sensorGroups[displayId].latest.ph,
        time: timeOnly
      };

      sensorGroups[displayId].chartData.push({ timeOnly, timestamp, Temperature: item.Temperature, Humidity: item.Humidity, PH: item.PH });
    });

    const processed = Object.values(sensorGroups).map(sensor => {
      sensor.chartData.sort((a: any, b: any) => a.timestamp - b.timestamp);
      return sensor;
    });

    mainAirSensor = processed.find(s => s.type === "AIR") || null;
    const otherSensors = processed.filter(s => s.type !== "AIR").sort((a, b) => a.displayId.localeCompare(b.displayId));

    return { sensorsData: otherSensors, airSensor: mainAirSensor };
  }, [data]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full p-4 md:p-8 font-sans transition-colors duration-500 
      bg-slate-50 text-slate-900 
      dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] dark:text-white">

      <header className="flex justify-between items-center mb-10 relative">
        <div>
          {/*  เปลี่ยน opacity เป็น text color ธรรมดาให้ปรับตาม Theme */}
          <h1 className="text-3xl font-light tracking-wide text-slate-800 dark:text-slate-100">
            {translation.title1}<span className="font-bold text-blue-600 dark:text-blue-400">{translation.title2}</span>
          </h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">{translation.subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full backdrop-blur-md border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:rotate-90 transition-all text-slate-600 dark:text-slate-300"
          >
            <Settings className="w-5 h-5" />
          </button>

          {showSettings && (
            <div
              onMouseLeave={() => setShowSettings(false)}
              className="absolute right-0 top-16 w-64 rounded-3xl backdrop-blur-2xl border p-3 shadow-2xl z-50 
              bg-white/90 border-slate-200 text-slate-800 
              dark:bg-slate-900/90 dark:border-white/10 dark:text-white 
              animate-in zoom-in-95 duration-200 
              transition-all duration-500 transform-gpu antialiased" /*  1. ใส่ transform-gpu และ antialiased แก้ตัวอักษรกระพริบตอนจบ Transition */
            >

              <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors duration-500">
                {translation.settings}
              </p>

              {/* Toggle Theme */}
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-500"
              >
                <div className="flex items-center gap-3">
                  
                  {/*  2. ICON MORPHING: วางซ้อนกันแล้วสั่งหมุน/เฟดเข้าออก อาการกระตุกจะหายขาดแถมดูหรูขึ้นมาก */}
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <Moon className={`absolute transition-all duration-500 text-blue-500 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
                    <Sun className={`absolute transition-all duration-500 text-amber-500 ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
                  </div>

                  {/*  3. บังคับสี Text ชัดเจน แทนที่จะปล่อยให้สืบทอดจาก Parent อย่างเดียว */}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors duration-500">
                    {translation.theme}
                  </span>
                </div>
                
                <span className="w-10 text-right text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 transition-colors duration-500">
                  {currentTheme}
                </span>
              </button>

              {/* Toggle Language */}
              <button
                onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-500"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors duration-500">
                    {translation.language}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-md transition-colors duration-500 text-slate-600 dark:text-slate-300">
                  {lang}
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      {airSensor && (
        <GlassCard className="mb-8 relative overflow-hidden group">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            <div className="lg:col-span-4">
              {/*  เปลี่ยน text-white/50 เป็น text-slate-500 dark:text-slate-400 */}
              <h2 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2">
                <CloudRain className="w-4 h-4" /> {translation.atmosphere} (Node {airSensor.displayId})
              </h2>
              <div className="flex items-start gap-4">
                {/*  บังคับสีตัวเลขหลักให้ชัดเจน */}
                <span className="text-7xl xl:text-8xl font-extralight tracking-tighter text-slate-800 dark:text-white">{airSensor.latest.temp}</span>
                <div className="mt-2 xl:mt-4">
                  <span className="text-2xl xl:text-4xl font-light text-slate-400 dark:text-slate-500">°C</span>
                </div>
              </div>

              {/*  เปลี่ยนกล่องย่อยเป็น bg-slate-100 dark:bg-black/20 */}
              <div className="flex items-center gap-6 mt-6 bg-slate-100/80 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 w-fit">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium mb-1">{translation.humidity}</p>
                  <p className="text-xl font-bold text-slate-700 dark:text-white">{airSensor.latest.humidity} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">%</span></p>
                </div>
                <div className="w-px h-8 bg-slate-300 dark:bg-white/10"></div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium mb-1">{translation.lastUpdate}</p>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{airSensor.latest.time}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50/50 dark:bg-black/10 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mb-2">{translation.tempTrend}</p>
                <ModernAreaChart isDark={isDark} data={airSensor.chartData} dataKey="Temperature" color="#60a5fa" height={140} />
              </div>
              <div className="bg-slate-50/50 dark:bg-black/10 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mb-2">{translation.humTrend}</p>
                <ModernAreaChart isDark={isDark} data={airSensor.chartData} dataKey="Humidity" color="#22d3ee" height={140} />
              </div>
            </div>

          </div>
        </GlassCard>
      )}

      {/* --- SOIL NODES GRID --- */}
      <div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> {translation.soilNodes}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {sensorsData.map((sensor) => (
            <GlassCard key={sensor.displayId} className="flex flex-col h-full hover:bg-white/80 dark:hover:bg-white/10 transition duration-300">

              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${sensor.type === "PH" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"}`}>
                    {sensor.type === "PH" ? <Sprout className="w-5 h-5" /> : <ThermometerSun className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white tracking-wide">{sensor.displayId}</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{sensor.type === "PH" ? translation.phSensor : translation.thSensor}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 flex-1 flex flex-col">

                {sensor.type === "PH" ? (
                  //  เพิ่ม flex-1 ให้กล่องนี้ยืดเต็มความสูง
                  <div className="bg-slate-100/50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex-1 flex flex-col">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">{translation.phSensor}</span>
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{sensor.latest.ph}</span>
                    </div>
                    {/*  ดันกราฟลงข้างล่างสุด และเพิ่มความสูงกราฟเป็น 130 เพื่อให้สมดุลกับการ์ดอื่น */}
                    <div className="mt-auto w-full">
                      <ModernAreaChart isDark={isDark} data={sensor.chartData} dataKey="PH" color="#34d399" height={130} hideXAxis />
                    </div>
                  </div>
                ) : (
                  //  ส่วนของ TH มี 2 กราฟอยู่แล้ว ก็ให้จัดชิดล่าง (justify-end) ปกติ
                  <div className="flex flex-col justify-end flex-1 space-y-4">
                    <div className="bg-slate-100/50 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">{translation.tempTrend}</span>
                        <span className="text-lg font-bold text-amber-500 dark:text-amber-400">{sensor.latest.temp}</span>
                      </div>
                      <ModernAreaChart isDark={isDark} data={sensor.chartData} dataKey="Temperature" color="#fbbf24" height={50} hideXAxis />
                    </div>
                    <div className="bg-slate-100/50 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                      <div className="flex justify-between items-end mb-1">
                        <div className="text-slate-500 dark:text-slate-400 font-medium text-xs">{translation.humTrend}</div>
                        <span className="text-lg font-bold text-cyan-500 dark:text-cyan-400">{sensor.latest.humidity}</span>
                      </div>
                      <ModernAreaChart isDark={isDark} data={sensor.chartData} dataKey="Humidity" color="#22d3ee" height={50} hideXAxis />
                    </div>
                  </div>
                )}

              </div>
            </GlassCard>
          ))}
        </div>
      </div>

    </div>
  );
}