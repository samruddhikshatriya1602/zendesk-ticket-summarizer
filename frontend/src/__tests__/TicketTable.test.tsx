import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@zendeskgarden/react-theming';
import { TicketTable } from '../components/list/TicketTable';
import type { Ticket } from '../types';

function makeTicket(id: number, subject: string): Ticket {
  return {
    id,
    subject,
    description: 'Test description',
    status: 'open',
    priority: 'high',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  };
}

function renderTicketTable(tickets: Ticket[]) {
  const onStatusFilterChange = jest.fn();
  const onPriorityFilterChange = jest.fn();
  const onUpdatedSortChange = jest.fn();

  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/tickets']}>
        <TicketTable
          tickets={tickets}
          listPage={1}
          statusFilter="all"
          priorityFilter="all"
          updatedSort="default"
          onStatusFilterChange={onStatusFilterChange}
          onPriorityFilterChange={onPriorityFilterChange}
          onUpdatedSortChange={onUpdatedSortChange}
        />
      </MemoryRouter>
    </ThemeProvider>
  );

  return {
    onStatusFilterChange,
    onPriorityFilterChange,
    onUpdatedSortChange,
  };
}

describe('TicketTable', () => {
  it('renders a list of tickets', () => {
    renderTicketTable([
      makeTicket(101, 'Cannot reset password'),
      makeTicket(102, 'Refund not processed'),
    ]);

    expect(screen.getByRole('table', { name: 'Tickets' })).toBeInTheDocument();
    expect(screen.getByText('Cannot reset password')).toBeInTheDocument();
    expect(screen.getByText('Refund not processed')).toBeInTheDocument();
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('#102')).toBeInTheDocument();
  });
});
