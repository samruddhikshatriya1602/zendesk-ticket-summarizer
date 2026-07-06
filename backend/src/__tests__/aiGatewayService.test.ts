import {
  generateSummary,
  generateWorkInsights,
  parseWorkInsights,
  AiGatewayError,
} from '../services/aiGatewayService';
import { TicketSummary, WorkInsights } from '../types';

function makeSummary(overrides: Partial<TicketSummary> = {}): TicketSummary {
  return {
    mainIssue: 'Login broken',
    priorityAssessment: 'high',
    priorityReasoning: 'Customer cannot access account',
    currentStatus: 'open',
    recommendedNextSteps: ['Reset password', 'Verify email'],
    ...overrides,
  };
}

function makeWorkInsights(overrides: Partial<WorkInsights> = {}): WorkInsights {
  return {
    headline: 'Summary of your work',
    summary:
      'you have 10 high priority tickets about login failures and 5 normal priority tickets about billing errors.',
    themes: [
      { count: 10, priority: 'high', theme: 'login failures' },
      { count: 5, priority: 'normal', theme: 'billing errors' },
    ],
    ...overrides,
  };
}

function mockJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

function mockGatewayBody(content: string) {
  return {
    choices: [
      {
        message: { content },
      },
    ],
  };
}

function mockBedrockBody(text: string) {
  return {
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text }],
  };
}

describe('aiGatewayService', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;

    process.env.AI_GATEWAY_API_KEY = 'fake-test-key';
    process.env.AI_GATEWAY_BEDROCK_BASE_URL = 'https://ai-gateway.zende.sk/bedrock';
    process.env.AI_GATEWAY_MODEL = 'us.anthropic.claude-sonnet-4-6';
    process.env.AI_GATEWAY_MODEL_WORK_INSIGHTS = 'us.anthropic.claude-sonnet-4-6';
  });

  it('uses AI_GATEWAY_MODEL for ticket summaries via Bedrock', async () => {
    const fakeSummary = makeSummary();

    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockBedrockBody(JSON.stringify(fakeSummary)))
    );

    await generateSummary('summarize this ticket');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe(
      'https://ai-gateway.zende.sk/bedrock/model/us.anthropic.claude-sonnet-4-6/invoke'
    );
  });

  it('returns TicketSummary when AI returns valid JSON', async () => {
    const fakeSummary = makeSummary({ mainIssue: 'Payment failed' });

    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockBedrockBody(JSON.stringify(fakeSummary)))
    );

    const result = await generateSummary('summarize this ticket');

    expect(result).toEqual(fakeSummary);
  });

  it('parses JSON wrapped in markdown fences', async () => {
    const fakeSummary = makeSummary();

    const fencedContent = '```json\n' + JSON.stringify(fakeSummary) + '\n```';

    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockBedrockBody(fencedContent))
    );

    const result = await generateSummary('summarize this ticket');

    expect(result).toEqual(fakeSummary);
  });

  it('does not use OpenAI chat completions for ticket summaries', async () => {
    const fakeSummary = makeSummary();

    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockBedrockBody(JSON.stringify(fakeSummary)))
    );

    await generateSummary('summarize this ticket');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).not.toContain('/chat/completions');
  });

  it('throws AI_GATEWAY_UNAUTHORIZED on 401', async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ error: 'Unauthorized' }, 401)
    );

    await expect(generateSummary('summarize this ticket')).rejects.toMatchObject({
      code: 'AI_GATEWAY_UNAUTHORIZED',
    });
  });

  it('throws AI_INVALID_RESPONSE when content is not JSON', async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockBedrockBody('hello prose'))
    );

    await expect(generateSummary('summarize this ticket')).rejects.toMatchObject({
      code: 'AI_INVALID_RESPONSE',
    });
  });

  it('throws AI_INVALID_RESPONSE when a required field is missing', async () => {
    const incomplete = {
      priorityAssessment: 'high',
      priorityReasoning: 'Urgent issue',
      currentStatus: 'open',
      recommendedNextSteps: ['Follow up'],
    };

    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockBedrockBody(JSON.stringify(incomplete)))
    );

    await expect(generateSummary('summarize this ticket')).rejects.toMatchObject({
      code: 'AI_INVALID_RESPONSE',
    });
  });

  describe('generateWorkInsights', () => {
    it('returns WorkInsights when Bedrock returns valid JSON', async () => {
      const fakeInsights = makeWorkInsights();

      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(mockBedrockBody(JSON.stringify(fakeInsights)))
      );

      const result = await generateWorkInsights('analyze this queue');

      expect(result).toEqual(fakeInsights);
    });

    it('calls Bedrock invoke URL with Claude model from env', async () => {
      const fakeInsights = makeWorkInsights();

      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(mockBedrockBody(JSON.stringify(fakeInsights)))
      );

      await generateWorkInsights('analyze this queue');

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        'https://ai-gateway.zende.sk/bedrock/model/us.anthropic.claude-sonnet-4-6/invoke'
      );

      const requestBody = JSON.parse(init.body as string);
      expect(requestBody.anthropic_version).toBe('bedrock-2023-05-31');
      expect(requestBody.max_tokens).toBeGreaterThan(0);
      expect(requestBody.messages[0].content[0].text).toBe('analyze this queue');
      expect(requestBody.model).toBeUndefined();
    });

    it('does not use OpenAI chat completions for work insights', async () => {
      const fakeInsights = makeWorkInsights();

      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(mockBedrockBody(JSON.stringify(fakeInsights)))
      );

      await generateWorkInsights('analyze this queue');

      const [url] = mockFetch.mock.calls[0] as [string];
      expect(url).not.toContain('/chat/completions');
    });

    it('parses work insights JSON wrapped in markdown fences', async () => {
      const fakeInsights = makeWorkInsights();
      const fencedContent =
        '```json\n' + JSON.stringify(fakeInsights) + '\n```';

      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(mockBedrockBody(fencedContent))
      );

      const result = await generateWorkInsights('analyze this queue');

      expect(result).toEqual(fakeInsights);
    });

    it('throws AI_INVALID_RESPONSE when headline is wrong', async () => {
      const invalid = makeWorkInsights({ headline: 'Wrong headline' });

      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(mockBedrockBody(JSON.stringify(invalid)))
      );

      await expect(generateWorkInsights('analyze this queue')).rejects.toMatchObject({
        code: 'AI_INVALID_RESPONSE',
      });
    });
  });

  describe('parseWorkInsights', () => {
    it('accepts valid work insights JSON', () => {
      const result = parseWorkInsights({
        headline: 'Summary of your work',
        summary:
          'you have 5 high priority tickets about login failures and 3 normal priority tickets about billing.',
        themes: [
          { count: 5, priority: 'high', theme: 'login failures' },
          { count: 3, priority: 'normal', theme: 'billing' },
        ],
      });

      expect(result).toEqual({
        headline: 'Summary of your work',
        summary:
          'you have 5 high priority tickets about login failures and 3 normal priority tickets about billing.',
        themes: [
          { count: 5, priority: 'high', theme: 'login failures' },
          { count: 3, priority: 'normal', theme: 'billing' },
        ],
      });
    });

    it('accepts an empty themes array for an empty queue', () => {
      const result = parseWorkInsights({
        headline: 'Summary of your work',
        summary: 'you have no open or pending tickets to analyze.',
        themes: [],
      });

      expect(result.themes).toEqual([]);
    });

    it('rejects summary that does not start with "you have"', () => {
      expect(() =>
        parseWorkInsights({
          headline: 'Summary of your work',
          summary: 'There are 10 high priority tickets about login failures.',
          themes: [{ count: 10, priority: 'high', theme: 'login failures' }],
        })
      ).toThrow(AiGatewayError);
    });

    it('rejects non-object JSON', () => {
      expect(() => parseWorkInsights('not an object')).toThrow(AiGatewayError);
    });

    it('rejects invalid theme priority such as mixed', () => {
      expect(() =>
        parseWorkInsights({
          headline: 'Summary of your work',
          summary: 'you have 10 mixed priority tickets about login.',
          themes: [{ count: 10, priority: 'mixed', theme: 'login' }],
        })
      ).toThrow(AiGatewayError);
    });

    it('rejects more than 3 themes', () => {
      expect(() =>
        parseWorkInsights({
          headline: 'Summary of your work',
          summary: 'you have 4 groups of tickets.',
          themes: [
            { count: 1, priority: 'high', theme: 'a' },
            { count: 2, priority: 'high', theme: 'b' },
            { count: 3, priority: 'normal', theme: 'c' },
            { count: 4, priority: 'low', theme: 'd' },
          ],
        })
      ).toThrow(AiGatewayError);
    });

    it('rejects theme counts that exceed analyzedCount', () => {
      expect(() =>
        parseWorkInsights(
          {
            headline: 'Summary of your work',
            summary: 'you have 10 high priority tickets about login.',
            themes: [{ count: 10, priority: 'high', theme: 'login' }],
          },
          5
        )
      ).toThrow(AiGatewayError);
    });

    it('accepts theme counts within analyzedCount', () => {
      const result = parseWorkInsights(
        {
          headline: 'Summary of your work',
          summary: 'you have 5 high priority tickets about login.',
          themes: [{ count: 5, priority: 'high', theme: 'login' }],
        },
        5
      );

      expect(result.themes[0].count).toBe(5);
    });
  });
});
