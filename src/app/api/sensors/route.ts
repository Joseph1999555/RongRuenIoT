import { NextResponse } from "next/server";
import { fetchFromSheet } from "@/app/data/api/sheetScript";
import type { SensorApiResponse } from "@/app/types/sensors";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 16;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);

  try {
    const data = await fetchFromSheet<SensorApiResponse[]>({
      action: searchParams.get("action") ?? "read",
      sheet: searchParams.get("sheet") ?? "all",
      limit: Number.isFinite(limit) ? limit : DEFAULT_LIMIT,
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
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
