import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@zendeskgarden/react-theming';
import { ToastProvider } from '@zendeskgarden/react-notifications';
import { TicketSummaryCard } from '../components/summary/TicketSummaryCard';
import type { TicketSummary } from '../types';

function makeSummary(): TicketSummary {
  return {
    mainIssue: 'Customer cannot log in after password reset.',
    priorityAssessment: 'High',
    priorityReasoning: 'Blocks account access for a paying customer.',
    currentStatus: 'Awaiting agent reply.',
    recommendedNextSteps: [
      'Verify the reset email was delivered.',
      'Escalate to identity team if logs show repeated failures.',
    ],
  };
}

function renderSummaryCard(summary: TicketSummary = makeSummary()) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <TicketSummaryCard
          summary={summary}
          generatedAt="2026-06-29T12:00:00.000Z"
          onRefresh={jest.fn()}
        />
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('TicketSummary', () => {
  it('displays AI-generated summary', () => {
    renderSummaryCard();

    expect(
      screen.getByText('Customer cannot log in after password reset.')
    ).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(
      screen.getByText('Blocks account access for a paying customer.')
    ).toBeInTheDocument();
    expect(screen.getByText('Awaiting agent reply.')).toBeInTheDocument();
    expect(
      screen.getByText('Verify the reset email was delivered.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Escalate to identity team if logs show repeated failures.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Refresh summary' })
    ).toBeInTheDocument();
  });
});
