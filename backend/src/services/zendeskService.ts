import {
  Ticket,
  TicketComment,
  TicketSnapshot,
  TicketsResponse,
} from '../types';
import {
  ZendeskCommentsResponse,
  ZendeskSearchResponse,
  ZendeskTicketResponse,
  ZendeskTicketsListResponse,
} from '../types/zendeskApi';
import { requireEnv } from '../utils/requireEnv';


// Custom error class for Zendesk API errors
export class ZendeskError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ZendeskError';
  }
}


// buildZendeskUrl(path) helper
function buildZendeskUrl(path: string): string {
    const subdomain = requireEnv('ZENDESK_SUBDOMAIN');
    return `https://${subdomain}.zendesk.com/api/v2${path}`;
  }


// buildAuthHeader() helper
function buildAuthHeader(): string {
    // Read secrets from .env
    const email = requireEnv('ZENDESK_EMAIL');
    const token = requireEnv('ZENDESK_API_TOKEN');

    // Build credential string (Zendesk format)
    const credentials = `${email}/token:${token}`;

    // Base64 encode credentials
    const encoded = Buffer.from(credentials).toString('base64');

    // Return base64 encoded credentials as Basic Auth header
    return `Basic ${encoded}`;
    // This goes in: headers: { Authorization: buildAuthHeader() }
  }


  // MAPPER FUNCTIONS - Only this service talks to Zendesk raw JSON. Routes should receive already-clean Ticket objects.

  // mapZendeskTicket(raw) helper
  function mapZendeskTicket(raw: Record<string, unknown>): Ticket {
    return {
      id: raw.id as number,
      subject: (raw.subject as string) ?? '',
      description: (raw.description as string) ?? '',
      status: (raw.status as string) ?? 'unknown',
      priority: (raw.priority as string | null | undefined) ?? null,
      created_at: raw.created_at as string,
      updated_at: raw.updated_at as string,
    };
  }
  
  // mapZendeskComment(raw) helper
  function mapZendeskComment(raw: Record<string, unknown>): TicketComment {
    const body =
      (raw.body as string) ||
      (raw.plain_body as string) ||
      '';

    return {
      id: raw.id as number,
      author_id: raw.author_id as number,
      body,
      public: raw.public !== false,
      created_at: raw.created_at as string,
    };
  }

  // mapZendeskTicketSnapshot(raw) — lightweight fields for work insights only
  function mapZendeskTicketSnapshot(raw: Record<string, unknown>): TicketSnapshot {
    return {
      id: raw.id as number,
      subject: (raw.subject as string) ?? '',
      status: (raw.status as string) ?? 'unknown',
      priority: (raw.priority as string | null | undefined) ?? null,
    };
  }

  const WORK_INSIGHTS_ZENDESK_PAGE_SIZE = 100;
  const DEFAULT_WORK_INSIGHTS_MAX_TICKETS = 500;

  function getWorkInsightsMaxTickets(): number {
    const raw = process.env.WORK_INSIGHTS_MAX_TICKETS;
    if (!raw || raw.trim() === '') {
      return DEFAULT_WORK_INSIGHTS_MAX_TICKETS;
    }

    const max = Number(raw);
    if (!Number.isFinite(max) || max <= 0) {
      return DEFAULT_WORK_INSIGHTS_MAX_TICKETS;
    }

    return Math.floor(max);
  }

  // buildListPath(perPage, afterCursor?) helper
  function buildListPath(perPage: number, afterCursor?: string): string {
    const params = new URLSearchParams();
    params.set('page[size]', String(perPage));
    params.set('sort_by', 'updated_at');
    params.set('sort_order', 'desc');
  
    if (afterCursor) {
      params.set('page[after]', afterCursor);
    }
  
    return `/tickets.json?${params.toString()}`;
  }

  export interface TicketSearchFilters {
    status?: string;
    priority?: string;
  }

  function escapeZendeskTerm(term: string): string {
    return term.replace(/[+:\-"\\*]/g, '\\$&');
  }

  function formatZendeskSearchTerm(term: string): string {
    const trimmed = term.trim();
    if (!trimmed) {
      return '';
    }

    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }

    if (/\s/.test(trimmed)) {
      const phrase = trimmed.replace(/"/g, '\\"');
      return `(subject:"${phrase}" OR description:"${phrase}")`;
    }

    const escaped = escapeZendeskTerm(trimmed);
    // Zendesk rejects unqualified wildcards (e.g. "veri*"). Qualify by field.
    return `subject:${escaped}*`;
  }

  export function buildTicketSearchQuery(
    query: string,
    filters: TicketSearchFilters = {}
  ): string {
    const parts = ['type:ticket'];
    const formattedTerm = formatZendeskSearchTerm(query);

    if (formattedTerm) {
      parts.push(formattedTerm);
    }

    const status = filters.status?.trim().toLowerCase();
    if (status && status !== 'all') {
      parts.push(`status:${status}`);
    }

    const priority = filters.priority?.trim().toLowerCase();
    if (priority && priority !== 'all') {
      parts.push(`priority:${priority}`);
    }

    return parts.join(' ');
  }

  function buildTicketSearchPath(
    query: string,
    page: number,
    perPage: number,
    filters: TicketSearchFilters = {}
  ): string {
    const params = new URLSearchParams();
    params.set('query', buildTicketSearchQuery(query, filters));
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    params.set('sort_by', 'updated_at');
    params.set('sort_order', 'desc');

    return `/search.json?${params.toString()}`;
  }



  // zendeskFetch(path) helper
  async function zendeskFetch<T>(path: string): Promise<T> {
    const url = buildZendeskUrl(path);
  
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: buildAuthHeader(),
          Accept: 'application/json',
        },
      });
    } catch {
      throw new ZendeskError(
        'ZENDESK_NETWORK_ERROR',
        'Could not reach Zendesk. Check your network connection.'
      );
    }
  
    if (response.ok) {
      return response.json() as Promise<T>;
    }
  
    if (response.status === 401) {
      throw new ZendeskError(
        'ZENDESK_UNAUTHORIZED',
        'Could not authenticate with Zendesk. Check ZENDESK_EMAIL, ZENDESK_API_TOKEN, and ZENDESK_SUBDOMAIN in backend .env.'
      );
    }
  
    if (response.status === 404) {
      throw new ZendeskError('TICKET_NOT_FOUND', 'Ticket not found.');
    }
  
    if (response.status === 429) {
      throw new ZendeskError(
        'ZENDESK_RATE_LIMITED',
        'Zendesk rate limit reached. Please try again later.'
      );
    }
  
    throw new ZendeskError(
      'ZENDESK_ERROR',
      `Zendesk request failed with status ${response.status}.`
    );
  }


// SEARCH TICKETS SERVICE — Zendesk Search API across the whole account
  export async function searchTickets(
    query: string,
    page: number,
    perPage: number,
    filters: TicketSearchFilters = {}
  ): Promise<TicketsResponse> {
    const data = await zendeskFetch<ZendeskSearchResponse>(
      buildTicketSearchPath(query, page, perPage, filters)
    );
    const tickets: Ticket[] = [];

    for (const raw of (data.results as Record<string, unknown>[]) ?? []) {
      if (raw.result_type && raw.result_type !== 'ticket') {
        continue;
      }

      tickets.push(mapZendeskTicket(raw));
    }

    return {
      tickets,
      meta: {
        page,
        per_page: perPage,
        has_more: Boolean(data.next_page),
      },
    };
  }


// LIST TICKETS SERVICE
  export async function listTickets(
    page: number,
    perPage: number,
    afterCursor?: string
  ): Promise<TicketsResponse> {
    let cursor = afterCursor;

    if (!cursor) {
      for (let i = 1; i < page; i++) {
        const data = await zendeskFetch<ZendeskTicketsListResponse>(
          buildListPath(perPage, cursor)
        );
      
        if (!data.meta?.has_more) {
          return {
            tickets: [],
            meta: {
              page,
              per_page: perPage,
              has_more: false,
            },
          };
        }

        const nextCursor = data.meta.after_cursor;
        if (typeof nextCursor !== 'string' || nextCursor.trim() === '') {
          return {
            tickets: [],
            meta: {
              page,
              per_page: perPage,
              has_more: false,
            },
          };
        }
      
        cursor = nextCursor;
      }
    }

      const data = await zendeskFetch<ZendeskTicketsListResponse>(
        buildListPath(perPage, cursor)
      );

      // Normalize Tickets
      const tickets = (data.tickets as Record<string, unknown>[]).map(mapZendeskTicket);

      // Return normalized tickets and pagination metadata
      return {
        tickets,
        meta: {
          page,
          per_page: perPage,
          has_more: data.meta?.has_more ?? false,
          ...(data.meta?.after_cursor ? { next_cursor: data.meta.after_cursor } : {}),
        },
      };

  }



  // FETCH ALL TICKET SNAPSHOTS — for work insights (subject, status, priority only)
  export async function fetchAllTicketSnapshots(): Promise<TicketSnapshot[]> {
    const maxTickets = getWorkInsightsMaxTickets();
    const snapshots: TicketSnapshot[] = [];
    let cursor: string | undefined;

    while (snapshots.length < maxTickets) {
      const remaining = maxTickets - snapshots.length;
      const pageSize = Math.min(WORK_INSIGHTS_ZENDESK_PAGE_SIZE, remaining);
      const data = await zendeskFetch<ZendeskTicketsListResponse>(
        buildListPath(pageSize, cursor)
      );
      const tickets = (data.tickets as Record<string, unknown>[]) ?? [];

      for (const raw of tickets) {
        snapshots.push(mapZendeskTicketSnapshot(raw));
        if (snapshots.length >= maxTickets) {
          break;
        }
      }

      if (!data.meta?.has_more || tickets.length === 0) {
        break;
      }

      const nextCursor = data.meta.after_cursor;
      if (typeof nextCursor !== 'string' || nextCursor.trim() === '') {
        break;
      }

      cursor = nextCursor;
    }

    return snapshots;
  }


  // FETCH ONE TICKET + ITS CONVERSATION SERVICE
  export async function getTicketById(id: number): Promise<Ticket> {
    const data = await zendeskFetch<ZendeskTicketResponse>(`/tickets/${id}.json`);
    return mapZendeskTicket(data.ticket as Record<string, unknown>);
  }


  // FETCH TICKET COMMENTS SERVICE
  export async function getTicketComments(id: number): Promise<TicketComment[]> {
    const data = await zendeskFetch<ZendeskCommentsResponse>(
      `/tickets/${id}/comments.json`
    );
    const comments = data.comments as Record<string, unknown>[];
    return comments.map(mapZendeskComment);
  }