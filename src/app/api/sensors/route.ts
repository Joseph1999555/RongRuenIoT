import { NextResponse } from "next/server";
import {
  fetchSensorReadings,
  normalizePositiveInteger,
  SENSOR_HISTORY_DAYS,
  SENSOR_HISTORY_LIMIT,
} from "@/app/data/api/sensorHistory";
import { insertSensor } from "@/app/data/repositories/sensorRepository";
import type { CreateSensorInput } from "@/app/types/sensors";

const DEFAULT_LIMIT = 16;
const MAX_LATEST_LIMIT = 100;
const MAX_HISTORY_LIMIT = 2000;
const SENSOR_CACHE_CONTROL = "public, s-maxage=30, stale-while-revalidate=120";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "read";
  const sheet = searchParams.get("sheet") ?? "all";
  const daysParam = searchParams.get("days");
  const parsedDays = Number(daysParam);
  const days =
    daysParam === null || parsedDays <= 0
      ? 0
      : normalizePositiveInteger(parsedDays, SENSOR_HISTORY_DAYS, 30);
  const defaultLimit = days > 0 ? SENSOR_HISTORY_LIMIT : DEFAULT_LIMIT;
  const maxLimit = days > 0 ? MAX_HISTORY_LIMIT : MAX_LATEST_LIMIT;
  const limit = normalizePositiveInteger(
    Number(searchParams.get("limit") ?? defaultLimit),
    defaultLimit,
    maxLimit,
  );
  const canCache = action === "read";

  try {
    const data = await fetchSensorReadings({
      action,
      limit,
      days,
    });


    return NextResponse.json(data, {
      headers: {
        "Cache-Control": canCache ? SENSOR_CACHE_CONTROL : "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load sensor data";

    return NextResponse.json(
      { message },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateSensorInput = await request.json();

    const insertId = await insertSensor(body);

    return NextResponse.json(
      {
        success: true,
        id: insertId,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to insert sensor data",
      },
      {
        status: 500,
      },
    );
  }
}
