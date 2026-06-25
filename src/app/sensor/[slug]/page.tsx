import { queryString } from "@/app/utils/queryString";
import type { SensorApiResponse } from "@/app/types/sensors";

interface ParamProps {
    params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function SensorPage({ params }: ParamProps) {
    const { slug } = await params;
    const queryObj = {
        action: 'read',
        sheet: slug,
        limit: 10,
    }
    let readings: SensorApiResponse[] = [];
    let errorMessage: string | null = null;

    try {
        readings = await queryString<SensorApiResponse[]>(queryObj);
    } catch (error) {
        errorMessage = error instanceof Error ? error.message : "Unable to load sensor data";
    }

    const latest = readings[0];

    return (
        <main className="min-h-dvh bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
            <section className="mx-auto w-full max-w-3xl rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <p className="text-sm font-medium text-[var(--muted)]">Sensor</p>
                <h1 className="mt-2 text-3xl font-semibold">{slug}</h1>

                {errorMessage ? (
                    <p className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--danger)]">
                        {errorMessage}
                    </p>
                ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs text-[var(--muted)]">Readings</p>
                            <p className="mt-1 text-2xl font-semibold">{readings.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)]">Temperature</p>
                            <p className="mt-1 text-2xl font-semibold">
                                {latest?.Temperature ?? "--"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)]">Humidity</p>
                            <p className="mt-1 text-2xl font-semibold">
                                {latest?.Humidity ?? latest?.PH ?? "--"}
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </main>
    )
}
