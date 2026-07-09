import { useTicketDetail } from '../../hooks/useTicketDetail';
import { EmptyDetailState } from './EmptyDetailState';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';
import { ErrorAlert } from '../shared/ErrorAlert';
import { TicketHero } from '../detail/TicketHero';
import { DescriptionCard } from '../detail/DescriptionCard';
import { CommentThread } from '../detail/CommentThread';

export function TicketDetailPanel() {
  const { hasValidId, hasIdParam, ticket, comments, loading, error, retry } =
    useTicketDetail();

  if (!hasValidId) {
    if (hasIdParam) {
      return (
        <div className="ticket-panel-body ticket-detail-error">
          <ErrorAlert
            title="Couldn't load ticket"
            message="Ticket id must be a positive integer."
          />
        </div>
      );
    }

    return (
      <div className="ticket-panel-body">
        <EmptyDetailState />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ticket-panel-body ticket-detail-loading" aria-busy="true">
        <LoadingSkeleton lines={8} lineHeight="20px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-panel-body ticket-detail-error">
        <ErrorAlert title="Couldn't load ticket" message={error} />
        <button
          type="button"
          className="ticket-detail-error__retry"
          onClick={retry}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="ticket-panel-body ticket-detail">
      <TicketHero ticket={ticket} />
      <DescriptionCard key={ticket.id} description={ticket.description} />
      <CommentThread key={ticket.id} comments={comments} />
    </div>
  );
}
