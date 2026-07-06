import { NextResponse } from "next/server";

const DEFAULT_LAT = "13.735269828319813";
const DEFAULT_LON = "100.31390200299732";
const WEATHER_REVALIDATE_SECONDS = 600;
const WEATHER_CACHE_CONTROL = "public, s-maxage=600, stale-while-revalidate=1800";

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        weather: [{ main: "Unknown" }],
        main: {},
        message: "OPENWEATHER_API_KEY is not configured",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  // const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`;

  const weatherUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
  weatherUrl.searchParams.set("lat", process.env.OPENWEATHER_LAT ?? DEFAULT_LAT);
  weatherUrl.searchParams.set("lon", process.env.OPENWEATHER_LON ?? DEFAULT_LON);
  weatherUrl.searchParams.set("appid", apiKey);
  weatherUrl.searchParams.set("units", "metric");

  try {
    const response = await fetch(weatherUrl, {
      next: {
        revalidate: WEATHER_REVALIDATE_SECONDS,
        tags: ["weather"],
      },
    });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          weather: [{ main: "Unknown" }],
          main: {},
          message: payload?.message ?? "Unable to load weather data",
        },
        {
          status: response.status,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": WEATHER_CACHE_CONTROL,
      },
    });
  } catch {
    return NextResponse.json(
      {
        weather: [{ main: "Unknown" }],
        main: {},
        message: "Unable to reach weather service",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
