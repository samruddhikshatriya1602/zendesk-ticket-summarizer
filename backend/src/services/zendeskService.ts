// Imports
import {
  Ticket,
  TicketComment,
  TicketsResponse,
} from '../types';


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


// requireEnv(name) helper
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim() === '') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
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



  // zendeskFetch(path) helper
  async function zendeskFetch(path: string): Promise<any> {
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
      return response.json();
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


// LIST TICKETS SERVICE
  export async function listTickets(
    page: number,
    perPage: number
  ): Promise<TicketsResponse> {
    let cursor: string | undefined;

    for (let i = 1; i < page; i++) {
        const data = await zendeskFetch(buildListPath(perPage, cursor));
      
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
      
        cursor = data.meta.after_cursor;
      }

      // fetch the actual requested page
      const data = await zendeskFetch(buildListPath(perPage, cursor));

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



  // FETCH ONE TICKET + ITS CONVERSATION SERVICE
  export async function getTicketById(id: number): Promise<Ticket> {
    const data = await zendeskFetch(`/tickets/${id}.json`);
    return mapZendeskTicket(data.ticket as Record<string, unknown>);
  }


  // 
  export async function getTicketComments(id: number): Promise<TicketComment[]> {
    const data = await zendeskFetch(`/tickets/${id}/comments.json`);
    const comments = data.comments as Record<string, unknown>[];
    return comments.map(mapZendeskComment);
  }