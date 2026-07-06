import DashboardData from "./DashboardData";
import {
  fetchSensorReadings,
  SENSOR_HISTORY_DAYS,
  SENSOR_HISTORY_LIMIT,
  SENSOR_REVALIDATE_SECONDS,
} from "@/app/data/api/sensorHistory";

async function getInitialSensorData(referenceTime: number) {
  try {
    return await fetchSensorReadings({
      action: "read",
      days: SENSOR_HISTORY_DAYS,
      limit: SENSOR_HISTORY_LIMIT,
      referenceTime,
      revalidate: SENSOR_REVALIDATE_SECONDS,
      sheet: "all",
      tags: ["sensors", "sensors:all", `sensors:all:${SENSOR_HISTORY_DAYS}d`],
      timeoutMs: 10000,
    });
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const initialDataUpdatedAt = Date.now();
  const initialData = await getInitialSensorData(initialDataUpdatedAt);

  return (
    <div className="w-full">
      <DashboardData
        historyDays={SENSOR_HISTORY_DAYS}
        initialData={initialData}
        initialDataUpdatedAt={initialDataUpdatedAt}
      />
    </div>
  );
}
