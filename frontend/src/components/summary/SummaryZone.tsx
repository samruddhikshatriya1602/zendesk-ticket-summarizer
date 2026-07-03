import { useEffect, useRef, useState } from 'react';
import type { TicketSummary } from '../../types';
import { ErrorAlert } from '../shared/ErrorAlert';
import { SummaryEmpty } from './SummaryEmpty';
import { SummaryLoading } from './SummaryLoading';
import { TicketSummaryCard } from './TicketSummaryCard';

interface SummaryZoneProps {
  summary: TicketSummary | null;
  generatedAt: string | null;
  summaryLoading: boolean;
  summaryError: string | null;
  onGenerate: () => void;
  onRefresh: () => void;
  onRetry: () => void;
}

export function SummaryZone({
  summary,
  generatedAt,
  summaryLoading,
  summaryError,
  onGenerate,
  onRefresh,
  onRetry,
}: SummaryZoneProps) {
  const [copyError, setCopyError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    if (summaryLoading) {
      wasLoadingRef.current = true;
      setLiveMessage(
        'Generating summary. This may take up to a minute.'
      );
      return;
    }

    if (wasLoadingRef.current) {
      wasLoadingRef.current = false;
      if (summaryError) {
        setLiveMessage(`Summary failed. ${summaryError}`);
      } else if (summary) {
        setLiveMessage('Summary ready.');
      }
    }
  }, [summaryLoading, summaryError, summary]);

  return (
    <section
      className="summary-zone"
      aria-labelledby="summary-zone-heading"
    >
      <h3 id="summary-zone-heading" className="summary-zone__heading">
        AI Summary
      </h3>

      <div
        className="visually-hidden"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {liveMessage}
      </div>

      {summaryLoading && <SummaryLoading />}

      {!summaryLoading && summaryError && (
        <div className="summary-zone__error">
          <ErrorAlert title="Summary failed" message={summaryError} />
          <button
            type="button"
            className="summary-zone__retry"
            onClick={onRetry}
          >
            Try again
          </button>
        </div>
      )}

    {!summaryLoading && !summaryError && !summary && (
    <SummaryEmpty onGenerate={onGenerate} disabled={summaryLoading} />
    )}

    {!summaryLoading && !summaryError && summary && (
    <>
    {copyError && (
        <p className="summary-zone__copy-error" role="status">{copyError}</p>
    )}
    <TicketSummaryCard
        summary={summary}
        generatedAt={generatedAt}
        onRefresh={onRefresh}
        onCopyError={(message) => setCopyError(message)}
        onCopySuccess={() => setCopyError(null)}
        disabled={summaryLoading}
    />
    </>
    )}
    </section>
  );
}