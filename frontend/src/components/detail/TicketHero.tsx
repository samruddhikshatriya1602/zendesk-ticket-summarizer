import type { Ticket } from '../../types';
import { StatusTag } from '../shared/StatusTag';
import { PriorityTag } from '../shared/PriorityTag';
import {
  formatFullDate,
  formatRelativeDate,
} from '../../utils/formatDate';

interface TicketHeroProps {
  ticket: Ticket;
}

interface TicketHeroDateProps {
  label: string;
  isoDate: string;
}

function TicketHeroDate({ label, isoDate }: TicketHeroDateProps) {
  return (
    <time
      className="ticket-hero__date"
      dateTime={isoDate}
      title={formatFullDate(isoDate)}
    >
      {label} {formatRelativeDate(isoDate)}
    </time>
  );
}

export function TicketHero({ ticket }: TicketHeroProps) {
  return (
    <header className="ticket-hero">
      <p className="ticket-hero__id">Ticket #{ticket.id}</p>
      <h2 className="ticket-hero__subject">{ticket.subject}</h2>
      <div className="ticket-hero__tags">
        <StatusTag status={ticket.status} />
        <PriorityTag priority={ticket.priority} />
      </div>
      <div className="ticket-hero__dates">
        <TicketHeroDate label="Created" isoDate={ticket.created_at} />
        <span className="ticket-hero__date-separator" aria-hidden="true">
          ·
        </span>
        <TicketHeroDate label="Updated" isoDate={ticket.updated_at} />
      </div>
    </header>
  );
}