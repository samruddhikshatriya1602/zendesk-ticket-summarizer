import type { ReactNode } from 'react';
import type { WorkInsightTheme, WorkInsightsResponse } from '../../types';
import { ErrorAlert } from '../shared/ErrorAlert';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';
import { PriorityTag } from '../shared/PriorityTag';

interface WorkInsightsPanelProps {
  data: WorkInsightsResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function isEmptyQueue(data: WorkInsightsResponse): boolean {
  return data.analyzedCount === 0 || data.insights.themes.length === 0;
}

function getAccentPriority(themes: WorkInsightTheme[]): string {
  if (themes.length === 0) {
    return 'normal';
  }

  return themes.reduce((top, theme) => {
    const currentRank = PRIORITY_RANK[theme.priority.toLowerCase()] ?? 4;
    const topRank = PRIORITY_RANK[top.toLowerCase()] ?? 4;
    return currentRank < topRank ? theme.priority : top;
  }, themes[0].priority);
}

function WorkInsightsCard({
  accentPriority,
  analyzedCount,
  children,
}: {
  accentPriority: string;
  analyzedCount?: number;
  children: ReactNode;
}) {
  return (
    <section
      className={`work-insights work-insights--${accentPriority.toLowerCase()}`}
      aria-labelledby="work-insights-heading"
    >
      <div className="work-insights__card">
        <div className="work-insights__header">
          <h3 id="work-insights-heading" className="work-insights__heading">
            Summary of your work
          </h3>
          {typeof analyzedCount === 'number' && analyzedCount > 0 && (
            <p className="work-insights__meta">
              {analyzedCount} ticket{analyzedCount === 1 ? '' : 's'} analyzed
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function ThemeRow({ theme }: { theme: WorkInsightTheme }) {
  return (
    <li className="work-insights__theme-row">
      <span className="work-insights__count" aria-hidden="true">
        {theme.count}
      </span>
      <PriorityTag priority={theme.priority} />
      <span className="work-insights__theme-text">{theme.theme}</span>
    </li>
  );
}

export function WorkInsightsPanel({
  data,
  loading,
  error,
  onRetry,
}: WorkInsightsPanelProps) {
  if (loading && !data) {
    return (
      <WorkInsightsCard accentPriority="normal">
        <LoadingSkeleton lines={2} lineHeight="12px" />
        <p className="work-insights__loading-text">Analyzing your queue…</p>
      </WorkInsightsCard>
    );
  }

  if (error) {
    return (
      <WorkInsightsCard accentPriority="normal">
        <div className="work-insights__error">
          <ErrorAlert title="Work summary failed" message={error} />
          <button
            type="button"
            className="work-insights__retry"
            onClick={onRetry}
          >
            Try again
          </button>
        </div>
      </WorkInsightsCard>
    );
  }

  if (!data) {
    return null;
  }

  if (isEmptyQueue(data)) {
    return (
      <WorkInsightsCard accentPriority="normal">
        <p className="work-insights__empty">{data.insights.summary}</p>
      </WorkInsightsCard>
    );
  }

  const accentPriority = getAccentPriority(data.insights.themes);

  return (
    <WorkInsightsCard
      accentPriority={accentPriority}
      analyzedCount={data.analyzedCount}
    >
      <p className="work-insights__summary">{data.insights.summary}</p>
      <ul className="work-insights__themes" aria-label="Queue themes">
        {data.insights.themes.map((theme) => (
          <ThemeRow
            key={`${theme.priority}-${theme.theme}`}
            theme={theme}
          />
        ))}
      </ul>
    </WorkInsightsCard>
  );
}
