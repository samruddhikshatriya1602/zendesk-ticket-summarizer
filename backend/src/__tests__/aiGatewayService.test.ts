import { generateSummary, AiGatewayError } from '../services/aiGatewayService';
import { TicketSummary } from '../types';

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

function mockJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
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

describe('aiGatewayService', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;

    process.env.AI_GATEWAY_API_KEY = 'fake-test-key';
    process.env.AI_GATEWAY_BASE_URL = 'https://ai-gateway.zende.sk/v1';
    process.env.AI_GATEWAY_MODEL = 'test-model';
  });

  // Test 1: valid JSON
  it('returns TicketSummary when AI returns valid JSON', async () => {
    const fakeSummary = makeSummary({ mainIssue: 'Payment failed' });
  
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockGatewayBody(JSON.stringify(fakeSummary)))
    );
  
    const result = await generateSummary('summarize this ticket');
  
    expect(result).toEqual(fakeSummary);
  });



  // Test 2: markdown fences
  it('parses JSON wrapped in markdown fences', async () => {
    const fakeSummary = makeSummary();
  
    const fencedContent = '```json\n' + JSON.stringify(fakeSummary) + '\n```';
  
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockGatewayBody(fencedContent))
    );
  
    const result = await generateSummary('summarize this ticket');
  
    expect(result).toEqual(fakeSummary);
  });



  // Test 3: 401
  it('throws AI_GATEWAY_UNAUTHORIZED on 401', async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ error: 'Unauthorized' }, 401)
    );
  
    await expect(generateSummary('summarize this ticket')).rejects.toMatchObject({
      code: 'AI_GATEWAY_UNAUTHORIZED',
    });
  });



  // Test 4: not JSON
  it('throws AI_INVALID_RESPONSE when content is not JSON', async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockGatewayBody('hello prose'))
    );
  
    await expect(generateSummary('summarize this ticket')).rejects.toMatchObject({
      code: 'AI_INVALID_RESPONSE',
    });
  });



  // Test 5: missing field
  it('throws AI_INVALID_RESPONSE when a required field is missing', async () => {
    const incomplete = {
      priorityAssessment: 'high',
      priorityReasoning: 'Urgent issue',
      currentStatus: 'open',
      recommendedNextSteps: ['Follow up'],
      // mainIssue intentionally omitted
    };
  
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse(mockGatewayBody(JSON.stringify(incomplete)))
    );
  
    await expect(generateSummary('summarize this ticket')).rejects.toMatchObject({
      code: 'AI_INVALID_RESPONSE',
    });
  });
});