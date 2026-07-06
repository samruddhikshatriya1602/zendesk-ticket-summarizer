import { Router, Request, Response, NextFunction } from 'express';
import { getTicketById, getTicketComments, ZendeskError } from '../services/zendeskService';
import { buildSummaryPrompt } from '../services/buildSummaryPrompt';
import { get as getCachedSummary, set as setCachedSummary } from '../services/summaryCache';
import { generateSummary, AiGatewayError } from '../services/aiGatewayService';
import { SummaryResponse } from '../types';

// Validate ID
function parseTicketId(value: unknown): number | null {
  const str = Array.isArray(value) ? value[0] : value;
  const id = Number(str);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

// Send Zendesk error
function sendZendeskError(err: unknown, res: Response): boolean {
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

// Send AI Gateway error
function sendAiGatewayError(err: unknown, res: Response): boolean {
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

// Create the router
const router = Router({ mergeParams: true });

// Summary route: POST /api/tickets/:id/summary
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Step 1: Validate ticket id
    const id = parseTicketId(req.params.id);
    if (id === null) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Ticket id must be a positive integer.' },
      });
    }

    // Step 2: Parse request body
    const forceRefresh = req.body?.forceRefresh === true;

    // Step 3: Fetch ticket + comments in parallel
    const [ticket, comments] = await Promise.all([
      getTicketById(id),
      getTicketComments(id),
    ]);

    // Step 4: Cache check
    if (!forceRefresh) {
      const cached = getCachedSummary(id, ticket.updated_at);
      if (cached) {
        const body: SummaryResponse = {
          ticketId: id,
          cached: true,
          generatedAt: cached.generatedAt,
          summary: cached.summary,
        };
        return res.status(200).json(body);
      }
    }

    // Step 5: Build prompt + call AI
    const prompt = buildSummaryPrompt(ticket, comments);
    const summary = await generateSummary(prompt);

    // Step 6: Store in cache
    const generatedAt = new Date().toISOString();
    setCachedSummary(id, ticket.updated_at, summary);

    // Step 7: Respond with fresh summary
    const body: SummaryResponse = {
      ticketId: id,
      cached: false,
      generatedAt,
      summary,
    };
    res.status(200).json(body);

  } catch (err) {
    if (sendZendeskError(err, res)) return;
    if (sendAiGatewayError(err, res)) return;
    // next(err) — "I don't know this error — pass to global error middleware":
    next(err);
  }
});

export default router;