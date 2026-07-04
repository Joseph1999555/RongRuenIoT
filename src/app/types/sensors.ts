export interface SensorApiResponse {
  "Time Stamp": string;
  System?: string;
  SensorId: number;
  Type?: string;
  PH?: number;
  Temperature?: number;
  Humidity?: number;
}

export interface SensorChartPoint {
  timeOnly: string;
  dateTimeLabel: string;
  timestamp: number;
  isStale: boolean;
  Temperature?: number | null;
  Humidity?: number | null;
  PH?: number | null;
}

export interface SensorGroup {
  displayId: string;
  type: string;
  latest: {
    temp: string;
    humidity: string;
    ph: string;
    time: string;
  };
  chartData: SensorChartPoint[];
  historyData: SensorChartPoint[];
}
