interface ErrorResponse {
  error?: string;
  message?: string;
}

type FetchFromSheetOptions = {
  action?: string;
  cacheBust?: boolean;
  limit?: number;
  query?: string;
  revalidate?: number;
  sheet?: string;
  tags?: string[];
  timeoutMs?: number;
};

const DEFAULT_SHEET_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby1GKJ3vWPFS8BjV8U6mxNNXmj5ZAdNTQBt4QMDAX7k6YfsPKp665sczrpBqQNB1sKE/exec";

export async function fetchFromSheet<T>({
  action,
  cacheBust = false,
  limit,
  query,
  revalidate = 30,
  sheet,
  tags,
  timeoutMs = 15000,
}: FetchFromSheetOptions): Promise<T> {
  const endpointUrl = new URL(
    process.env.SHEET_SCRIPT_URL ?? DEFAULT_SHEET_SCRIPT_URL,
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (query) {
      const searchParams = new URLSearchParams(query);
      searchParams.forEach((value, key) => endpointUrl.searchParams.set(key, value));
    }

    if (action) endpointUrl.searchParams.set("action", action);
    if (sheet) endpointUrl.searchParams.set("sheet", sheet);
    if (limit !== undefined) endpointUrl.searchParams.set("limit", String(limit));
    if (cacheBust) endpointUrl.searchParams.set("_t", String(Date.now()));

    const fetchOptions: RequestInit & {
      next?: { revalidate?: number; tags?: string[] };
    } = {
      signal: controller.signal,
    };

    if (revalidate > 0) {
      fetchOptions.next = tags?.length ? { revalidate, tags } : { revalidate };
    } else {
      fetchOptions.cache = "no-store";
    }

    const response = await fetch(endpointUrl, fetchOptions);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({} as ErrorResponse));
      const serverMessage = payload.message || payload.error;
      throw new Error(serverMessage || getErrorMessage(response.status));
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Sheet request timed out");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unexpected sheet request error");
  } finally {
    clearTimeout(timeout);
  }
}

function getErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "Invalid sheet request",
    401: "Sheet request is unauthorized",
    403: "Sheet request is forbidden",
    404: "Sheet data was not found",
    429: "Sheet service is rate limited",
    500: "Sheet service has a server error",
  };

  return messages[status] || `Sheet request failed (${status})`;
}
