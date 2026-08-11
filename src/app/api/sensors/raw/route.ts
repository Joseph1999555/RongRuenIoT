import { NextResponse } from "next/server";
import type { SensorUploadRequest } from "@/app/types/sensors";
import { decodeSensor } from "@/app/data/decoder/sensorDecoder";
import { insertSensor } from "@/app/data/repositories/sensorRepository";

export async function POST(request: Request) {
  try {
    const body: SensorUploadRequest = await request.json();

    if (!body.system || !Array.isArray(body.sensors)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request payload",
        },
        {
          status: 400,
        },
      );
    }

    const inserted = [];
    const allowedTypes = ["TH", "AIR", "PH"];

    for (const sensor of body.sensors) {
      if (
        sensor.id == null ||
        !sensor.type ||
        !sensor.raw
      ) {
        console.warn("Skip invalid sensor:", sensor);
        continue;
      }

      if (!allowedTypes.includes(sensor.type)) {
        console.warn("Unknown sensor type:", sensor.type);
        continue;
      }

      const decoded = decodeSensor(
        body.system,
        sensor.id,
        sensor.type,
        sensor.raw,
      );

      const id = await insertSensor(decoded);

      inserted.push({
        sensor: sensor.id,
        insertId: id,
      });
    }

    return NextResponse.json({
      success: true,
      inserted,
    });
  } catch (error) {
    console.error("RAW API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}