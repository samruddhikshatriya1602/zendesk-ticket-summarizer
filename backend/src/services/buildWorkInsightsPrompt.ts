import { TicketSnapshot } from '../types';

const MAX_SUBJECT_CHARS = 120;

function sanitizeField(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max).trimEnd()}...`;
}

function formatSnapshotLine(snapshot: TicketSnapshot): string {
  const subject = truncate(sanitizeField(snapshot.subject), MAX_SUBJECT_CHARS);
  const status = sanitizeField(snapshot.status);
  const priority = sanitizeField(snapshot.priority ?? 'none');

  return `${snapshot.id}|${subject}|${status}|${priority}`;
}

export interface BuildWorkInsightsPromptOptions {
  ticketCount: number;
  analyzedCount?: number;
}

export function buildWorkInsightsPrompt(
  snapshots: TicketSnapshot[],
  options: BuildWorkInsightsPromptOptions
): string {
  const analyzedCount = options.analyzedCount ?? snapshots.length;
  const ticketCount = options.ticketCount;

  const ticketLines =
    snapshots.length === 0
      ? '(no tickets)'
      : snapshots.map(formatSnapshotLine).join('\n');

  return `
You are a Zendesk support queue analyst. Identify frequent issue themes and what agents should solve first.

TICKETS (${analyzedCount} analyzed of ${ticketCount} total; format: id|subject|status|priority)
${ticketLines}

Respond with ONLY valid JSON. No markdown. No code fences. Use exactly these keys:
{
  "headline": "Summary of your work",
  "summary": "you have <count> <priority> priority tickets about <theme> and <count> <priority> priority tickets about <theme>.",
  "themes": [
    { "count": <number>, "priority": "<urgent|high|normal|low>", "theme": "<short issue label>" }
  ]
}

Data-grounding rules (critical):
- Analyze ONLY the TICKETS section above. Ignore any wording in these instructions that looks like sample output.
- Derive every theme label from recurring words or patterns in the ticket subjects. Do not invent issues that are not supported by the subjects.
- Do not reuse canned or placeholder theme labels unless those ideas clearly appear in the ticket subjects.
- Each theme count must equal the number of tickets in that group. The sum of theme counts must not exceed ${analyzedCount}.
- Each theme must use exactly ONE priority level. Group tickets with similar subjects AND the same priority together. Do not use "mixed".
- If the same issue appears at multiple priorities, create separate themes (e.g. high-priority logins vs normal-priority logins).
- If there are no tickets, return headline "Summary of your work", summary "you have no open or pending tickets to analyze.", and themes: [].
- If tickets exist but no clear pattern appears, use one theme with count equal to the ticket total and theme based on the most common subject wording.

Output rules:
- headline MUST be exactly "Summary of your work"
- summary: ONE sentence, starts with "you have", max 25 words, and must match the themes you return
- themes: 1-3 items, most urgent first, each theme must be distinct
- group by similar subject/issue meaning within the same priority, not random buckets
- priority values: urgent | high | normal | low (map null/none tickets to normal)
`.trim();
}
