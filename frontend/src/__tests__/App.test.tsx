import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@zendeskgarden/react-theming';
import { ToastProvider } from '@zendeskgarden/react-notifications';
import App from '../App';
import { fetchTickets, fetchWorkInsights } from '../api/ticketApi';
import type { Ticket } from '../types';

jest.mock('../api/ticketApi', () => ({
  fetchTickets: jest.fn(),
  fetchWorkInsights: jest.fn(),
  fetchTicketById: jest.fn(),
  fetchSummary: jest.fn(),
}));

const mockedFetchTickets = jest.mocked(fetchTickets);
const mockedFetchWorkInsights = jest.mocked(fetchWorkInsights);

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

function renderApp(path = '/tickets') {
  window.history.pushState({}, '', path);

  return render(
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('App', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedFetchTickets.mockResolvedValue({
      tickets: [
        makeTicket(101, 'Login failure'),
        makeTicket(102, 'Billing issue'),
      ],
      meta: {
        page: 1,
        per_page: 30,
        has_more: false,
      },
    });

    mockedFetchWorkInsights.mockResolvedValue({
      ticketCount: 2,
      analyzedCount: 2,
      generatedAt: '2026-06-29T12:00:00.000Z',
      insights: {
        headline: 'Summary of your work',
        summary: 'you have 2 high priority tickets about login and billing.',
        themes: [
          { count: 1, priority: 'high', theme: 'login' },
          { count: 1, priority: 'high', theme: 'billing' },
        ],
      },
    });
  });

  it('renders ticket list', async () => {
    renderApp();

    expect(
      screen.getByRole('heading', { name: 'Ticket Summarizer' })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Login failure')).toBeInTheDocument();
    });

    expect(screen.getByText('Billing issue')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Tickets' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search tickets')).toBeInTheDocument();
  });
});
