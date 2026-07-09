// types/index.ts — TypeScript shapes for API data (frontend ↔ backend contract).
// Raw Zendesk JSON is normalized on the backend; these are the only fields the UI uses.

// --- Ticket list & detail (Workflow A) ---

/** One ticket after backend normalization (7 fields; Zendesk raw has 50+). */
export interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string | null; // Zendesk allows null → UI shows "None"
  created_at: string; // ISO 8601, e.g. "2026-07-01T10:00:00Z"
  updated_at: string;
}

/** One comment on a ticket thread (detail panel). */
export interface TicketComment {
  id: number;
  author_id: number;
  body: string;
  public: boolean; // false = internal agent note
  created_at: string;
}

/** GET /api/tickets — used by fetchTickets / useTickets. */
export interface TicketsResponse {
  tickets: Ticket[];
  meta: {
    page: number;
    per_page: number;
    has_more: boolean; // drives Pagination "Next" button
    next_cursor?: string; // backend only; frontend uses page numbers
  };
}

/** GET /api/tickets/:id — ticket + comments for TicketDetailPanel. */
export interface TicketDetailResponse {
  ticket: Ticket;
  comments: TicketComment[];
}

/** Error body when response.ok is false (see ticketApi.handleResponse). */
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// --- AI ticket summary (detail panel) ---

/** Five fields returned by POST /api/tickets/:id/summary. */
export interface TicketSummary {
  mainIssue: string;
  priorityAssessment: string;
  priorityReasoning: string;
  currentStatus: string;
  recommendedNextSteps: string[];
}

/** POST /api/tickets/:id/summary — success response. */
export interface SummaryResponse {
  ticketId: number;
  cached: boolean; // true = served from cache, no new AI call
  generatedAt: string;
  summary: TicketSummary;
}

/** POST body — omit or send {} normally; forceRefresh skips cache. */
export interface SummaryRequestBody {
  forceRefresh?: boolean;
}

// --- Work insights (queue-level AI summary above search bar) ---

/** One recurring issue theme grouped by priority. */
export interface WorkInsightTheme {
  count: number;
  priority: string;
  theme: string;
}

/**
 * AI-generated work insights shown below the ticket search bar.
 * headline is always "Summary of your work".
 * summary is one sentence starting with "you have", max ~25 words.
 * themes has 1–3 items, most urgent first.
 */
export interface WorkInsights {
  headline: string;
  summary: string;
  themes: WorkInsightTheme[];
}

/** GET /api/work-insights — success response. */
export interface WorkInsightsResponse {
  ticketCount: number;
  analyzedCount: number;
  generatedAt: string;
  insights: WorkInsights;
}
