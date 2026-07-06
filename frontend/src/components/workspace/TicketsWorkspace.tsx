import { useSplitPanel } from '../../hooks/useSplitPanel';
import { useTickets } from '../../hooks/useTickets';
import { ListErrorBanner } from '../shared/ListErrorBanner';
import { TicketListPanel } from './TicketListPanel';
import { TicketDetailPanel } from './TicketDetailPanel';

export function TicketsWorkspace() {
  const {
    leftPercent,
    rightPercent,
    workspaceRef,
    isResizing,
    onResizerMouseDown,
  } = useSplitPanel({ defaultPercent: 60, minPercent: 30, maxPercent: 75 });

  const ticketsState = useTickets();

  return (
    <>
      {ticketsState.error && (
        <ListErrorBanner
          message={ticketsState.error}
          onRetry={ticketsState.retry}
        />
      )}

      <div
        ref={workspaceRef}
        className={`tickets-workspace${isResizing ? ' is-resizing' : ''}`}
      >
        <section
          className="ticket-list-panel"
          style={{ width: `${leftPercent}%` }}
          aria-label="Ticket list"
        >
          <TicketListPanel ticketsState={ticketsState} />
        </section>

        <div
          className="split-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          onMouseDown={onResizerMouseDown}
        >
          <div className="split-resizer-handle" />
        </div>

        <section
          className="ticket-detail-panel"
          style={{ width: `${rightPercent}%` }}
          aria-label="Ticket detail"
        >
          <TicketDetailPanel />
        </section>
      </div>
    </>
  );
}
