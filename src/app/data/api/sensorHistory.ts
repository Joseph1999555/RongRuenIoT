import { fetchFromSheet } from "@/app/data/api/sheetFetch";
import type { SensorApiResponse } from "@/app/types/sensors";

export const SENSOR_HISTORY_DAYS = 3;
export const SENSOR_HISTORY_LIMIT = 1000;
export const SENSOR_REVALIDATE_SECONDS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

type FetchSensorReadingsOptions = {
  action?: string;
  days?: number;
  limit?: number;
  referenceTime?: number;
  revalidate?: number;
  sheet?: string;
  tags?: string[];
  timeoutMs?: number;
};

export function normalizePositiveInteger(
  value: number,
  fallback: number,
  max: number,
) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(value), 1), max);
}

export function sortReadingsByNewest(readings: SensorApiResponse[]) {
  return [...readings].sort((a, b) => {
    const timestampA = new Date(a["Time Stamp"]).getTime();
    const timestampB = new Date(b["Time Stamp"]).getTime();

    if (Number.isNaN(timestampA) && Number.isNaN(timestampB)) return 0;
    if (Number.isNaN(timestampA)) return 1;
    if (Number.isNaN(timestampB)) return -1;

    return timestampB - timestampA;
  });
}

export function filterReadingsByDays(
  readings: SensorApiResponse[],
  days: number,
  referenceTime = Date.now(),
) {
  const windowStart = referenceTime - days * DAY_MS;

  return readings.filter((reading) => {
    const timestamp = new Date(reading["Time Stamp"]).getTime();
    return (
      Number.isFinite(timestamp) &&
      timestamp >= windowStart &&
      timestamp <= referenceTime
    );
  });
}

export async function fetchSensorReadings({
  action = "read",
  days = SENSOR_HISTORY_DAYS,
  limit = SENSOR_HISTORY_LIMIT,
  referenceTime = Date.now(),
  revalidate = SENSOR_REVALIDATE_SECONDS,
  sheet = "all",
  tags,
  timeoutMs,
}: FetchSensorReadingsOptions = {}) {
  const readings = await fetchFromSheet<SensorApiResponse[]>({
    action,
    sheet,
    limit,
    revalidate,
    tags,
    timeoutMs,
  });

  const sortedReadings = sortReadingsByNewest(readings);

  if (action !== "read" || days <= 0) {
    return sortedReadings;
  }

  return filterReadingsByDays(sortedReadings, days, referenceTime);
}
