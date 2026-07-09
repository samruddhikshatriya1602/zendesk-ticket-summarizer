// useTickets.ts — ticket list state + fetch logic (Workflow A core hook).
// Called by TicketsWorkspace; result passed to TicketListPanel as ticketsState.
//
// Hybrid search:
// - 1 character: client-side filter on the current page (no extra API call).
// - 2+ characters (debounced): Zendesk Search API across the whole account.

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTickets } from '../api/ticketApi';
import type { Ticket } from '../types';
import type { PriorityFilter, StatusFilter } from '../utils/filterTickets';
import { useDebouncedValue } from './useDebouncedValue';

const PER_PAGE = 30;
const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SERVER_SEARCH_LENGTH = 2;

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const trimmedSearch = debouncedSearch.trim();
  const isSearchMode = trimmedSearch.length >= MIN_SERVER_SEARCH_LENGTH;
  const isLocalSearchOnly =
    searchQuery.trim().length > 0 &&
    searchQuery.trim().length < MIN_SERVER_SEARCH_LENGTH;
  const latestRequestIdRef = useRef(0);
  const searchFiltersRef = useRef({
    debouncedSearch,
    statusFilter,
    priorityFilter,
  });

  const loadTickets = useCallback(
    async (pageToLoad: number) => {
      const requestId = ++latestRequestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const data = isSearchMode
          ? await fetchTickets(pageToLoad, PER_PAGE, {
              q: trimmedSearch,
              status: statusFilter,
              priority: priorityFilter,
            })
          : await fetchTickets(pageToLoad, PER_PAGE);

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
    },
    [trimmedSearch, isSearchMode, priorityFilter, statusFilter]
  );

  useEffect(() => {
    const filtersChanged =
      searchFiltersRef.current.debouncedSearch !== debouncedSearch ||
      searchFiltersRef.current.statusFilter !== statusFilter ||
      searchFiltersRef.current.priorityFilter !== priorityFilter;

    const onlyClientFiltersChanged =
      !isSearchMode &&
      filtersChanged &&
      searchFiltersRef.current.debouncedSearch === debouncedSearch;

    searchFiltersRef.current = {
      debouncedSearch,
      statusFilter,
      priorityFilter,
    };

    if (onlyClientFiltersChanged) {
      return;
    }

    let pageToLoad = page;
    if (isSearchMode && filtersChanged) {
      pageToLoad = 1;
      if (page !== 1) {
        setPage(1);
      }
    }

    loadTickets(pageToLoad);
  }, [
    page,
    debouncedSearch,
    isSearchMode,
    statusFilter,
    priorityFilter,
    loadTickets,
  ]);

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

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setPage(1);
  }, []);

  return {
    tickets,
    page,
    hasMore,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    isSearchMode,
    isLocalSearchOnly,
    clearFilters,
    goNext,
    goPrev,
    retry,
  };
}
