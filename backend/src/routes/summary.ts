import { Router, Request, Response, NextFunction } from 'express';
import { getTicketById, getTicketComments } from '../services/zendeskService';
import { buildSummaryPrompt } from '../services/buildSummaryPrompt';
import { get as getCachedSummary, set as setCachedSummary } from '../services/summaryCache';
import { generateSummary } from '../services/aiGatewayService';
import { SummaryResponse } from '../types';
import {
  parseTicketId,
  sendAiGatewayError,
  sendZendeskError,
} from '../utils/routeHelpers';

const router = Router({ mergeParams: true });

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseTicketId(req.params.id);
    if (id === null) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Ticket id must be a positive integer.' },
      });
    }

    const forceRefresh = req.body?.forceRefresh === true;

    const [ticket, comments] = await Promise.all([
      getTicketById(id),
      getTicketComments(id),
    ]);

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

    const prompt = buildSummaryPrompt(ticket, comments);
    const summary = await generateSummary(prompt);

    const generatedAt = new Date().toISOString();
    setCachedSummary(id, ticket.updated_at, summary);

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
    next(err);
  }
});

export default router;
