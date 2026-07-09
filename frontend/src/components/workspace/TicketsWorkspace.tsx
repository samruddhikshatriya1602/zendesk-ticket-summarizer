// TicketsWorkspace.tsx — main agent screen: split list (left) + detail (right).
// Rendered inside AppShell's <Outlet /> for /tickets and /tickets/:id routes.

import { useSplitPanel } from '../../hooks/useSplitPanel';
import { useTickets } from '../../hooks/useTickets';
import { ListErrorBanner } from '../shared/ListErrorBanner';
import { TicketListPanel } from './TicketListPanel';
import { TicketDetailPanel } from './TicketDetailPanel';

export function TicketsWorkspace() {
  // Panel widths (default 60/40) and drag-to-resize; clamped between 30% and 75%.
  const {
    leftPercent,
    rightPercent,
    workspaceRef,
    isResizing,
    onResizerMouseDown,
  } = useSplitPanel({ defaultPercent: 60, minPercent: 30, maxPercent: 75 });

  // Fetches ticket list on mount; passes state down to the left panel.
  const ticketsState = useTickets();

  return (
    <>
      {/* Full-width error strip when list fetch fails (Try again re-calls useTickets.retry). */}
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
        {/* Left: search, table, pagination — receives ticketsState as props. */}
        <section
          className="ticket-list-panel"
          style={{ width: `${leftPercent}%` }}
          aria-label="Ticket list"
        >
          <TicketListPanel ticketsState={ticketsState} />
        </section>

        {/* Draggable divider — mousedown starts resize via useSplitPanel. */}
        <div
          className="split-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          onMouseDown={onResizerMouseDown}
        >
          <div className="split-resizer-handle" />
        </div>

        {/* Right: ticket detail — reads :id from URL itself (no props needed). */}
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
