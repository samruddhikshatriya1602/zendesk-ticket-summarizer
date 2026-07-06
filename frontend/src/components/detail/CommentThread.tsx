import { useEffect, useState } from 'react';
import type { TicketComment } from '../../types';
import { CommentItem } from './CommentItem';

const INITIAL_VISIBLE_COMMENTS = 2;
const LOAD_MORE_COUNT = 5;

interface CommentThreadProps {
  comments: TicketComment[];
}

export function CommentThread({ comments }: CommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COMMENTS);
  const count = comments.length;
  const countLabel = count === 1 ? 'comment' : 'comments';
  const visibleComments = comments.slice(
    -Math.min(visibleCount, count)
  );
  const hiddenCount = count - visibleComments.length;
  const nextBatchSize = Math.min(LOAD_MORE_COUNT, hiddenCount);
  const canShowLess = visibleCount > INITIAL_VISIBLE_COMMENTS;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COMMENTS);
  }, [comments]);

  return (
    <section className="comment-thread" aria-labelledby="comment-thread-heading">
      <button
        type="button"
        id="comment-thread-heading"
        className="comment-thread__header"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        aria-controls="comment-thread-list"
        disabled={count === 0}
      >
        <span className="comment-thread__title">
          Conversation ({count} {countLabel})
        </span>
        {count > 0 && (
          <span className="comment-thread__chevron" aria-hidden="true">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
      </button>

      {count === 0 ? (
        <p className="comment-thread__empty">No comments on this ticket.</p>
      ) : (
        isExpanded && (
          <>
            <ul id="comment-thread-list" className="comment-thread__list">
              {visibleComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </ul>
            {(hiddenCount > 0 || canShowLess) && (
              <div className="comment-thread__actions">
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    className="comment-thread__action"
                    onClick={() =>
                      setVisibleCount((current) =>
                        Math.min(current + LOAD_MORE_COUNT, count)
                      )
                    }
                  >
                    Show {nextBatchSize} more{' '}
                    {nextBatchSize === 1 ? 'comment' : 'comments'}
                  </button>
                )}
                {canShowLess && (
                  <button
                    type="button"
                    className="comment-thread__action"
                    onClick={() => setVisibleCount(INITIAL_VISIBLE_COMMENTS)}
                  >
                    Show less
                  </button>
                )}
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}