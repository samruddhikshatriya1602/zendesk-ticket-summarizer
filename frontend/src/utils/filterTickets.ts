import type { Ticket } from '../types';

export type StatusFilter = 'all' | 'open' | 'pending' | 'solved';
export type PriorityFilter = 'all' | 'low' | 'normal' | 'high' | 'urgent';
export type UpdatedSort = 'default' | 'newest' | 'oldest';

export interface TicketFilters {
  searchQuery: string;
  status: StatusFilter;
  priority: PriorityFilter;
}

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'solved', label: 'Solved' },
];

export const PRIORITY_FILTER_OPTIONS: { value: PriorityFilter; label: string }[] =
  [
    { value: 'all', label: 'All priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
  ];

export const UPDATED_SORT_OPTIONS: { value: UpdatedSort; label: string }[] = [
  { value: 'default', label: 'Default order' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

export function filterTickets(
  tickets: Ticket[],
  filters: TicketFilters
): Ticket[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return tickets.filter((ticket) => {
    // Status filter
    if (filters.status !== 'all' && ticket.status !== filters.status) {
      return false;
    }

    // Priority filter (ticket.priority can be null)
    if (filters.priority !== 'all') {
      if (ticket.priority !== filters.priority) {
        return false;
      }
    }

    // Search: subject OR ticket ID
    if (query) {
      const matchesSubject = ticket.subject.toLowerCase().includes(query);
      const matchesId = String(ticket.id).includes(query);
      if (!matchesSubject && !matchesId) {
        return false;
      }
    }

    return true;
  });
}

export function sortTicketsByUpdated(
  tickets: Ticket[],
  sort: UpdatedSort
): Ticket[] {
  if (sort === 'default') {
    return tickets;
  }

  return [...tickets].sort((left, right) => {
    const leftTime = new Date(left.updated_at).getTime();
    const rightTime = new Date(right.updated_at).getTime();
    return sort === 'newest' ? rightTime - leftTime : leftTime - rightTime;
  });
}