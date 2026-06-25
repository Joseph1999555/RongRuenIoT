"use client";

import useSWR from "swr";
import DashboardView from "./DashboardView";
import type { SensorApiResponse } from "@/app/types/sensors";

const DASHBOARD_DATA_URL = "/api/sensors?action=read&sheet=all&limit=16";

async function fetchSensorData(url: string): Promise<SensorApiResponse[]> {
  const response = await fetch(url);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message ?? "Unable to load sensor data");
  }

  return response.json();
}

function DashboardSkeleton() {
  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="h-8 w-56 animate-pulse rounded-md bg-[var(--surface-muted)]" />
            <div className="h-4 w-72 animate-pulse rounded-md bg-[var(--surface-muted)]" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-md bg-[var(--surface-muted)]" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function DashboardErrorState({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--danger)]">
          Sync failed
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Sensor data unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{message}</p>
      </div>
    </main>
  );
}

export default function DashboardData() {
  const { data, error, isLoading, isValidating } = useSWR(
    DASHBOARD_DATA_URL,
    fetchSensorData,
    {
      dedupingInterval: 30000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      keepPreviousData: true,
      refreshInterval: 60000,
      revalidateOnFocus: false,
    },
  );

  if (error) {
    return <DashboardErrorState message={error.message} />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return <DashboardView data={data ?? []} isRefreshing={isValidating} />;
}
