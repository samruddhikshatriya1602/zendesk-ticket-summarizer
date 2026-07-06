import { Ticket, TicketComment } from '../types';

const MAX_DESCRIPTION_CHARS = 2000;
const MAX_COMMENT_CHARS = 500;
const MAX_COMMENTS = 10;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

export function buildSummaryPrompt(ticket: Ticket, comments: TicketComment[]): string {
  const publicComments = comments.filter((c) => c.public);
  const recentComments = publicComments.slice(-MAX_COMMENTS);

  const commentsBlock =
    recentComments.length === 0
      ? '(no public comments)'
      : recentComments
          .map((comment, index) => {
            const body = truncate(comment.body || '', MAX_COMMENT_CHARS);
            return `${index + 1}. [${comment.created_at}] ${body}`;
          })
          .join('\n');

  const description = truncate(ticket.description || '', MAX_DESCRIPTION_CHARS);
  const priority = ticket.priority ?? 'none';

  return `
You are a Zendesk support analyst. Summarize this support ticket.

TICKET:
- ID: ${ticket.id}
- Subject: ${ticket.subject}
- Status: ${ticket.status}
- Priority: ${priority}
- Description: ${description}
- Created: ${ticket.created_at}
- Updated: ${ticket.updated_at}

COMMENTS (oldest first):
${commentsBlock}

Respond with ONLY valid JSON. No markdown. No code fences. Use exactly these keys:
{
  "mainIssue": "",
  "priorityAssessment": "",
  "priorityReasoning": "",
  "currentStatus": "",
  "recommendedNextSteps": []
}
`.trim();
}