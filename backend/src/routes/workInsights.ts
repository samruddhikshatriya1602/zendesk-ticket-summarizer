import { Router, Request, Response, NextFunction } from 'express';
import { generateWorkInsights, AiGatewayError } from '../services/aiGatewayService';
import { buildWorkInsightsPrompt } from '../services/buildWorkInsightsPrompt';
import { prepareSnapshotsForAi } from '../services/workInsightsSnapshots';
import { fetchAllTicketSnapshots, ZendeskError } from '../services/zendeskService';
import { WorkInsights, WorkInsightsResponse } from '../types';

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

function buildEmptyWorkInsights(): WorkInsights {
  return {
    headline: 'Summary of your work',
    summary: 'you have no open or pending tickets to analyze.',
    themes: [],
  };
}

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshots = await fetchAllTicketSnapshots();
    const ticketCount = snapshots.length;
    const { forAi, analyzedCount } = prepareSnapshotsForAi(snapshots);
    const generatedAt = new Date().toISOString();

    if (forAi.length === 0) {
      const body: WorkInsightsResponse = {
        ticketCount,
        analyzedCount: 0,
        generatedAt,
        insights: buildEmptyWorkInsights(),
      };
      return res.status(200).json(body);
    }

    const prompt = buildWorkInsightsPrompt(forAi, {
      ticketCount,
      analyzedCount,
    });
    const insights = await generateWorkInsights(prompt, analyzedCount);

    const body: WorkInsightsResponse = {
      ticketCount,
      analyzedCount,
      generatedAt,
      insights,
    };

    res.status(200).json(body);
  } catch (err) {
    if (sendZendeskError(err, res)) return;
    if (sendAiGatewayError(err, res)) return;
    next(err);
  }
});

export default router;
