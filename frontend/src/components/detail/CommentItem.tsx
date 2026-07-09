import type { TicketComment } from '../../types';
import {
  formatFullDate,
  formatRelativeDate,
} from '../../utils/formatDate';

const SNIPPET_LENGTH = 120;

interface CommentItemProps {
  comment: TicketComment;
}

function getBodySnippet(body: string): string {
  const trimmed = body.trim();

  if (trimmed.length <= SNIPPET_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, SNIPPET_LENGTH).trimEnd()}…`;
}

export function CommentItem({ comment }: CommentItemProps) {
  const snippet = getBodySnippet(comment.body);

  return (
    <li className="comment-item">
      <time
        className="comment-item__date"
        dateTime={comment.created_at}
        title={formatFullDate(comment.created_at)}
      >
        {formatRelativeDate(comment.created_at)}
      </time>
      <p className="comment-item__body">{snippet}</p>
    </li>
  );
}