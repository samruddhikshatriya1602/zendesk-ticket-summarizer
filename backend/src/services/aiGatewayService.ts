import { TicketSummary, WorkInsightTheme, WorkInsights } from '../types';
import { requireEnv } from '../utils/requireEnv';

export class AiGatewayError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AiGatewayError';
  }
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

const WORK_INSIGHTS_HEADLINE = 'Summary of your work';
const ALLOWED_THEME_PRIORITIES = new Set([
  'urgent',
  'high',
  'normal',
  'low',
]);

function requirePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      `AI response field "${fieldName}" must be a positive integer.`
    );
  }

  return value;
}

export function parseWorkInsights(
  raw: unknown,
  analyzedCount?: number
): WorkInsights {
  if (typeof raw !== 'object' || raw === null) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI response is not a JSON object.'
    );
  }

  const obj = raw as Record<string, unknown>;
  const headline = requireNonEmptyString(obj.headline, 'headline');

  if (headline !== WORK_INSIGHTS_HEADLINE) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      `AI response field "headline" must be exactly "${WORK_INSIGHTS_HEADLINE}".`
    );
  }

  const summary = requireNonEmptyString(obj.summary, 'summary');
  if (!summary.toLowerCase().startsWith('you have')) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI response field "summary" must start with "you have".'
    );
  }

  const themesRaw = obj.themes;
  if (!Array.isArray(themesRaw)) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI response field "themes" is missing or invalid.'
    );
  }

  if (themesRaw.length > 3) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI response field "themes" must contain at most 3 items.'
    );
  }

  const themes: WorkInsightTheme[] = themesRaw.map((theme, index) => {
    if (typeof theme !== 'object' || theme === null) {
      throw new AiGatewayError(
        'AI_INVALID_RESPONSE',
        `AI response field "themes[${index}]" is missing or invalid.`
      );
    }

    const themeObj = theme as Record<string, unknown>;
    const count = requirePositiveInteger(
      themeObj.count,
      `themes[${index}].count`
    );
    const priority = requireNonEmptyString(
      themeObj.priority,
      `themes[${index}].priority`
    ).toLowerCase();

    if (!ALLOWED_THEME_PRIORITIES.has(priority)) {
      throw new AiGatewayError(
        'AI_INVALID_RESPONSE',
        `AI response field "themes[${index}].priority" has an invalid value.`
      );
    }

    const themeLabel = requireNonEmptyString(
      themeObj.theme,
      `themes[${index}].theme`
    );

    return {
      count,
      priority,
      theme: themeLabel,
    };
  });

  if (
    typeof analyzedCount === 'number' &&
    analyzedCount >= 0 &&
    themes.length > 0
  ) {
    const totalThemeCount = themes.reduce((sum, theme) => sum + theme.count, 0);
    if (totalThemeCount > analyzedCount) {
      throw new AiGatewayError(
        'AI_INVALID_RESPONSE',
        `AI theme counts (${totalThemeCount}) exceed analyzed ticket count (${analyzedCount}).`
      );
    }
  }

  return {
    headline,
    summary,
    themes,
  };
}

const DEFAULT_TICKET_SUMMARY_MODEL = 'us.anthropic.claude-sonnet-4-6';
const DEFAULT_BEDROCK_BASE_URL = 'https://ai-gateway.zende.sk/bedrock';
const DEFAULT_WORK_INSIGHTS_MODEL = 'us.anthropic.claude-sonnet-4-6';
const BEDROCK_ANTHROPIC_VERSION = 'bedrock-2023-05-31';
const WORK_INSIGHTS_MAX_TOKENS = 4096;

function getTicketSummaryModel(): string {
  const model = process.env.AI_GATEWAY_MODEL;
  if (!model || model.trim() === '') {
    return DEFAULT_TICKET_SUMMARY_MODEL;
  }

  return model.trim();
}

function getBedrockBaseUrl(): string {
  const raw = process.env.AI_GATEWAY_BEDROCK_BASE_URL;
  if (!raw || raw.trim() === '') {
    return DEFAULT_BEDROCK_BASE_URL;
  }

  return raw.trim().replace(/\/$/, '');
}

function getWorkInsightsModel(): string {
  const workInsightsModel = process.env.AI_GATEWAY_MODEL_WORK_INSIGHTS;
  if (workInsightsModel && workInsightsModel.trim() !== '') {
    return workInsightsModel.trim();
  }

  return DEFAULT_WORK_INSIGHTS_MODEL;
}

function buildBedrockInvokeUrl(modelId: string): string {
  return `${getBedrockBaseUrl()}/model/${modelId}/invoke`;
}

async function parseGatewayContent(
  prompt: string,
  model: string
): Promise<unknown> {
  const data = await openAiGatewayFetch(prompt, model);
  const content = extractOpenAiText(data);
  return parseJsonFromModelText(content);
}

async function parseBedrockContent(
  prompt: string,
  modelId: string
): Promise<unknown> {
  const data = await bedrockGatewayFetch(prompt, modelId);
  const content = extractBedrockText(data);
  return parseJsonFromModelText(content);
}

function extractOpenAiText(data: unknown): string {
  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || content.trim() === '') {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI Gateway returned an empty response.'
    );
  }

  return content;
}

function extractBedrockText(data: unknown): string {
  if (typeof data !== 'object' || data === null) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'Bedrock returned an invalid response.'
    );
  }

  const content = (data as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'Bedrock response is missing content.'
    );
  }

  const text = content
    .map((block) => {
      if (typeof block !== 'object' || block === null) {
        return '';
      }

      const part = block as { type?: string; text?: string };
      if (part.type === 'text' && typeof part.text === 'string') {
        return part.text;
      }

      return '';
    })
    .join('')
    .trim();

  if (!text) {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'Bedrock returned an empty response.'
    );
  }

  return text;
}

function parseJsonFromModelText(content: string): unknown {
  try {
    return JSON.parse(extractJson(content));
  } catch {
    throw new AiGatewayError(
      'AI_INVALID_RESPONSE',
      'AI returned text that is not valid JSON.'
    );
  }
}

async function openAiGatewayFetch(prompt: string, model: string): Promise<unknown> {
  const url = buildGatewayUrl();

  return gatewayFetch(url, {
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  }, model);
}

async function bedrockGatewayFetch(
  prompt: string,
  modelId: string
): Promise<unknown> {
  const url = buildBedrockInvokeUrl(modelId);

  return gatewayFetch(
    url,
    {
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
      anthropic_version: BEDROCK_ANTHROPIC_VERSION,
      max_tokens: WORK_INSIGHTS_MAX_TOKENS,
    },
    modelId
  );
}

async function gatewayFetch(
  url: string,
  body: unknown,
  modelLabel: string
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
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

  if (response.status === 403) {
    const detail = await readGatewayErrorDetail(response);
    throw new AiGatewayError(
      'AI_GATEWAY_FORBIDDEN',
      `AI Gateway denied access (403). ${detail} Create a new token at https://ai-gateway.zende.sk/tokens/create and confirm your account can use model "${modelLabel}".`
    );
  }

  if (!response.ok) {
    const detail = await readGatewayErrorDetail(response);
    throw new AiGatewayError(
      'AI_GATEWAY_UNAVAILABLE',
      `AI Gateway request failed with status ${response.status}.${detail ? ` ${detail}` : ''}`
    );
  }

  return response.json();
}

async function readGatewayErrorDetail(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text.trim()) {
      return '';
    }

    try {
      const json = JSON.parse(text) as {
        error?: { message?: string };
        message?: string;
      };
      const message = json.error?.message ?? json.message;
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    } catch {
      // fall through to raw text
    }

    return text.trim().slice(0, 200);
  } catch {
    return '';
  }
}

export async function generateSummary(prompt: string): Promise<TicketSummary> {
  const parsed = await parseBedrockContent(prompt, getTicketSummaryModel());
  return parseTicketSummary(parsed);
}

export async function generateWorkInsights(
  prompt: string,
  analyzedCount?: number
): Promise<WorkInsights> {
  const parsed = await parseBedrockContent(prompt, getWorkInsightsModel());
  return parseWorkInsights(parsed, analyzedCount);
}