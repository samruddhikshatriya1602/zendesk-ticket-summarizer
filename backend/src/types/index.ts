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