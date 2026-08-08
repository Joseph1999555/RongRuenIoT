import { NextResponse } from "next/server";
import { getLatestSensors } from "@/app/data/repositories/sensorRepository";

export async function GET() {
  try {
    const rows = await getLatestSensors();

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}