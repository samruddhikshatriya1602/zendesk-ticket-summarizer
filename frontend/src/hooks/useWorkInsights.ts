import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWorkInsights } from '../api/ticketApi';
import type { WorkInsightsResponse } from '../types';

const WORK_INSIGHTS_TIMEOUT_MS = 120_000;

export function useWorkInsights(enabled: boolean) {
  const [data, setData] = useState<WorkInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialFetchDoneRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadInsights = useCallback(async () => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, WORK_INSIGHTS_TIMEOUT_MS);

    setLoading(true);
    setError(null);

    try {
      const result = await fetchWorkInsights(controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      setData(result);
    } catch (err) {
      if (controller.signal.aborted) {
        if (abortControllerRef.current === controller) {
          setError('Work insights request timed out. Please try again.');
        }
        return;
      }

      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load work insights.'
      );
    } finally {
      window.clearTimeout(timeoutId);

      if (!controller.signal.aborted) {
        setLoading(false);
      } else if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || initialFetchDoneRef.current) {
      return;
    }

    initialFetchDoneRef.current = true;
    void loadInsights();
  }, [enabled, loadInsights]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const retry = useCallback(() => {
    void loadInsights();
  }, [loadInsights]);

  return {
    data,
    loading,
    error,
    retry,
  };
}
