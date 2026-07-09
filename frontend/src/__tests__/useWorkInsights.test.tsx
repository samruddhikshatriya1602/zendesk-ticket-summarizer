import { act, renderHook, waitFor } from '@testing-library/react';
import { useWorkInsights } from '../hooks/useWorkInsights';
import { fetchWorkInsights } from '../api/ticketApi';

jest.mock('../api/ticketApi', () => ({
  fetchWorkInsights: jest.fn(),
}));

const mockedFetchWorkInsights = jest.mocked(fetchWorkInsights);

function makeResponse() {
  return {
    ticketCount: 3,
    analyzedCount: 2,
    generatedAt: '2026-06-29T12:00:00.000Z',
    insights: {
      headline: 'Summary of your work',
      summary: 'you have 2 high priority tickets about login failures.',
      themes: [{ count: 2, priority: 'high', theme: 'login failures' }],
    },
  };
}

describe('useWorkInsights', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('does not fetch when enabled is false', async () => {
    renderHook(() => useWorkInsights(false));

    await waitFor(() => {
      expect(mockedFetchWorkInsights).not.toHaveBeenCalled();
    });
  });

  it('fetches once when enabled becomes true', async () => {
    mockedFetchWorkInsights.mockResolvedValueOnce(makeResponse());

    const { result } = renderHook(() => useWorkInsights(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockedFetchWorkInsights).toHaveBeenCalledTimes(1);
    expect(mockedFetchWorkInsights).toHaveBeenCalledWith(
      expect.any(AbortSignal)
    );
    expect(result.current.data?.insights.summary).toContain('login failures');
    expect(result.current.error).toBeNull();
  });

  it('retry fetches again after an error', async () => {
    mockedFetchWorkInsights
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(makeResponse());

    const { result } = renderHook(() => useWorkInsights(true));

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(mockedFetchWorkInsights).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });
});
