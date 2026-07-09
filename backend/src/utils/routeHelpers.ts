import { Response } from 'express';
import { ZendeskError } from '../services/zendeskService';
import { AiGatewayError } from '../services/aiGatewayService';

export function parseTicketId(value: unknown): number | null {
  const str = Array.isArray(value) ? value[0] : value;
  const id = Number(str);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export function sendZendeskError(err: unknown, res: Response): boolean {
  if (!(err instanceof ZendeskError)) return false;

  const statusMap: Record<string, number> = {
    TICKET_NOT_FOUND: 404,
    ZENDESK_UNAUTHORIZED: 502,
    ZENDESK_RATE_LIMITED: 503,
    ZENDESK_NETWORK_ERROR: 503,
    ZENDESK_ERROR: 502,
  };

  const status = statusMap[err.code] ?? 502;

  res.status(status).json({
    error: {
      code: err.code,
      message: err.message,
    },
  });

  return true;
}

export function sendAiGatewayError(err: unknown, res: Response): boolean {
  if (!(err instanceof AiGatewayError)) return false;

  const statusMap: Record<string, number> = {
    AI_GATEWAY_UNAUTHORIZED: 502,
    AI_GATEWAY_FORBIDDEN: 502,
    AI_GATEWAY_UNAVAILABLE: 503,
    AI_INVALID_RESPONSE: 502,
    AI_GATEWAY_ERROR: 502,
  };

  const status = statusMap[err.code] ?? 502;
  res.status(status).json({ error: { code: err.code, message: err.message } });
  return true;
}
