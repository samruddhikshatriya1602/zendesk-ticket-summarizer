import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@zendeskgarden/react-theming';
import { WorkInsightsPanel } from '../components/list/WorkInsightsPanel';
import type { WorkInsightsResponse } from '../types';

function makeResponse(
  overrides: Partial<WorkInsightsResponse> = {}
): WorkInsightsResponse {
  return {
    ticketCount: 12,
    analyzedCount: 12,
    generatedAt: '2026-06-29T12:00:00.000Z',
    insights: {
      headline: 'Summary of your work',
      summary:
        'you have 5 high priority tickets about login failures and 3 normal priority tickets about billing.',
      themes: [
        { count: 5, priority: 'high', theme: 'login failures' },
        { count: 3, priority: 'normal', theme: 'billing' },
      ],
    },
    ...overrides,
  };
}

function renderPanel(
  props: ComponentProps<typeof WorkInsightsPanel>
) {
  return render(
    <ThemeProvider>
      <WorkInsightsPanel {...props} />
    </ThemeProvider>
  );
}

describe('WorkInsightsPanel', () => {
  it('shows skeleton and loading message when loading without data', () => {
    renderPanel({
      data: null,
      loading: true,
      error: null,
      onRetry: jest.fn(),
    });

    expect(screen.getByText('Summary of your work')).toBeInTheDocument();
    expect(screen.getByText('Analyzing your queue…')).toBeInTheDocument();
  });

  it('shows error alert and try again button', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    renderPanel({
      data: null,
      loading: false,
      error: 'AI Gateway denied access',
      onRetry,
    });

    expect(screen.getByText('Work summary failed')).toBeInTheDocument();
    expect(screen.getByText('AI Gateway denied access')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows headline and summary sentence on success', () => {
    const data = makeResponse();

    renderPanel({
      data,
      loading: false,
      error: null,
      onRetry: jest.fn(),
    });

    expect(screen.getByText('Summary of your work')).toBeInTheDocument();
    expect(
      screen.getByText(
        'you have 5 high priority tickets about login failures and 3 normal priority tickets about billing.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('12 tickets analyzed')).toBeInTheDocument();
    expect(screen.getByText('login failures')).toBeInTheDocument();
    expect(screen.getByText('billing')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows empty queue message without theme bullets', () => {
    const data = makeResponse({
      analyzedCount: 0,
      insights: {
        headline: 'Summary of your work',
        summary: 'you have no open or pending tickets to analyze.',
        themes: [],
      },
    });

    renderPanel({
      data,
      loading: false,
      error: null,
      onRetry: jest.fn(),
    });

    expect(
      screen.getByText('you have no open or pending tickets to analyze.')
    ).toBeInTheDocument();
    expect(screen.queryByText('login failures')).not.toBeInTheDocument();
  });
});
