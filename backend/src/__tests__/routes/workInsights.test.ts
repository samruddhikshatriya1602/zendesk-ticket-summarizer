jest.mock('../../services/zendeskService', () => {
  const actual = jest.requireActual('../../services/zendeskService');
  return {
    ...actual,
    fetchAllTicketSnapshots: jest.fn(),
  };
});

jest.mock('../../services/aiGatewayService', () => ({
  generateWorkInsights: jest.fn(),
  AiGatewayError: jest.requireActual('../../services/aiGatewayService').AiGatewayError,
}));

import request from 'supertest';
import app from '../../index';
import * as zendeskService from '../../services/zendeskService';
import * as aiGatewayService from '../../services/aiGatewayService';
import { ZendeskError } from '../../services/zendeskService';
import { AiGatewayError } from '../../services/aiGatewayService';
import { WorkInsights } from '../../types';

const mockedFetchAllTicketSnapshots = jest.mocked(
  zendeskService.fetchAllTicketSnapshots
);
const mockedGenerateWorkInsights = jest.mocked(
  aiGatewayService.generateWorkInsights
);

function makeWorkInsights(overrides: Partial<WorkInsights> = {}): WorkInsights {
  return {
    headline: 'Summary of your work',
    summary: 'you have 2 high priority tickets about login failures.',
    themes: [{ count: 2, priority: 'high', theme: 'login failures' }],
    ...overrides,
  };
}

describe('GET /api/work-insights', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 200 with work insights when open/pending tickets exist', async () => {
    mockedFetchAllTicketSnapshots.mockResolvedValueOnce([
      { id: 1, subject: 'Login fails', status: 'open', priority: 'high' },
      { id: 2, subject: 'Login timeout', status: 'pending', priority: 'high' },
      { id: 3, subject: 'Old solved issue', status: 'solved', priority: 'low' },
    ]);
    mockedGenerateWorkInsights.mockResolvedValueOnce(makeWorkInsights());

    const res = await request(app).get('/api/work-insights');

    expect(res.status).toBe(200);
    expect(res.body.ticketCount).toBe(3);
    expect(res.body.analyzedCount).toBe(2);
    expect(res.body.generatedAt).toEqual(expect.any(String));
    expect(res.body.insights).toEqual(makeWorkInsights());
    expect(mockedGenerateWorkInsights).toHaveBeenCalledTimes(1);
  });

  it('returns empty insights without calling AI when no open/pending tickets exist', async () => {
    mockedFetchAllTicketSnapshots.mockResolvedValueOnce([
      { id: 1, subject: 'Closed issue', status: 'solved', priority: 'low' },
    ]);

    const res = await request(app).get('/api/work-insights');

    expect(res.status).toBe(200);
    expect(res.body.ticketCount).toBe(1);
    expect(res.body.analyzedCount).toBe(0);
    expect(res.body.insights.summary).toBe(
      'you have no open or pending tickets to analyze.'
    );
    expect(res.body.insights.themes).toEqual([]);
    expect(mockedGenerateWorkInsights).not.toHaveBeenCalled();
  });

  it('returns empty insights when Zendesk returns no tickets', async () => {
    mockedFetchAllTicketSnapshots.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/work-insights');

    expect(res.status).toBe(200);
    expect(res.body.ticketCount).toBe(0);
    expect(res.body.analyzedCount).toBe(0);
    expect(res.body.insights.themes).toEqual([]);
    expect(mockedGenerateWorkInsights).not.toHaveBeenCalled();
  });

  it('calls Zendesk and AI on each request', async () => {
    mockedFetchAllTicketSnapshots.mockResolvedValue([
      { id: 1, subject: 'Login fails', status: 'open', priority: 'high' },
    ]);
    mockedGenerateWorkInsights.mockResolvedValue(makeWorkInsights());

    await request(app).get('/api/work-insights');
    await request(app).get('/api/work-insights');

    expect(mockedFetchAllTicketSnapshots).toHaveBeenCalledTimes(2);
    expect(mockedGenerateWorkInsights).toHaveBeenCalledTimes(2);
  });

  it('returns 502 when Zendesk fetch fails', async () => {
    mockedFetchAllTicketSnapshots.mockRejectedValueOnce(
      new ZendeskError('ZENDESK_UNAUTHORIZED', 'Bad Zendesk credentials')
    );

    const res = await request(app).get('/api/work-insights');

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('ZENDESK_UNAUTHORIZED');
  });

  it('returns 502 when AI gateway fails', async () => {
    mockedFetchAllTicketSnapshots.mockResolvedValueOnce([
      { id: 1, subject: 'Login fails', status: 'open', priority: 'high' },
    ]);
    mockedGenerateWorkInsights.mockRejectedValueOnce(
      new AiGatewayError('AI_GATEWAY_FORBIDDEN', 'AI Gateway denied access')
    );

    const res = await request(app).get('/api/work-insights');

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_GATEWAY_FORBIDDEN');
  });
});
