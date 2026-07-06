import type { TicketSummary } from '../../types';
import {
  copyToClipboard,
  formatSummaryForCopy,
} from '../../utils/copyToClipboard';
import {
  formatFullDate,
  formatRelativeDate,
} from '../../utils/formatDate';
import { useCopySuccessToast } from '../../hooks/useCopySuccessToast';

interface TicketSummaryCardProps {
  summary: TicketSummary;
  generatedAt: string | null;
  onRefresh: () => void;
  onCopyError?: (message: string) => void;
  onCopySuccess?: () => void;
  disabled?: boolean;
}

export function TicketSummaryCard({
  summary,
  generatedAt,
  onRefresh,
  onCopyError,
  onCopySuccess,
  disabled = false,
}: TicketSummaryCardProps) {
  const { showCopySuccess } = useCopySuccessToast();

  const handleCopy = async () => {
    try {
      await copyToClipboard(formatSummaryForCopy(summary));
      onCopySuccess?.();
      showCopySuccess();
    } catch (err) {
      onCopyError?.(
        err instanceof Error ? err.message : 'Could not copy to clipboard.'
      );
    }
  };

  return (
    <div className="summary-card">
      <div className="summary-card__toolbar">
        <div className="summary-card__meta-group">
          {generatedAt && (
            <time
              className="summary-card__meta"
              dateTime={generatedAt}
              title={formatFullDate(generatedAt)}
            >
              Generated {formatRelativeDate(generatedAt)}
            </time>
          )}
        </div>
        <div className="summary-card__actions">
          <button
            type="button"
            className="summary-card__button"
            onClick={onRefresh}
            disabled={disabled}
          >
            Refresh summary
          </button>
          <button
            type="button"
            className="summary-card__button summary-card__button--secondary"
            onClick={handleCopy}
            disabled={disabled}
          >
            Copy
          </button>
        </div>
      </div>

      <dl className="summary-card__fields">
        <div className="summary-card__field">
          <dt>Main issue</dt>
          <dd>{summary.mainIssue}</dd>
        </div>
        <div className="summary-card__field">
          <dt>Priority</dt>
          <dd>{summary.priorityAssessment}</dd>
        </div>
        <div className="summary-card__field">
          <dt>Why this priority</dt>
          <dd>{summary.priorityReasoning}</dd>
        </div>
        <div className="summary-card__field">
          <dt>Current status</dt>
          <dd>{summary.currentStatus}</dd>
        </div>
        <div className="summary-card__field">
          <dt>Recommended next steps</dt>
          <dd>
            {summary.recommendedNextSteps.length === 0 ? (
              <span className="summary-card__empty">None listed.</span>
            ) : (
              <ol className="summary-card__steps">
                {summary.recommendedNextSteps.map((step, index) => (
                  <li key={`${index}-${step}`}>{step}</li>
                ))}
              </ol>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
