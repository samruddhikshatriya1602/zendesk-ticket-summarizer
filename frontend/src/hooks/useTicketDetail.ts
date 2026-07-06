import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTicketById } from '../api/ticketApi';
import type { Ticket, TicketComment } from '../types';

export function useTicketDetail() {
  const { id } = useParams();
  const ticketId = id ? Number(id) : null;
  const hasIdParam = Boolean(id);
  const hasValidId = ticketId !== null && Number.isInteger(ticketId) && ticketId > 0;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const loadTicket = useCallback(async (idToLoad: number) => {
    const requestId = ++latestRequestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTicketById(idToLoad);
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      setTicket(data.ticket);
      setComments(data.comments);
    } catch (err) {
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      setTicket(null);
      setComments([]);
      setError(
        err instanceof Error ? err.message : 'Failed to load ticket.'
      );
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasValidId || ticketId === null) {
      latestRequestIdRef.current += 1;
      setTicket(null);
      setComments([]);
      setError(null);
      setLoading(false);
      return;
    }

    loadTicket(ticketId);
  }, [hasValidId, ticketId, loadTicket]);

  const retry = useCallback(() => {
    if (hasValidId && ticketId !== null) {
      loadTicket(ticketId);
    }
  }, [hasValidId, ticketId, loadTicket]);

  return {
    ticketId,
    hasValidId,
    hasIdParam,
    ticket,
    comments,
    loading,
    error,
    retry,
  };
}
