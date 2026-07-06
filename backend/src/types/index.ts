// One normalized ticket
export interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string | null;
  created_at: string;
  updated_at: string;
}

// One message in the thread
export interface TicketComment {
  id: number;
  author_id: number;
  body: string;
  public: boolean;
  created_at: string;
}

// { tickets, meta } for list + pagination
export interface TicketsResponse {
  tickets: Ticket[];
  meta: {
    page: number;
    per_page: number;
    has_more: boolean;
    next_cursor?: string;
  };
}

// { ticket, comments } for single ticket + thread
export interface TicketDetailResponse {
  ticket: Ticket;
  comments: TicketComment[];
}

// { error: { code, message } }
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// AI-generated summary (exercise spec — 5 fields)
export interface TicketSummary {
  mainIssue: string;
  priorityAssessment: string;
  priorityReasoning: string;
  currentStatus: string;
  recommendedNextSteps: string[];
}

// POST /api/tickets/:id/summary — success response
export interface SummaryResponse {
  ticketId: number;
  cached: boolean;
  generatedAt: string;
  summary: TicketSummary;
}

// POST body (optional)
export interface SummaryRequestBody {
  forceRefresh?: boolean;
}

// --- Work insights (queue-level AI summary) ---

/** Minimal ticket fields used for work-insights analysis (token-efficient). */
export interface TicketSnapshot {
  id: number;
  subject: string;
  status: string;
  priority: string | null;
}

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

/** GET /api/work-insights — success response */
export interface WorkInsightsResponse {
  ticketCount: number;
  analyzedCount: number;
  generatedAt: string;
  insights: WorkInsights;
}
