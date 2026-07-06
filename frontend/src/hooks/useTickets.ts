import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTickets } from '../api/ticketApi';
import type { Ticket } from '../types';

const PER_PAGE = 30;

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const loadTickets = useCallback(async (pageToLoad: number) => {
    const requestId = ++latestRequestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTickets(pageToLoad, PER_PAGE);
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      setTickets(data.tickets);
      setPage(data.meta.page);
      setHasMore(data.meta.has_more);
    } catch (err) {
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      setTickets([]);
      setHasMore(false);
      setError(err instanceof Error ? err.message : 'Failed to load tickets.');
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadTickets(page);
  }, [page, loadTickets]);

  const goNext = useCallback(() => {
    if (hasMore && !loading) {
      setPage((current) => current + 1);
    }
  }, [hasMore, loading]);

  const goPrev = useCallback(() => {
    if (page > 1 && !loading) {
      setPage((current) => current - 1);
    }
  }, [page, loading]);

  const retry = useCallback(() => {
    loadTickets(page);
  }, [loadTickets, page]);

  return {
    tickets,
    page,
    hasMore,
    loading,
    error,
    goNext,
    goPrev,
    retry,
  };
}
