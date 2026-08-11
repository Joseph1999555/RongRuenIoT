import DashboardData from "./DashboardData";
import {
  fetchSensorReadings,
  SENSOR_HISTORY_DAYS,
  SENSOR_HISTORY_LIMIT,
} from "@/app/data/api/sensorHistory";

async function getInitialSensorData(referenceTime: number) {
  try {
    return await fetchSensorReadings({
      action: "read",
      days: SENSOR_HISTORY_DAYS,
      limit: SENSOR_HISTORY_LIMIT,
      referenceTime,
      sheet: "all",
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