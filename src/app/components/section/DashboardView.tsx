"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Activity,
  CloudRain,
  Clock,
  Eye,
  Globe,
  Moon,
  Settings,
  Sprout,
  Sun,
  ThermometerSun,
  X,
} from "lucide-react";
import ModernAreaChart from "../ui/ModernAreaChart";
import { useWeatherDisplay } from "../ui/Weather";
import { translations } from "@/app/data/mock/language";
import type {
  SensorApiResponse,
  SensorChartPoint,
  SensorGroup,
} from "@/app/types/sensors";

type DashboardViewProps = {
  data: SensorApiResponse[];
  isRefreshing?: boolean;
};

type MutableSensorGroup = SensorGroup & {
  latestTimestamp: number;
};

const UNAVAILABLE = "--";
const COMING_SOON_LABEL = "COMMING SOON";
const CELSIUS_UNIT = "\u00B0C";
const STALE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const dashboardTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const timeOnlyFormatter = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function useBangkokClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

function formatReading(value?: number | null, isStale = false) {
  if (isStale || value === undefined || value === null || !Number.isFinite(value)) {
    return UNAVAILABLE;
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getSensorType(item: SensorApiResponse) {
  const explicitType = item.Type?.toUpperCase();

  if (explicitType) {
    return explicitType;
  }

  if (item.SensorId === 15) {
    return "AIR";
  }

  return item.SensorId >= 13 ? "PH" : "TH";
}

function processSensorData(data: SensorApiResponse[]) {
  const groups: Record<string, MutableSensorGroup> = {};
  const staleBefore = Date.now() - STALE_WINDOW_MS;
  let newestTimestamp = 0;
  let newestLabel = UNAVAILABLE;

  for (const item of data) {
    const sensorId = Number(item.SensorId);

    if (!Number.isFinite(sensorId)) {
      continue;
    }

    const system = item.System ?? "SYS";
    const displayId = `${system}-${sensorId}`;
    const type = getSensorType(item);
    const date = new Date(item["Time Stamp"]);
    const timestamp = date.getTime();
    const isInvalidDate = Number.isNaN(timestamp);
    const isStale = isInvalidDate || timestamp < staleBefore;
    const timeOnly = isInvalidDate ? UNAVAILABLE : timeOnlyFormatter.format(date);
    const dateTimeLabel = isInvalidDate
      ? UNAVAILABLE
      : `${dateOnlyFormatter.format(date)} ${timeOnly}`;
    const displayTime = isStale ? `${dateTimeLabel} old` : timeOnly;

    if (!groups[displayId]) {
      groups[displayId] = {
        displayId,
        type,
        latestTimestamp: 0,
        latest: {
          temp: UNAVAILABLE,
          humidity: UNAVAILABLE,
          ph: UNAVAILABLE,
          time: UNAVAILABLE,
        },
        chartData: [],
      };
    }

    const group = groups[displayId];
    const chartPoint: SensorChartPoint = {
      timeOnly,
      dateTimeLabel,
      timestamp,
      isStale,
      Temperature:
        item.Temperature === undefined ? undefined : isStale ? null : item.Temperature,
      Humidity: item.Humidity === undefined ? undefined : isStale ? null : item.Humidity,
      PH: item.PH === undefined ? undefined : isStale ? null : item.PH,
    };

    group.chartData.push(chartPoint);

    if (!isInvalidDate && timestamp > newestTimestamp) {
      newestTimestamp = timestamp;
      newestLabel = dateTimeLabel;
    }

    if (!isInvalidDate && timestamp >= group.latestTimestamp) {
      group.latestTimestamp = timestamp;
      group.latest = {
        temp:
          item.Temperature === undefined
            ? group.latest.temp
            : formatReading(item.Temperature, isStale),
        humidity:
          item.Humidity === undefined
            ? group.latest.humidity
            : formatReading(item.Humidity, isStale),
        ph: item.PH === undefined ? group.latest.ph : formatReading(item.PH, isStale),
        time: displayTime,
      };
    }
  }

  const processed = Object.values(groups).map((group) => {
    const sensor: SensorGroup = {
      displayId: group.displayId,
      type: group.type,
      latest: group.latest,
      chartData: group.chartData,
    };

    sensor.chartData.sort((a, b) => b.timestamp - a.timestamp);
    sensor.chartData = sensor.chartData.slice(0, sensor.type === "AIR" ? 10 : 6);
    sensor.chartData.sort((a, b) => a.timestamp - b.timestamp);
    return sensor;
  });

  const airSensor = processed.find((sensor) => sensor.type === "AIR") ?? null;
  const sensorsData = processed
    .filter((sensor) => sensor.type !== "AIR")
    .sort((a, b) => a.displayId.localeCompare(b.displayId, undefined, { numeric: true }));
  const staleCount = processed.filter((sensor) =>
    sensor.chartData.length > 0 && sensor.chartData.every((point) => point.isStale),
  ).length;

  return {
    airSensor,
    sensorsData,
    latestDataTime: newestLabel,
    staleCount,
    totalNodes: processed.length,
  };
}

type SensorMetricKey = keyof Pick<SensorChartPoint, "Temperature" | "Humidity" | "PH">;

function hasMetricData(data: SensorChartPoint[], dataKey: SensorMetricKey) {
  return data.some((item) => {
    const value = item[dataKey];
    return typeof value === "number" && Number.isFinite(value);
  });
}

function hasSensorData(sensor: SensorGroup) {
  if (sensor.type === "PH") {
    return hasMetricData(sensor.chartData, "PH");
  }

  return (
    hasMetricData(sensor.chartData, "Temperature") ||
    hasMetricData(sensor.chartData, "Humidity")
  );
}

function ComingSoonPanel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex min-h-32 items-center justify-center rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] px-4 py-8 text-center ${className}`}
    >
      <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        {COMING_SOON_LABEL}
      </span>
    </div>
  );
}

function StatusPill({
  isRefreshing,
  staleCount,
}: {
  isRefreshing?: boolean;
  staleCount: number;
}) {
  const label = isRefreshing ? "Syncing" : staleCount > 0 ? `${staleCount} stale` : "Live";

  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--foreground)] shadow-sm">
      <Activity
        className={`h-4 w-4 ${staleCount > 0 ? "text-amber-500" : "text-emerald-500"}`}
      />
      <span>{label}</span>
    </div>
  );
}

function SettingsPanel({
  lang,
  currentTheme,
  isDark,
  onToggleLang,
  onToggleTheme,
}: {
  lang: "en" | "th";
  currentTheme: string;
  isDark: boolean;
  onToggleLang: () => void;
  onToggleTheme: () => void;
}) {
  const translation = translations[lang];

  return (
    <div className="absolute right-0 top-12 z-30 w-60 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground)] shadow-xl">
      <p className="px-3 py-2 text-xs font-semibold text-[var(--muted)]">
        {translation.settings}
      </p>

      <button
        type="button"
        onClick={onToggleTheme}
        className="flex h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm transition hover:bg-[var(--surface-muted)]"
      >
        <span className="flex items-center gap-2">
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {translation.theme}
        </span>
        <span className="text-xs text-[var(--muted)]">{currentTheme}</span>
      </button>

      <button
        type="button"
        onClick={onToggleLang}
        className="mt-1 flex h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm transition hover:bg-[var(--surface-muted)]"
      >
        <span className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {translation.language}
        </span>
        <span className="text-xs text-[var(--muted)]">{lang.toUpperCase()}</span>
      </button>
    </div>
  );
}

function MetricBlock({
  label,
  value,
  unit,
  tone = "text-[var(--foreground)]",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className={`mt-1 break-words text-2xl font-semibold leading-tight ${tone}`}>
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-[var(--muted)]">{unit}</span> : null}
      </p>
    </div>
  );
}

function ChartCard({
  label,
  data,
  dataKey,
  color,
  isDark,
}: {
  label: string;
  data: SensorChartPoint[];
  dataKey: keyof Pick<SensorChartPoint, "Temperature" | "Humidity" | "PH">;
  color: string;
  isDark: boolean;
}) {
  const hasData = hasMetricData(data, dataKey);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{label}</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
      {hasData ? (
        <ModernAreaChart
          isDark={isDark}
          data={data}
          dataKey={dataKey}
          color={color}
          height={136}
        />
      ) : (
        <ComingSoonPanel />
      )}
    </section>
  );
}

function EmptyAtmosphere({ translation }: { translation: (typeof translations)["en"] }) {
  return (
    <section className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-5 text-[var(--muted)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <CloudRain className="h-4 w-4" />
        {translation.atmosphere}
      </div>
      <ComingSoonPanel className="mt-4" />
    </section>
  );
}

function AtmosphereCards({
  airSensor,
  isDark,
  latestDataTime,
  translation,
}: {
  airSensor: SensorGroup | null;
  isDark: boolean;
  latestDataTime: string;
  translation: (typeof translations)["en"];
}) {
  const { weatherDesc } = useWeatherDisplay();

  if (!airSensor) {
    return <EmptyAtmosphere translation={translation} />;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
              <CloudRain className="h-4 w-4 text-sky-500" />
              {translation.atmosphere}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{airSensor.displayId}</h2>
          </div>
          <div className="text-right">
            <div className="flex justify-end text-sky-500">{weatherDesc.icon}</div>
            <p className="mt-1 text-xs font-medium text-[var(--muted)]">{weatherDesc.text}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-4">
          <MetricBlock
            label={translation.tempTrend}
            value={airSensor.latest.temp}
            unit={CELSIUS_UNIT}
            tone="text-amber-600 dark:text-amber-400"
          />
          <MetricBlock
            label={translation.humidity}
            value={airSensor.latest.humidity}
            unit="%"
            tone="text-sky-600 dark:text-sky-400"
          />
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
          <Clock className="h-4 w-4" />
          <span>{latestDataTime}</span>
        </div>
      </div>

      <ChartCard
        isDark={isDark}
        label={translation.tempTrend}
        data={airSensor.chartData}
        dataKey="Temperature"
        color="#f59e0b"
      />
      <ChartCard
        isDark={isDark}
        label={translation.humTrend}
        data={airSensor.chartData}
        dataKey="Humidity"
        color="#0ea5e9"
      />
    </section>
  );
}

function SensorCard({
  sensor,
  isDark,
  onInspect,
  translation,
}: {
  sensor: SensorGroup;
  isDark: boolean;
  onInspect: (sensor: SensorGroup) => void;
  translation: (typeof translations)["en"];
}) {
  const isPH = sensor.type === "PH";
  const accent = isPH ? "#10b981" : "#f59e0b";
  const hasData = hasSensorData(sensor);

  return (
    <article className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{sensor.displayId}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isPH ? translation.phSensor : translation.thSensor}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            title="Inspect chart"
            aria-label={`Inspect ${sensor.displayId} chart`}
            onClick={() => onInspect(sensor)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
          >
            <Eye className="h-4 w-4" />
          </button>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-md"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            {isPH ? <Sprout className="h-5 w-5" /> : <ThermometerSun className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {hasData ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-4">
            {isPH ? (
              <MetricBlock
                label="pH"
                value={sensor.latest.ph}
                tone="text-emerald-600 dark:text-emerald-400"
              />
            ) : (
              <>
                <MetricBlock
                  label="Temp"
                  value={sensor.latest.temp}
                  unit={CELSIUS_UNIT}
                  tone="text-amber-600 dark:text-amber-400"
                />
                <MetricBlock
                  label="Humidity"
                  value={sensor.latest.humidity}
                  unit="%"
                  tone="text-sky-600 dark:text-sky-400"
                />
              </>
            )}
            <MetricBlock label={translation.lastUpdate} value={sensor.latest.time} />
          </div>

          <div className="mt-4 border-t border-[var(--border)] pt-3">
            {isPH ? (
              <ModernAreaChart
                isDark={isDark}
                data={sensor.chartData}
                dataKey="PH"
                color="#10b981"
                height={230}
              />
            ) : (
              <div className="grid gap-3">
                <ModernAreaChart
                  isDark={isDark}
                  data={sensor.chartData}
                  dataKey="Temperature"
                  color="#f59e0b"
                  height={76}
                  hideXAxis
                />
                <ModernAreaChart
                  isDark={isDark}
                  data={sensor.chartData}
                  dataKey="Humidity"
                  color="#0ea5e9"
                  height={76}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <ComingSoonPanel className="mt-5" />
      )}
    </article>
  );
}

function InspectChartPanel({
  color,
  data,
  dataKey,
  isDark,
  label,
}: {
  color: string;
  data: SensorChartPoint[];
  dataKey: SensorMetricKey;
  isDark: boolean;
  label: string;
}) {
  const hasData = hasMetricData(data, dataKey);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{label}</h3>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
      {hasData ? (
        <ModernAreaChart
          color={color}
          data={data}
          dataKey={dataKey}
          height={240}
          isDark={isDark}
        />
      ) : (
        <ComingSoonPanel />
      )}
    </section>
  );
}

function SensorInspectDialog({
  isDark,
  onClose,
  sensor,
  translation,
}: {
  isDark: boolean;
  onClose: () => void;
  sensor: SensorGroup;
  translation: (typeof translations)["en"];
}) {
  const isPH = sensor.type === "PH";
  const hasData = hasSensorData(sensor);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onMouseDown={onClose}
      role="dialog"
    >
      <div
        className="max-h-[88dvh] w-full max-w-5xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--foreground)] shadow-2xl sm:p-5"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Sensor inspect
            </p>
            <h2 className="mt-1 truncate text-2xl font-semibold">{sensor.displayId}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {isPH ? translation.phSensor : translation.thSensor}
            </p>
          </div>
          <button
            type="button"
            title="Close"
            aria-label="Close sensor inspect"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {isPH ? (
            <MetricBlock
              label="pH"
              value={hasData ? sensor.latest.ph : COMING_SOON_LABEL}
              tone="text-emerald-600 dark:text-emerald-400"
            />
          ) : (
            <>
              <MetricBlock
                label="Temp"
                value={hasData ? sensor.latest.temp : COMING_SOON_LABEL}
                unit={hasData ? CELSIUS_UNIT : undefined}
                tone="text-amber-600 dark:text-amber-400"
              />
              <MetricBlock
                label="Humidity"
                value={hasData ? sensor.latest.humidity : COMING_SOON_LABEL}
                unit={hasData ? "%" : undefined}
                tone="text-sky-600 dark:text-sky-400"
              />
            </>
          )}
          <MetricBlock label={translation.lastUpdate} value={sensor.latest.time} />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {isPH ? (
            <div className="md:col-span-2">
              <InspectChartPanel
                color="#10b981"
                data={sensor.chartData}
                dataKey="PH"
                isDark={isDark}
                label={translation.phSensor}
              />
            </div>
          ) : (
            <>
              <InspectChartPanel
                color="#f59e0b"
                data={sensor.chartData}
                dataKey="Temperature"
                isDark={isDark}
                label={translation.tempTrend}
              />
              <InspectChartPanel
                color="#0ea5e9"
                data={sensor.chartData}
                dataKey="Humidity"
                isDark={isDark}
                label={translation.humTrend}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptySoilNodes() {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Sensor nodes</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">No soil cards are reporting yet.</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
          <Sprout className="h-5 w-5" />
        </div>
      </div>
      <ComingSoonPanel className="mt-5" />
    </article>
  );
}

export default function DashboardView({ data, isRefreshing }: DashboardViewProps) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [lang, setLang] = useState<"en" | "th">("en");
  const [inspectedSensorId, setInspectedSensorId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const now = useBangkokClock();

  const currentTheme = (theme === "system" ? resolvedTheme : theme) ?? "dark";
  const isDark = currentTheme === "dark";
  const translation = translations[lang];
  const formattedDateTime = dashboardTimeFormatter.format(now);
  const { airSensor, sensorsData, latestDataTime, staleCount, totalNodes } = useMemo(
    () => processSensorData(data),
    [data],
  );
  const inspectedSensor = useMemo(
    () => sensorsData.find((sensor) => sensor.displayId === inspectedSensorId) ?? null,
    [inspectedSensorId, sensorsData],
  );

  useEffect(() => {
    if (!inspectedSensorId) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setInspectedSensorId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectedSensorId]);

  function toggleLanguage() {
    setLang((current) => {
      const next = current === "en" ? "th" : "en";
      return next;
    });
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {/* <StatusPill isRefreshing={isRefreshing} staleCount={staleCount} /> */}
              <div className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--muted)] shadow-sm">
                <Clock className="h-4 w-4" />
                <span>{formattedDateTime}</span>
              </div>
            </div>

            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              {translation.title1}{" "}
              <span className="text-[var(--accent)]">{translation.title2}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              {translation.subtitle}
            </p>
          </div>

          <div className="relative flex items-center gap-2 self-start">
            <div className="hidden rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] shadow-sm sm:block">
              {totalNodes} nodes
            </div>
            <button
              type="button"
              title={translation.settings}
              aria-label={translation.settings}
              onClick={() => setSettingsOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm transition hover:bg-[var(--surface-muted)]"
            >
              <Settings className="h-5 w-5" />
            </button>

            {settingsOpen ? (
              <SettingsPanel
                currentTheme={currentTheme}
                isDark={isDark}
                lang={lang}
                onToggleLang={toggleLanguage}
                onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
              />
            ) : null}
          </div>
        </header>

        <AtmosphereCards
          airSensor={airSensor}
          isDark={isDark}
          latestDataTime={latestDataTime}
          translation={translation}
        />

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sprout className="h-5 w-5 text-emerald-500" />
              {translation.soilNodes}
            </h2>
            <span className="text-sm text-[var(--muted)]">{sensorsData.length} nodes</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sensorsData.length > 0 ? (
              sensorsData.map((sensor) => (
                <SensorCard
                  key={sensor.displayId}
                  isDark={isDark}
                  onInspect={(selectedSensor) =>
                    setInspectedSensorId(selectedSensor.displayId)
                  }
                  sensor={sensor}
                  translation={translation}
                />
              ))
            ) : (
              <EmptySoilNodes />
            )}
          </div>
        </section>
      </div>
      {inspectedSensor ? (
        <SensorInspectDialog
          isDark={isDark}
          onClose={() => setInspectedSensorId(null)}
          sensor={inspectedSensor}
          translation={translation}
        />
      ) : null}
    </main>
  );
}
