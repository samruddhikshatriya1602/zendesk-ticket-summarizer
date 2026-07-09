import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Ticket } from '../../types';
import { isTypingTarget } from '../../utils/isTypingTarget';
import {
  PRIORITY_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  UPDATED_SORT_OPTIONS,
  type PriorityFilter,
  type StatusFilter,
  type UpdatedSort,
} from '../../utils/filterTickets';
import { FilterableColumnHeader } from './FilterableColumnHeader';
import { TicketRow } from './TicketRow';

interface TicketTableProps {
  tickets: Ticket[];
  listPage: number;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  updatedSort: UpdatedSort;
  onStatusFilterChange: (value: StatusFilter) => void;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  onUpdatedSortChange: (value: UpdatedSort) => void;
}

export function TicketTable({
  tickets,
  listPage,
  statusFilter,
  priorityFilter,
  updatedSort,
  onStatusFilterChange,
  onPriorityFilterChange,
  onUpdatedSortChange,
}: TicketTableProps) {
  const { id } = useParams();
  const selectedId = id ? Number(id) : null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const focusRow = useCallback(
    (index: number, moveDomFocus = true) => {
      const clamped = Math.max(0, Math.min(index, tickets.length - 1));
      setActiveIndex(clamped);

      if (moveDomFocus && !isTypingTarget(document.activeElement)) {
        rowRefs.current[clamped]?.focus();
      }
    },
    [tickets.length]
  );

  useEffect(() => {
    if (tickets.length === 0) {
      return;
    }

    const selectedIndex =
      selectedId !== null
        ? tickets.findIndex((ticket) => ticket.id === selectedId)
        : -1;

    focusRow(selectedIndex >= 0 ? selectedIndex : 0);
  }, [focusRow, listPage, selectedId, tickets]);

  useEffect(() => {
    if (activeIndex >= tickets.length && tickets.length > 0) {
      focusRow(tickets.length - 1);
    }
  }, [activeIndex, focusRow, tickets.length]);

  const handleMoveFocus = (direction: 'up' | 'down') => {
    focusRow(direction === 'down' ? activeIndex + 1 : activeIndex - 1, true);
  };

  return (
    <div className="ticket-table-wrap">
      <table className="ticket-table" aria-label="Tickets">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Subject</th>
            <FilterableColumnHeader
              label="Status"
              value={statusFilter}
              defaultValue="all"
              options={STATUS_FILTER_OPTIONS}
              onChange={onStatusFilterChange}
              openMenu={openMenu}
              onOpenMenu={setOpenMenu}
            />
            <FilterableColumnHeader
              label="Priority"
              value={priorityFilter}
              defaultValue="all"
              options={PRIORITY_FILTER_OPTIONS}
              onChange={onPriorityFilterChange}
              openMenu={openMenu}
              onOpenMenu={setOpenMenu}
            />
            <FilterableColumnHeader
              label="Updated"
              value={updatedSort}
              defaultValue="default"
              options={UPDATED_SORT_OPTIONS}
              onChange={onUpdatedSortChange}
              openMenu={openMenu}
              onOpenMenu={setOpenMenu}
            />
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket, index) => (
            <TicketRow
              key={ticket.id}
              ref={(element) => {
                rowRefs.current[index] = element;
              }}
              ticket={ticket}
              isSelected={selectedId === ticket.id}
              isActive={index === activeIndex}
              onMoveFocus={handleMoveFocus}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
