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

export interface CreateSensorInput {
  // ระบบเดิม (ยังใช้อยู่)
  system_name: string;
  sensor_id: number;
  sensor_type: string;

  // ระบบใหม่
  sensor_ref_id?: number;

  temperature?: number | null;
  humidity?: number | null;
  brightness?: number | null;
  ph?: number | null;
  raw_data?: string | null;
}

export interface RawSensorPayload {
  id: number;
  type: string;
  raw: string;
}

export interface SensorUploadRequest {
  system: string;
  sensors: RawSensorPayload[];
}