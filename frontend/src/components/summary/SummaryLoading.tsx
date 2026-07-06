import { LoadingSkeleton } from '../shared/LoadingSkeleton';

export function SummaryLoading() {
  return (
    <div className="summary-loading" aria-busy="true">
      <LoadingSkeleton lines={4} lineHeight="14px" />
      <p className="summary-loading__message">
        Generating summary… This may take up to a minute.
      </p>
    </div>
  );
}