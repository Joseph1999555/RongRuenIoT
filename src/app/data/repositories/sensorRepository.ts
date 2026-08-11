import db from "@/lib/db";
import type {
  SensorApiResponse,
  CreateSensorInput,
} from "@/app/types/sensors";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

function mapRows(rows: RowDataPacket[]): SensorApiResponse[] {
  return rows.map((row: any) => ({
    "Time Stamp": row.sensor_timestamp,
    System: row.system_code ?? row.system_name,
    SensorId: Number(row.sensor_id),
    Type: row.sensor_type_name ?? row.sensor_type,

    Temperature:
      row.temperature == null ? undefined : Number(row.temperature),

    Humidity:
      row.humidity == null ? undefined : Number(row.humidity),

    PH:
      row.ph == null ? undefined : Number(row.ph),
  }));
}

/**
 * ตรวจสอบว่า Vercel กำลังเชื่อมต่อ Database ตัวไหน
 * และ Database นั้นมีข้อมูลล่าสุดถึงเมื่อไหร่
 */
async function checkDatabaseConnection() {
  const [rows] = await db.query<RowDataPacket[]>(`
    SELECT
      DATABASE() AS db_name,
      @@hostname AS db_hostname,
      MAX(sensor_timestamp) AS latest_time,
      COUNT(*) AS total_rows
    FROM sensor_data
  `);

  console.log("=== DB CHECK ===");
  console.log(rows);

  return rows;
}

export async function getLatestSensors(
  limit: number = 1000,
  system: string = "all",
): Promise<SensorApiResponse[]> {

  await checkDatabaseConnection();

  let rows: RowDataPacket[];

  if (system === "all") {
    [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT
        sd.*,
        s.display_name,
        s.sensor_type,
        sys.system_code,
        sys.system_name AS system_display_name
      FROM sensor_data sd
      LEFT JOIN sensors s
        ON sd.sensor_ref_id = s.id
      LEFT JOIN systems sys
        ON s.system_id = sys.id
      ORDER BY sd.id DESC
      LIMIT ?
      `,
      [limit],
    );
  } else {
    [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT
        sd.*,
        s.display_name,
        s.sensor_type,
        sys.system_code,
        sys.system_name AS system_display_name
      FROM sensor_data sd
      LEFT JOIN sensors s
        ON sd.sensor_ref_id = s.id
      LEFT JOIN systems sys
        ON s.system_id = sys.id
      WHERE sys.system_code = ?
      ORDER BY sd.sensor_timestamp DESC
      LIMIT ?
      `,
      [system, limit],
    );
  }


  const mapped = mapRows(rows);

  return mapped;
}

async function findSensorRefId(
  systemCode: string,
  modbusAddress: number,
): Promise<number> {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT s.id
    FROM sensors s
    JOIN systems sys
      ON s.system_id = sys.id
    WHERE
      sys.system_code = ?
      AND s.modbus_address = ?
    LIMIT 1
    `,
    [systemCode, modbusAddress],
  );

  if (rows.length === 0) {
    throw new Error(`Sensor not found: ${systemCode}-${modbusAddress}`);
  }

  return Number(rows[0].id);
}

export async function insertSensor(
  sensor: CreateSensorInput,
): Promise<number> {
  const sensorRefId = await findSensorRefId(
    sensor.system_name,
    sensor.sensor_id,
  );

  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO sensor_data
    (
      system_name,
      sensor_id,
      sensor_ref_id,
      sensor_type,
      temperature,
      humidity,
      brightness,
      ph,
      raw_data,
      sensor_timestamp
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      sensor.system_name,
      sensor.sensor_id,
      sensorRefId,
      sensor.sensor_type,
      sensor.temperature ?? null,
      sensor.humidity ?? null,
      sensor.brightness ?? null,
      sensor.ph ?? null,
      sensor.raw_data ?? null,
    ],
  );

  await db.execute(
    `
    UPDATE sensors
    SET
      last_seen = NOW(),
      status = 'ONLINE'
    WHERE id = ?
    `,
    [sensorRefId],
  );

  return result.insertId;
}