export interface ZendeskListMeta {
  has_more?: boolean;
  after_cursor?: string;
}

export interface ZendeskTicketsListResponse {
  tickets?: Record<string, unknown>[];
  meta?: ZendeskListMeta;
}

export interface ZendeskSearchResponse {
  results?: Record<string, unknown>[];
  next_page?: string | null;
}

export interface ZendeskTicketResponse {
  ticket?: Record<string, unknown>;
}

export interface ZendeskCommentsResponse {
  comments?: Record<string, unknown>[];
}

export type ZendeskApiResponse =
  | ZendeskTicketsListResponse
  | ZendeskSearchResponse
  | ZendeskTicketResponse
  | ZendeskCommentsResponse;
