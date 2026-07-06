import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Ticket } from '../../types';
import { StatusTag } from '../shared/StatusTag';
import { PriorityTag } from '../shared/PriorityTag';
import {
  formatFullDate,
  formatRelativeDate,
} from '../../utils/formatDate';

interface TicketRowProps {
  ticket: Ticket;
  isSelected: boolean;
  isActive: boolean;
  onMoveFocus: (direction: 'up' | 'down') => void;
}

export const TicketRow = forwardRef<HTMLTableRowElement, TicketRowProps>(
  function TicketRow(
    { ticket, isSelected, isActive, onMoveFocus },
    ref
  ) {
    const navigate = useNavigate();

    const handleClick = () => {
      navigate(`/tickets/${ticket.id}`);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        onMoveFocus('down');
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        onMoveFocus('up');
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    };

    return (
      <tr
        ref={ref}
        className={`ticket-row${isSelected ? ' ticket-row--selected' : ''}${
          isActive ? ' ticket-row--active' : ''
        }`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={isActive ? 0 : -1}
        role="button"
        aria-label={`Open ticket ${ticket.id}: ${ticket.subject}`}
        aria-selected={isSelected}
      >
        <td className="ticket-row__id">#{ticket.id}</td>
        <td className="ticket-row__subject">{ticket.subject}</td>
        <td>
          <StatusTag status={ticket.status} />
        </td>
        <td>
          <PriorityTag priority={ticket.priority} />
        </td>
        <td
          className="ticket-row__updated"
          title={formatFullDate(ticket.updated_at)}
        >
          {formatRelativeDate(ticket.updated_at)}
        </td>
      </tr>
    );
  }
);
