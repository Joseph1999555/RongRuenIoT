"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  CloudRain, Sprout, Activity, ThermometerSun,
  Settings, Moon, Sun, Globe, Clock,
} from "lucide-react";
import ModernAreaChart, { GlassCard } from "../ui/ModernAreaChart";
import { translations } from "@/app/data/mock/language";
import { useWeatherDisplay } from "../ui/Weather";

// ─── Types ────────────────────────────────────────────────────────────────────

type Translation = (typeof translations)["en"];

interface SensorApiResponse {
  "Time Stamp": string;
  System?: string;
  SensorId: number;
  Type?: string;
  PH?: number;
  Temperature?: number;
  Humidity?: number;
}

interface SensorGroup {
  displayId: string;
  type: string;
  latest: { temp: string; humidity: string; ph: string; time: string };
  chartData: {
    timeOnly: string;
    dateTimeLabel: string;
    timestamp: number;
    isStale: boolean;
    Temperature?: number | null;
    Humidity?: number | null;
    PH?: number | null;
  }[];
}

// ─── Design tokens ────────────────────────────────────────────────────────────
//
//  Light palette  (warm cream — aged paper / natural linen)
//    page bg       : #faf7f2 → #f0ebe0  warm parchment gradient
//    card bg       : #fffdf8/90  creamy white + amber-tinted shadow
//    inner panel   : #fdf8ef/70  | border amber-100/60
//    decorative    : amber-200/25, orange-200/20, yellow-200/15 blobs
//    primary text  : stone-800
//    secondary text: stone-500
//    muted text    : stone-400
//
//  Dark palette (unchanged)
//    page bg       : #020617 → #0f172a
//    card bg       : white/5  + border white/8
//    inner panel   : black/20 | border white/5
//    primary text  : white / slate-300 / slate-400
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsDropdown({
  isDark, lang, currentTheme, translation,
  onToggleTheme, onToggleLang, onClose,
}: {
  isDark: boolean; lang: "en" | "th"; currentTheme: string | undefined;
  translation: Translation; onToggleTheme: () => void; onToggleLang: () => void; onClose: () => void;
}) {
  return (
    <div
      onMouseLeave={onClose}
      className="
        absolute right-0 top-12 sm:top-14 z-50
        w-56 sm:w-64 p-3 rounded-3xl border shadow-lg
        backdrop-blur-2xl transform-gpu antialiased
        animate-in zoom-in-95 duration-200
        bg-[#fffdf8]/95 border-amber-100/80 text-stone-700 shadow-amber-100/60
        dark:bg-slate-900/95 dark:border-white/10 dark:text-white dark:shadow-black/40
      "
    >
      <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest
        text-stone-400 dark:text-slate-500">
        {translation.settings}
      </p>

      <button
        onClick={onToggleTheme}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl
          hover:bg-amber-50 dark:hover:bg-white/10 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-4 h-4">
            <Moon className={`absolute w-4 h-4 transition-all duration-500 text-blue-500
              ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`} />
            <Sun className={`absolute w-4 h-4 transition-all duration-500 text-amber-500
              ${!isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`} />
          </div>
          <span className="text-sm font-medium text-stone-600 dark:text-slate-200">{translation.theme}</span>
        </div>
        <span className="text-[10px] font-bold uppercase text-stone-400 dark:text-slate-500">{currentTheme}</span>
      </button>

      <button
        onClick={onToggleLang}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl
          hover:bg-amber-50 dark:hover:bg-white/10 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-stone-600 dark:text-slate-200">{translation.language}</span>
        </div>
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md
          bg-amber-100/80 text-stone-500
          dark:bg-white/10 dark:text-slate-300">
          {lang}
        </span>
      </button>
    </div>
  );
}

function StatPill({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <p className="text-[11px] sm:text-xs uppercase font-semibold tracking-widest mb-1
        text-stone-400 dark:text-slate-400">
        {label}
      </p>
      <p className="text-lg sm:text-xl md:text-2xl font-bold leading-tight break-words
        text-stone-800 dark:text-white">
        {value}
        {unit && <span className="text-sm font-normal ml-1 text-stone-400 dark:text-slate-500">{unit}</span>}
      </p>
    </div>
  );
}

function MiniChart({
  isDark, data, dataKey, color, label, value, valueColor, height = 75,
}: {
  isDark: boolean; data: SensorGroup["chartData"]; dataKey: string; color: string;
  label: string; value: string; valueColor: string; height?: number;
}) {
  return (
    <div className="
      p-3 rounded-xl border
      bg-[#fdf8ef]/70 border-amber-100/60
      dark:bg-black/20 dark:border-white/5
    ">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-stone-500 dark:text-slate-400">{label}</span>
        <span className={`text-xl sm:text-2xl font-bold ${valueColor}`}>{value}</span>
      </div>
      <ModernAreaChart isDark={isDark} data={data} dataKey={dataKey} color={color} height={height} />
    </div>
  );
}

function SensorCard({ sensor, isDark, translation }: {
  sensor: SensorGroup; isDark: boolean; translation: Translation;
}) {
  const isPH = sensor.type === "PH";

  return (
    <GlassCard className="
      flex flex-col transition-all duration-300
      hover:shadow-md hover:shadow-amber-200/50
      dark:hover:bg-white/10 dark:hover:shadow-none
    ">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-xl shrink-0 ${isPH
          ? "bg-emerald-100/80 text-emerald-700  dark:bg-emerald-500/20 dark:text-emerald-400"
          : "bg-amber-100/70  text-amber-700     dark:bg-amber-500/20  dark:text-amber-400"}`}
        >
          {isPH ? <Sprout className="w-5 h-5" /> : <ThermometerSun className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-bold text-lg sm:text-xl tracking-wide leading-none
            text-stone-800 dark:text-white">
            {sensor.displayId}
          </h4>
          <p className="text-sm font-medium mt-0.5 text-stone-400 dark:text-slate-400">
            {isPH ? translation.phSensor : translation.thSensor}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 gap-3">
        {isPH ? (
          <div className="
            flex-1 flex flex-col p-3 sm:p-4 rounded-xl border
            bg-[#fdf8ef]/70 border-amber-100/60
            dark:bg-black/20 dark:border-white/5
          ">
            <div className="flex items-end justify-between mb-3">
              <span className="text-base font-semibold text-stone-500 dark:text-slate-400">
                {translation.phSensor}
              </span>
              <span className="text-3xl font-bold leading-none text-emerald-600 dark:text-emerald-400">
                {sensor.latest.ph}
              </span>
            </div>
            <div className="mt-auto">
              <ModernAreaChart isDark={isDark} data={sensor.chartData} dataKey="PH" color="#34d399" height={120} />
            </div>
          </div>
        ) : (
          <>
            <MiniChart
              isDark={isDark} data={sensor.chartData} dataKey="Temperature" color="#f59e0b"
              label={translation.tempTrend} value={sensor.latest.temp}
              valueColor="text-amber-600 dark:text-amber-400"
            />
            <MiniChart
              isDark={isDark} data={sensor.chartData} dataKey="Humidity" color="#0ea5e9"
              label={translation.humTrend} value={sensor.latest.humidity}
              valueColor="text-sky-600 dark:text-cyan-400"
            />
          </>
        )}
      </div>
    </GlassCard>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardUI({ data }: { data: SensorApiResponse[] }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"en" | "th">("en");
  const [showSettings, setShowSettings] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const mountedTimer = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(mountedTimer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";
  const translation = translations[lang];
  const formattedDateTime = currentDateTime.toLocaleString("en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const { weatherDesc } = useWeatherDisplay();

  // ── Data processing (logic unchanged) ──
  const { sensorsData, airSensor, latestDataTime } = useMemo<{
    sensorsData: SensorGroup[];
    airSensor: SensorGroup | null;
    latestDataTime: string;
  }>(() => {
    if (!data || data.length === 0) return { sensorsData: [], airSensor: null, latestDataTime: "-" };

    const groups: Record<string, SensorGroup> = {};
    const staleBefore = currentDateTime.getTime() - 3 * 24 * 60 * 60 * 1000;
    let newestTimestamp = 0;
    let newestLabel = "-";

    data.forEach((item) => {
      const sid = item.SensorId;
      const sys = item.System ?? "SYS";
      const displayId = `${sys}-${sid}`;
      const sType = item.Type ?? (sid === 15 ? "AIR" : sid >= 13 ? "PH" : "TH");

      if (!groups[displayId]) {
        groups[displayId] = {
          displayId, type: sType,
          latest: { temp: "-", humidity: "-", ph: "-", time: "-" },
          chartData: [],
        };
      }

      const date = new Date(item["Time Stamp"]);

      const timeOnly = date.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

      const dateOnly = date.toLocaleDateString("en-US", {
      timeZone: "Asia/Bangkok",
      month: "short",
      day: "numeric",
    });
      const dateTimeLabel = `${dateOnly} ${timeOnly}`;
      const timestamp = date.getTime();
      const isStale = Number.isNaN(timestamp) || timestamp < staleBefore;
      const displayTime = isStale ? `${dateTimeLabel} (old)` : timeOnly;

      if (!Number.isNaN(timestamp) && timestamp > newestTimestamp) {
        newestTimestamp = timestamp;
        newestLabel = dateTimeLabel;
      }

      groups[displayId].latest = {
        temp: item.Temperature !== undefined ? (isStale ? "NaN" : String(item.Temperature)) : groups[displayId].latest.temp,
        humidity: item.Humidity !== undefined ? (isStale ? "NaN" : String(item.Humidity)) : groups[displayId].latest.humidity,
        ph: item.PH !== undefined ? (isStale ? "NaN" : String(item.PH)) : groups[displayId].latest.ph,
        time: displayTime,
      };

      groups[displayId].chartData.push({
        timeOnly,
        dateTimeLabel,
        timestamp,
        isStale,
        Temperature: isStale && item.Temperature !== undefined ? null : item.Temperature,
        Humidity: isStale && item.Humidity !== undefined ? null : item.Humidity,
        PH: isStale && item.PH !== undefined ? null : item.PH,
      });
    });

    const processed = Object.values(groups).map((sensor) => {
      sensor.chartData.sort((a, b) => b.timestamp - a.timestamp);
      sensor.chartData = sensor.chartData.slice(0, sensor.type === "AIR" ? 10 : 4);
      sensor.chartData.sort((a, b) => a.timestamp - b.timestamp);
      return sensor;
    });

    const airSensor = processed.find((s) => s.type === "AIR") ?? null;
    const sensorsData = processed
      .filter((s) => s.type !== "AIR")
      .sort((a, b) => a.displayId.localeCompare(b.displayId));

    return { sensorsData, airSensor, latestDataTime: newestLabel };
  }, [currentDateTime, data]);

  if (!mounted) return null;

  return (
    <div className="
      relative min-h-screen w-full font-sans transition-colors duration-500
      px-3 py-5 sm:px-5 sm:py-7 md:px-8 md:py-9
      text-stone-800 dark:text-white
      bg-[#faf7f2] dark:bg-[#030712]
    ">

      {/* ── Light: warm parchment gradient layer ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 dark:hidden
        bg-gradient-to-br from-[#faf7f2] via-[#f5ede0]/60 to-[#ede3d4]/40" />

      {/* ── Light: soft warm decorative blobs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
        <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-amber-200/25  blur-3xl" />
        <div className="absolute top-1/3  -right-32  w-80 h-80 rounded-full bg-orange-200/20 blur-3xl" />
        <div className="absolute bottom-0  left-1/3  w-72 h-72 rounded-full bg-yellow-100/30 blur-3xl" />
      </div>

      {/* ── Dark: deep navy gradient ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden dark:block
        bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617]" />

      <div className="relative z-10 max-w-screen-2xl mx-auto space-y-6 sm:space-y-8">

        {/* ─── HEADER ──────────────────────────────────────────────────────── */}
        <header className="relative flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide leading-tight
              text-stone-800 dark:text-slate-100">
              {translation.title1}
              <span className="font-bold text-amber-600 dark:text-blue-400">{translation.title2}</span>
            </h1>
            <p className="mt-1 text-sm sm:text-base truncate text-stone-500 dark:text-slate-400">
              {translation.subtitle}
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs sm:text-sm font-medium text-stone-400 dark:text-slate-500">
              <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-blue-400" />
              <span>{formattedDateTime}</span>
            </p>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setShowSettings((v) => !v)}
              aria-label="Settings"
              className="
                p-2.5 sm:p-3 rounded-full transition-all hover:rotate-90
                border bg-[#fffdf8]/80 text-stone-500 border-amber-200/60 shadow-sm shadow-amber-100/60
                dark:bg-white/5 dark:text-slate-300 dark:border-white/10 dark:shadow-none
              "
            >
              <Settings className="w-5 h-5" />
            </button>

            {showSettings && (
              <SettingsDropdown
                isDark={isDark} lang={lang} currentTheme={currentTheme} translation={translation}
                onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
                onToggleLang={() => setLang((l) => (l === "en" ? "th" : "en"))}
                onClose={() => setShowSettings(false)}
              />
            )}
          </div>
        </header>

        {/* ─── HERO / AIR SENSOR ───────────────────────────────────────────── */}
        {airSensor && (
          <GlassCard className="relative overflow-hidden shadow-sm shadow-amber-200/40 dark:shadow-none">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl
              bg-amber-200/20 dark:bg-blue-500/10" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">

              {/* Left: weather stats */}
              <div className="flex flex-col gap-4 md:min-w-[220px] lg:min-w-[260px]">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider
                  text-stone-500 dark:text-slate-400">
                  <CloudRain className="w-4 h-4 shrink-0 text-amber-500 dark:text-slate-400" />
                  {translation.atmosphere}
                  <span className="font-normal normal-case text-xs text-stone-400 dark:text-slate-500">
                    ({airSensor.displayId})
                  </span>
                </h2>

                {/* Temperature + icon */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="flex items-start leading-none">
                    <span className="text-6xl sm:text-7xl font-extralight tracking-tighter
                      text-stone-800 dark:text-white">
                      {airSensor.latest.temp}
                    </span>
                    <span className="mt-2 text-2xl sm:text-3xl font-light text-stone-400 dark:text-slate-500">°C</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 opacity-80">
                    <div className="[&>svg]:w-12 [&>svg]:h-12 sm:[&>svg]:w-14 sm:[&>svg]:h-14
                      text-amber-600 dark:text-slate-200">
                      {weatherDesc.icon}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest
                      text-center whitespace-nowrap text-stone-500 dark:text-slate-400">
                      {weatherDesc.text}
                    </span>
                  </div>
                </div>

                {/* Humidity + last update */}
                <div className="flex items-center w-full md:w-auto justify-between text-center gap-4 px-4 py-3 rounded-xl border
                  bg-[#fffdf8]/80 border-amber-100/80 shadow-sm shadow-amber-100/50
                  dark:bg-black/20 dark:border-white/5 dark:shadow-none">
                  <StatPill label={translation.humidity} value={airSensor.latest.humidity} unit="%" />
                  <div className="w-px h-8 shrink-0 bg-amber-200/60 dark:bg-white/10" />
                  <StatPill label={translation.lastUpdate} value={latestDataTime} />
                </div>
              </div>

              {/* Right: charts */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                {[
                  { key: "Temperature", color: "#f59e0b", label: translation.tempTrend },
                  { key: "Humidity", color: "#0ea5e9", label: translation.humTrend },
                ].map(({ key, color, label }) => (
                  <div key={key} className="p-3 sm:p-4 rounded-xl border
                    bg-[#fdf8ef]/70 border-amber-100/60 shadow-sm shadow-amber-100/30
                    dark:bg-black/10 dark:border-white/5 dark:shadow-none">
                    <p className="text-sm font-semibold mb-2 text-stone-500 dark:text-slate-400">{label}</p>
                    <ModernAreaChart isDark={isDark} data={airSensor.chartData} dataKey={key} color={color} height={120} />
                  </div>
                ))}
              </div>

            </div>
          </GlassCard>
        )}

        {/* ─── SOIL NODES ──────────────────────────────────────────────────── */}
        <section>
          <h3 className="flex items-center gap-2 mb-4 text-lg sm:text-xl font-bold
            text-stone-700 dark:text-slate-300">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-amber-600 dark:text-indigo-400" />
            {translation.soilNodes}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {sensorsData.map((sensor) => (
              <SensorCard key={sensor.displayId} sensor={sensor} isDark={isDark} translation={translation} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
