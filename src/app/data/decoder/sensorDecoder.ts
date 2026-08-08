import type { CreateSensorInput } from "@/app/types/sensors";

export function hexToInt16(hexString: string): number {
  let intVal = parseInt(hexString, 16);

  if ((intVal & 0x8000) > 0) {
    intVal = intVal - 0x10000;
  }

  return intVal;
}

export function decodeTH(system: string, raw: string) {
  let temperature: number | null = null;
  let humidity: number | null = null;
  let brightness: number | null = null;

  if (system === "B" || system === "FARM_B") {
    if (raw.length >= 30) {
      temperature = hexToInt16(raw.substring(6, 10)) / 10;
      humidity = hexToInt16(raw.substring(10, 14)) / 10;
    }
  } else {
    if (raw.length >= 22) {
      humidity = hexToInt16(raw.substring(6, 10)) / 10;
      temperature = hexToInt16(raw.substring(10, 14)) / 10;
      brightness = hexToInt16(raw.substring(18, 22)) / 10;
    }
  }

  return {
    temperature,
    humidity,
    brightness,
  };
}

export function decodePH(raw: string): number | null {
  if (raw.length < 10) {
    return null;
  }

  return hexToInt16(raw.substring(6, 10)) / 10;
}

export function decodeSensor(
  system: string,
  sensorId: number,
  type: string,
  raw: string,
): CreateSensorInput {

  // TH และ AIR ใช้ Decoder เดียวกัน
  if (type === "TH" || type === "AIR") {
    const result = decodeTH(system, raw);

    return {
      system_name: system,
      sensor_id: sensorId,
      sensor_type: type,
      temperature: result.temperature,
      humidity: result.humidity,
      brightness: result.brightness,
      ph: null,
      raw_data: raw,
    };
  }

  // PH
  if (type === "PH") {
    return {
      system_name: system,
      sensor_id: sensorId,
      sensor_type: type,
      temperature: null,
      humidity: null,
      brightness: null,
      ph: decodePH(raw),
      raw_data: raw,
    };
  }

  throw new Error(`Unsupported sensor type: ${type}`);
}