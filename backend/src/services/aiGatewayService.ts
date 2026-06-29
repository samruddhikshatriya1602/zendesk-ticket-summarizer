import { TicketSummary } from '../types';

export class AiGatewayError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AiGatewayError';
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function buildGatewayUrl(): string {
  const base = requireEnv('AI_GATEWAY_BASE_URL').replace(/\/$/, '');
  return `${base}/chat/completions`;
}

function buildAuthHeader(): string {
  return `Bearer ${requireEnv('AI_GATEWAY_API_KEY')}`;
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      `AI response field "${fieldName}" is missing or invalid.`
    );
  }
  return value.trim();
}

function parseTicketSummary(raw: unknown): TicketSummary {
  if (typeof raw !== 'object' || raw === null) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI response is not a JSON object.'
    );
  }

  const obj = raw as Record<string, unknown>;

  const mainIssue = requireNonEmptyString(obj.mainIssue, 'mainIssue');
  const priorityAssessment = requireNonEmptyString(
    obj.priorityAssessment,
    'priorityAssessment'
  );
  const priorityReasoning = requireNonEmptyString(
    obj.priorityReasoning,
    'priorityReasoning'
  );
  const currentStatus = requireNonEmptyString(obj.currentStatus, 'currentStatus');

  const steps = obj.recommendedNextSteps;
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI response field "recommendedNextSteps" is missing or invalid.'
    );
  }

  const recommendedNextSteps = steps.map((step, index) =>
    requireNonEmptyString(step, `recommendedNextSteps[${index}]`)
  );

  return {
    mainIssue,
    priorityAssessment,
    priorityReasoning,
    currentStatus,
    recommendedNextSteps,
  };
}

async function gatewayFetch(prompt: string): Promise<unknown> {
  const model = process.env.AI_GATEWAY_MODEL ?? 'anthropic/claude-sonnet-4';

  let response: Response;
  try {
    response = await fetch(buildGatewayUrl(), {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new AiGatewayError(
      'AI_GATEWAY_UNAVAILABLE',
      'Could not reach AI Gateway. Please try again later.'
    );
  }

  if (response.status === 401) {
    throw new AiGatewayError(
      'AI_GATEWAY_UNAUTHORIZED',
      'Could not authenticate with AI Gateway. Check AI_GATEWAY_API_KEY in backend .env.'
    );
  }

  if (!response.ok) {
    throw new AiGatewayError(
      'AI_GATEWAY_UNAVAILABLE',
      `AI Gateway request failed with status ${response.status}.`
    );
  }

  return response.json();
}

export async function generateSummary(prompt: string): Promise<TicketSummary> {
  const data = await gatewayFetch(prompt);

  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || content.trim() === '') {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI Gateway returned an empty response.'
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI returned text that is not valid JSON.'
    );
  }

  return parseTicketSummary(parsed);
}