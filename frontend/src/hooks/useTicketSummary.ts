import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSummary } from '../api/ticketApi';
import type { TicketSummary } from '../types';

export function useTicketSummary(ticketId: number | null) {
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    latestRequestIdRef.current += 1;
    setSummary(null);
    setGeneratedAt(null);
    setSummaryLoading(false);
    setSummaryError(null);
  }, [ticketId]);

  const generateSummary = useCallback(
    async (forceRefresh = false) => {
      if (ticketId === null) {
        return;
      }

      const requestId = ++latestRequestIdRef.current;
      const activeTicketId = ticketId;
      setSummaryLoading(true);
      setSummaryError(null);

      try {
        const data = await fetchSummary(activeTicketId, forceRefresh);
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        setSummary(data.summary);
        setGeneratedAt(data.generatedAt);
      } catch (err) {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        setSummary(null);
        setGeneratedAt(null);
        setSummaryError(
          err instanceof Error
            ? err.message
            : 'Failed to generate summary.'
        );
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setSummaryLoading(false);
        }
      }
    },
    [ticketId]
  );

  return {
    summary,
    generatedAt,
    summaryLoading,
    summaryError,
    generateSummary,
  };
}
