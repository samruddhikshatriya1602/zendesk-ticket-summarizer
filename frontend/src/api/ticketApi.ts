import type {
  TicketDetailResponse,
  TicketsResponse,
  SummaryResponse,
  WorkInsightsResponse,
} from '../types';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

const DEFAULT_TIMEOUT_MS = 60_000;
const WORK_INSIGHTS_TIMEOUT_MS = 120_000;

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  if (init.signal) {
    init.signal.addEventListener('abort', () => controller.abort(), {
      once: true,
    });
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const body = await response.json();

  if (!response.ok) {
    const err = body as { error?: { message?: string } };
    throw new Error(
      err.error?.message ?? 'Something went wrong. Please try again.'
    );
  }

  return body as T;
}

export async function fetchTickets(
  page: number,
  perPage: number
): Promise<TicketsResponse> {
  const url = new URL('/api/tickets', BASE_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(perPage));

  const response = await fetchWithTimeout(url.toString());

  return handleResponse<TicketsResponse>(response);
}

export async function fetchTicketById(
  id: number
): Promise<TicketDetailResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/tickets/${id}`);

  return handleResponse<TicketDetailResponse>(response);
}

export async function fetchSummary(
  id: number,
  forceRefresh = false
): Promise<SummaryResponse> {
  const body = forceRefresh ? { forceRefresh: true } : {};

  const response = await fetchWithTimeout(
    `${BASE_URL}/api/tickets/${id}/summary`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    },
    WORK_INSIGHTS_TIMEOUT_MS
  );

  return handleResponse<SummaryResponse>(response);
}

export async function fetchWorkInsights(
  signal?: AbortSignal
): Promise<WorkInsightsResponse> {
  const response = await fetchWithTimeout(
    `${BASE_URL}/api/work-insights`,
    { signal },
    WORK_INSIGHTS_TIMEOUT_MS
  );

  return handleResponse<WorkInsightsResponse>(response);
}
