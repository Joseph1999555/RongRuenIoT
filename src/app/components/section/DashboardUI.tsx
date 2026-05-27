"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  CloudRain, Sprout, Activity, ThermometerSun,
  Settings, Moon, Sun, Globe,
} from "lucide-react";
import ModernAreaChart, { GlassCard } from "../ui/ModernAreaChart";
import { translations } from "@/app/data/mock/language";
import { useWeatherDisplay } from "../ui/Weather";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  chartData: { timeOnly: string; timestamp: number; Temperature?: number; Humidity?: number; PH?: number }[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsDropdown({
  isDark,
  lang,
  currentTheme,
  translation,
  onToggleTheme,
  onToggleLang,
  onClose,
}: {
  isDark: boolean;
  lang: "en" | "th";
  currentTheme: string | undefined;
  translation: any;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onClose: () => void;
}) {
  return (
    <div
      onMouseLeave={onClose}
      className="
        absolute right-0 top-12 sm:top-14 z-50
        w-56 sm:w-64 p-3
        rounded-3xl border shadow-2xl
        backdrop-blur-2xl transform-gpu antialiased
        animate-in zoom-in-95 duration-200
        bg-white/90 border-slate-200 text-slate-800
        dark:bg-slate-900/90 dark:border-white/10 dark:text-white
      "
    >
      <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {translation.settings}
      </p>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-4 h-4">
            <Moon className={`absolute w-4 h-4 transition-all duration-500 text-blue-500 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`} />
            <Sun className={`absolute w-4 h-4 transition-all duration-500 text-amber-500 ${!isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`} />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{translation.theme}</span>
        </div>
        <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">{currentTheme}</span>
      </button>

      {/* Language toggle */}
      <button
        onClick={onToggleLang}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{translation.language}</span>
        </div>
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
          {lang}
        </span>
      </button>
    </div>
  );
}

function StatPill({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <p className="text-[11px] sm:text-xs uppercase font-semibold tracking-widest mb-1 text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-none">
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function MiniChart({
  isDark,
  data,
  dataKey,
  color,
  label,
  value,
  valueColor,
  height = 75,
}: {
  isDark: boolean;
  data: any[];
  dataKey: string;
  color: string;
  label: string;
  value: string;
  valueColor: string;
  height?: number;
}) {
  return (
    <div className="bg-slate-100/60 dark:bg-black/20 p-3 rounded-xl border border-slate-200/80 dark:border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`text-xl sm:text-2xl font-bold ${valueColor}`}>{value}</span>
      </div>
      <ModernAreaChart isDark={isDark} data={data} dataKey={dataKey} color={color} height={height} />
    </div>
  );
}

function SensorCard({ sensor, isDark, translation }: { sensor: SensorGroup; isDark: boolean; translation: any }) {
  const isPH = sensor.type === "PH";

  return (
    <GlassCard className="flex flex-col hover:bg-white/80 dark:hover:bg-white/10 transition-colors duration-300">
      {/* Card header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-xl shrink-0 ${isPH
          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          : "bg-amber-100  text-amber-600  dark:bg-amber-500/20  dark:text-amber-400"}`}
        >
          {isPH ? <Sprout className="w-5 h-5" /> : <ThermometerSun className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white tracking-wide leading-none">
            {sensor.displayId}
          </h4>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {isPH ? translation.phSensor : translation.thSensor}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 gap-3">
        {isPH ? (
          <div className="bg-slate-100/60 dark:bg-black/20 p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-white/5 flex-1 flex flex-col">
            <div className="flex items-end justify-between mb-3">
              <span className="text-base font-semibold text-slate-500 dark:text-slate-400">{translation.phSensor}</span>
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{sensor.latest.ph}</span>
            </div>
            <div className="mt-auto">
              <ModernAreaChart isDark={isDark} data={sensor.chartData} dataKey="PH" color="#34d399" height={120} />
            </div>
          </div>
        ) : (
          <>
            <MiniChart
              isDark={isDark}
              data={sensor.chartData}
              dataKey="Temperature"
              color="#fbbf24"
              label={translation.tempTrend}
              value={sensor.latest.temp}
              valueColor="text-amber-500 dark:text-amber-400"
            />
            <MiniChart
              isDark={isDark}
              data={sensor.chartData}
              dataKey="Humidity"
              color="#22d3ee"
              label={translation.humTrend}
              value={sensor.latest.humidity}
              valueColor="text-cyan-500 dark:text-cyan-400"
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

  useEffect(() => setMounted(true), []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";
  const translation = translations[lang];

  const { weatherDesc } = useWeatherDisplay();

  // ── Data processing (logic unchanged) ──
  const { sensorsData, airSensor } = useMemo<{
    sensorsData: SensorGroup[];
    airSensor: SensorGroup | null;
  }>(() => {
    if (!data || data.length === 0) return { sensorsData: [], airSensor: null };

    const groups: Record<string, SensorGroup> = {};

    data.forEach((item) => {
      const sid = item.SensorId;
      const sys = item.System ?? "SYS";
      const displayId = `${sys}-${sid}`;
      const sType = item.Type ?? (sid === 15 ? "AIR" : sid >= 13 ? "PH" : "TH");

      if (!groups[displayId]) {
        groups[displayId] = {
          displayId,
          type: sType,
          latest: { temp: "-", humidity: "-", ph: "-", time: "-" },
          chartData: [],
        };
      }

      const date = new Date(item["Time Stamp"]);
      const timeOnly = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      const timestamp = date.getTime();

      groups[displayId].latest = {
        temp: item.Temperature !== undefined ? String(item.Temperature) : groups[displayId].latest.temp,
        humidity: item.Humidity !== undefined ? String(item.Humidity) : groups[displayId].latest.humidity,
        ph: item.PH !== undefined ? String(item.PH) : groups[displayId].latest.ph,
        time: timeOnly,
      };

      groups[displayId].chartData.push({ timeOnly, timestamp, Temperature: item.Temperature, Humidity: item.Humidity, PH: item.PH });
    });

    const processed = Object.values(groups).map((sensor) => {
      sensor.chartData.sort((a, b) => b.timestamp - a.timestamp);
      sensor.chartData = sensor.chartData.slice(0, sensor.type === "AIR" ? 10 : 4);
      sensor.chartData.sort((a, b) => a.timestamp - b.timestamp);
      return sensor;
    });

    const airSensor = processed.find((s) => s.type === "AIR") ?? null;
    const sensorsData = processed.filter((s) => s.type !== "AIR").sort((a, b) => a.displayId.localeCompare(b.displayId));

    return { sensorsData, airSensor };
  }, [data]);

  if (!mounted) return null;

  return (
    <div className="
      min-h-screen w-full font-sans transition-colors duration-500
      px-3 py-5 sm:px-5 sm:py-7 md:px-8 md:py-9
      bg-slate-50 text-slate-900
      dark:bg-linear-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] dark:text-white
    ">
      <div className="max-w-screen-2xl mx-auto space-y-6 sm:space-y-8">

        {/* ─── HEADER ─────────────────────────────────────────────────────── */}
        <header className="relative flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide text-slate-800 dark:text-slate-100 leading-tight">
              {translation.title1}
              <span className="font-bold text-blue-600 dark:text-blue-400">{translation.title2}</span>
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400 truncate">
              {translation.subtitle}
            </p>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setShowSettings((v) => !v)}
              aria-label="Settings"
              className="
                p-2.5 sm:p-3 rounded-full transition-all
                border border-slate-200 dark:border-white/10
                bg-white/50 dark:bg-white/5
                text-slate-600 dark:text-slate-300
                hover:rotate-90
              "
            >
              <Settings className="w-5 h-5" />
            </button>

            {showSettings && (
              <SettingsDropdown
                isDark={isDark}
                lang={lang}
                currentTheme={currentTheme}
                translation={translation}
                onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
                onToggleLang={() => setLang((l) => (l === "en" ? "th" : "en"))}
                onClose={() => setShowSettings(false)}
              />
            )}
          </div>
        </header>

        {/* ─── HERO / AIR SENSOR ──────────────────────────────────────────── */}
        {airSensor && (
          <GlassCard className="relative overflow-hidden">
            {/* decorative glow */}
            <div className="pointer-events-none absolute -top-32 -right-32 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">

              {/* Left: weather stats */}
              <div className="flex flex-col gap-4 md:min-w-[220px] lg:min-w-[260px]">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <CloudRain className="w-4 h-4 shrink-0" />
                  {translation.atmosphere}
                  <span className="font-normal normal-case text-slate-400 dark:text-slate-500 text-xs">
                    ({airSensor.displayId})
                  </span>
                </h2>

                {/* Big temperature + weather icon */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="flex items-start leading-none">
                    <span className="text-6xl sm:text-7xl font-extralight tracking-tighter text-slate-800 dark:text-white">
                      {airSensor.latest.temp}
                    </span>
                    <span className="mt-2 text-2xl sm:text-3xl font-light text-slate-400 dark:text-slate-500">°C</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 opacity-80">
                    <div className="[&>svg]:w-12 [&>svg]:h-12 sm:[&>svg]:w-14 sm:[&>svg]:h-14 text-slate-700 dark:text-slate-200">
                      {weatherDesc.icon}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                      {weatherDesc.text}
                    </span>
                  </div>
                </div>

                {/* Humidity + last update pill */}
                <div className="flex items-center gap-4 w-fit px-4 py-3 rounded-xl border bg-slate-100/80 dark:bg-black/20 border-slate-200 dark:border-white/5">
                  <StatPill label={translation.humidity} value={airSensor.latest.humidity} unit="%" />
                  <div className="w-px h-8 bg-slate-300 dark:bg-white/10 shrink-0" />
                  <StatPill label={translation.lastUpdate} value={airSensor.latest.time} />
                </div>
              </div>

              {/* Right: charts — always 2-col side-by-side */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                {[
                  { key: "Temperature", color: "#60a5fa", label: translation.tempTrend },
                  { key: "Humidity", color: "#22d3ee", label: translation.humTrend },
                ].map(({ key, color, label }) => (
                  <div key={key} className="bg-slate-50/50 dark:bg-black/10 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-white/5">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
                    <ModernAreaChart isDark={isDark} data={airSensor.chartData} dataKey={key} color={color} height={120} />
                  </div>
                ))}
              </div>

            </div>
          </GlassCard>
        )}

        {/* ─── SOIL NODES ─────────────────────────────────────────────────── */}
        <section>
          <h3 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-4">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 dark:text-indigo-400 shrink-0" />
            {translation.soilNodes}
          </h3>

          {/*
            Grid columns:
              default → 1 col
              sm 640  → 2 col
              lg 1024 → 3 col
              2xl 1536→ 4 col
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {sensorsData.map((sensor) => (
              <SensorCard
                key={sensor.displayId}
                sensor={sensor}
                isDark={isDark}
                translation={translation}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}