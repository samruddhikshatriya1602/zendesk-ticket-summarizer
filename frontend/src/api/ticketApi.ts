// ticketApi.ts — all frontend HTTP calls to the Express backend (port 3001).
// Hooks/components use these functions; they never call fetch() directly.

import type {
  TicketDetailResponse,
  TicketsResponse,
  SummaryResponse,
  WorkInsightsResponse,
} from '../types';
import type { PriorityFilter, StatusFilter } from '../utils/filterTickets';
import {
  DEFAULT_TIMEOUT_MS,
  WORK_INSIGHTS_TIMEOUT_MS,
} from '../constants/timeouts';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export interface FetchTicketsOptions {
  q?: string;
  status?: StatusFilter;
  priority?: PriorityFilter;
}

// fetch + auto-abort if the server doesn't respond within timeoutMs.
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

// Parse JSON body; throw a readable Error if status is not 2xx.
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

// GET /api/tickets?page=&per_page= — used by useTickets (Workflow A).
// When options.q is set, backend uses Zendesk Search API (account-wide).
export async function fetchTickets(
  page: number,
  perPage: number,
  options: FetchTicketsOptions = {}
): Promise<TicketsResponse> {
  const url = new URL('/api/tickets', BASE_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(perPage));

  const query = options.q?.trim();
  if (query) {
    url.searchParams.set('q', query);

    if (options.status && options.status !== 'all') {
      url.searchParams.set('status', options.status);
    }

    if (options.priority && options.priority !== 'all') {
      url.searchParams.set('priority', options.priority);
    }
  }

  const response = await fetchWithTimeout(url.toString());

  return handleResponse<TicketsResponse>(response);
}

// GET /api/tickets/:id — ticket + comments for the detail panel.
export async function fetchTicketById(
  id: number
): Promise<TicketDetailResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/api/tickets/${id}`);

  return handleResponse<TicketDetailResponse>(response);
}

// POST /api/tickets/:id/summary — AI summary (longer timeout for generation).
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

// GET /api/work-insights — queue-level AI summary above the ticket search bar.
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
