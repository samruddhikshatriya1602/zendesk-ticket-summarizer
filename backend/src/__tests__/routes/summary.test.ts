jest.mock('../../services/zendeskService', () => {
  const actual = jest.requireActual('../../services/zendeskService');
  return {
    ...actual,
    getTicketById: jest.fn(),
    getTicketComments: jest.fn(),
  };
});

jest.mock('../../services/aiGatewayService', () => ({
  generateSummary: jest.fn(),
  AiGatewayError: jest.requireActual('../../services/aiGatewayService').AiGatewayError,
}));

jest.mock('../../services/summaryCache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn(),
}));

import request from 'supertest';
import app from '../../index';
import * as zendeskService from '../../services/zendeskService';
import * as aiGatewayService from '../../services/aiGatewayService';
import * as summaryCache from '../../services/summaryCache';
import { ZendeskError } from '../../services/zendeskService';
import { AiGatewayError } from '../../services/aiGatewayService';
import { Ticket, TicketComment, TicketSummary } from '../../types';

const mockedGetTicketById = jest.mocked(zendeskService.getTicketById);
const mockedGetTicketComments = jest.mocked(zendeskService.getTicketComments);
const mockedGenerateSummary = jest.mocked(aiGatewayService.generateSummary);
const mockedCacheGet = jest.mocked(summaryCache.get);
const mockedCacheSet = jest.mocked(summaryCache.set);

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 42,
    subject: 'Login not working',
    description: 'Cannot reset password',
    status: 'open',
    priority: 'high',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-02T14:00:00Z',
    ...overrides,
  };
}

function makeComment(overrides: Partial<TicketComment> = {}): TicketComment {
  return {
    id: 1001,
    author_id: 99,
    body: 'Still cannot log in',
    public: true,
    created_at: '2026-06-02T12:00:00Z',
    ...overrides,
  };
}

function makeSummary(overrides: Partial<TicketSummary> = {}): TicketSummary {
  return {
    mainIssue: 'Login broken',
    priorityAssessment: 'high',
    priorityReasoning: 'Customer blocked from account',
    currentStatus: 'open',
    recommendedNextSteps: ['Reset password', 'Verify email'],
    ...overrides,
  };
}

function mockZendeskSuccess(ticket = makeTicket(), comments = [makeComment()]) {
  mockedGetTicketById.mockResolvedValueOnce(ticket);
  mockedGetTicketComments.mockResolvedValueOnce(comments);
}

describe('POST /api/tickets/:id/summary', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 200 with fresh summary when cache misses', async () => {
    mockedCacheGet.mockReturnValueOnce(null);
    mockZendeskSuccess();
    mockedGenerateSummary.mockResolvedValueOnce(
      makeSummary({ mainIssue: 'Payment failed' })
    );

    const res = await request(app).post('/api/tickets/42/summary').send({});

    expect(res.status).toBe(200);
    expect(res.body.ticketId).toBe(42);
    expect(res.body.cached).toBe(false);
    expect(res.body.generatedAt).toBeDefined();
    expect(res.body.summary).toEqual(
      expect.objectContaining({
        mainIssue: 'Payment failed',
        priorityAssessment: expect.any(String),
        priorityReasoning: expect.any(String),
        currentStatus: expect.any(String),
        recommendedNextSteps: expect.arrayContaining([expect.any(String)]),
      })
    );
    expect(mockedGenerateSummary).toHaveBeenCalledTimes(1);
    expect(mockedCacheSet).toHaveBeenCalledWith(
      42,
      '2026-06-02T14:00:00Z',
      expect.objectContaining({ mainIssue: 'Payment failed' })
    );
  });

  it('returns 200 with cached summary without calling AI', async () => {
    const fakeSummary = makeSummary();
    mockZendeskSuccess();
    mockedCacheGet.mockReturnValueOnce({
      summary: fakeSummary,
      generatedAt: '2026-06-02T15:00:00Z',
    });

    const res = await request(app).post('/api/tickets/42/summary').send({});

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(true);
    expect(res.body.generatedAt).toBe('2026-06-02T15:00:00Z');
    expect(res.body.summary).toEqual(fakeSummary);
    expect(mockedGenerateSummary).not.toHaveBeenCalled();
    expect(mockedCacheSet).not.toHaveBeenCalled();
  });

  it('calls AI when forceRefresh is true even if cache would hit', async () => {
    mockZendeskSuccess();
    mockedCacheGet.mockReturnValueOnce({
      summary: makeSummary(),
      generatedAt: '2026-06-02T15:00:00Z',
    });
    mockedGenerateSummary.mockResolvedValueOnce(
      makeSummary({ mainIssue: 'Refreshed issue' })
    );

    const res = await request(app)
      .post('/api/tickets/42/summary')
      .send({ forceRefresh: true });

    expect(res.status).toBe(200);
    expect(res.body.cached).toBe(false);
    expect(res.body.summary.mainIssue).toBe('Refreshed issue');
    expect(mockedGenerateSummary).toHaveBeenCalledTimes(1);
    expect(mockedCacheGet).not.toHaveBeenCalled();
    expect(mockedCacheSet).toHaveBeenCalled();
  });

  it('returns 400 when ticket id is invalid', async () => {
    const res = await request(app).post('/api/tickets/abc/summary').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toMatch(/ticket id/i);
    expect(mockedGetTicketById).not.toHaveBeenCalled();
    expect(mockedGenerateSummary).not.toHaveBeenCalled();
  });

  it('returns 404 when ticket is not found', async () => {
    mockedGetTicketById.mockRejectedValueOnce(
      new ZendeskError('TICKET_NOT_FOUND', 'Ticket not found.')
    );
    mockedGetTicketComments.mockResolvedValueOnce([]);

    const res = await request(app).post('/api/tickets/999/summary').send({});

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({
      code: 'TICKET_NOT_FOUND',
      message: 'Ticket not found.',
    });
    expect(mockedGenerateSummary).not.toHaveBeenCalled();
  });

  it('returns 502 when AI Gateway returns invalid response', async () => {
    mockedCacheGet.mockReturnValueOnce(null);
    mockZendeskSuccess();
    mockedGenerateSummary.mockRejectedValueOnce(
      new AiGatewayError(
        'AI_INVALID_RESPONSE',
        'AI returned text that is not valid JSON.'
      )
    );

    const res = await request(app).post('/api/tickets/42/summary').send({});

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_INVALID_RESPONSE');
    expect(res.body.error.message).toMatch(/not valid JSON/i);
  });
});
