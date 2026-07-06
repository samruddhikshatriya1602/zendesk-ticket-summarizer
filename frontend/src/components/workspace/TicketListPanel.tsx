import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchBar } from '../list/SearchBar';
import {
  filterTickets,
  sortTicketsByUpdated,
  type PriorityFilter,
  type StatusFilter,
  type UpdatedSort,
} from '../../utils/filterTickets';
import { TicketTable } from '../list/TicketTable';
import { Pagination } from '../list/Pagination';
import { EmptySearchState } from '../list/EmptySearchState';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';
import { KeyboardHelpModal } from '../shared/KeyboardHelpModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useWorkInsights } from '../../hooks/useWorkInsights';
import type { useTickets } from '../../hooks/useTickets';
import { WorkInsightsPanel } from '../list/WorkInsightsPanel';

type TicketsState = ReturnType<typeof useTickets>;

interface TicketListPanelProps {
  ticketsState: TicketsState;
}

export function TicketListPanel({ ticketsState }: TicketListPanelProps) {
  const { tickets, page, hasMore, loading, error, goNext, goPrev } = ticketsState;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [updatedSort, setUpdatedSort] = useState<UpdatedSort>('default');
  const [helpOpen, setHelpOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const filteredTickets = useMemo(() => {
    const filtered = filterTickets(tickets, {
      searchQuery,
      status: statusFilter,
      priority: priorityFilter,
    });

    return sortTicketsByUpdated(filtered, updatedSort);
  }, [tickets, searchQuery, statusFilter, priorityFilter, updatedSort]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setUpdatedSort('default');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    updatedSort !== 'default';

  const listReady = !loading && !error;
  const workInsights = useWorkInsights(listReady);

  useKeyboardShortcuts({
    searchInputRef,
    helpOpen,
    onOpenHelp: () => setHelpOpen(true),
    onCloseHelp: () => setHelpOpen(false),
    onBackToList: id ? () => navigate('/tickets') : undefined,
    enabled: listReady,
  });

  if (error) {
    return (
      <div className="ticket-panel-body">
        <p className="list-panel-unavailable">
          Ticket list is unavailable. Use Try again in the banner above.
        </p>
      </div>
    );
  }

  return (
    <div className="ticket-list-panel-inner">
      <KeyboardHelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      <div className="list-toolbar">
        <div className="list-toolbar__search">
          <SearchBar
            ref={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <WorkInsightsPanel
          data={workInsights.data}
          loading={workInsights.loading}
          error={workInsights.error}
          onRetry={workInsights.retry}
        />
      </div>

      <div
        className={`ticket-panel-body${loading ? ' list-panel-loading' : ''}`}
        aria-busy={loading}
      >
        {loading ? (
          <LoadingSkeleton lines={10} lineHeight="40px" />
        ) : tickets.length > 0 ? (
          <>
            <TicketTable
              tickets={filteredTickets}
              listPage={page}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              updatedSort={updatedSort}
              onStatusFilterChange={setStatusFilter}
              onPriorityFilterChange={setPriorityFilter}
              onUpdatedSortChange={setUpdatedSort}
            />
            {filteredTickets.length === 0 && hasActiveFilters && (
              <EmptySearchState onClear={handleClearFilters} />
            )}
          </>
        ) : (
          <p>No tickets on this page.</p>
        )}

        <Pagination
          page={page}
          hasMore={hasMore}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    </div>
  );
}
