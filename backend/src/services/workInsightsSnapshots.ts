import { TicketSnapshot } from '../types';

const DEFAULT_WORK_INSIGHTS_AI_TICKET_LIMIT = 300;

const ACTIVE_WORK_STATUSES = new Set(['open', 'pending']);

const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

// Within the same priority, open tickets appear before pending.
const STATUS_RANK: Record<string, number> = {
  open: 0,
  pending: 1,
};

function getPriorityRank(priority: string | null): number {
  if (!priority || priority.trim() === '') {
    return 4;
  }

  return PRIORITY_RANK[priority.toLowerCase()] ?? 4;
}

function getStatusRank(status: string): number {
  return STATUS_RANK[status.toLowerCase()] ?? 6;
}

export function getWorkInsightsAiTicketLimit(): number {
  const raw = process.env.WORK_INSIGHTS_AI_TICKET_LIMIT;
  if (!raw || raw.trim() === '') {
    return DEFAULT_WORK_INSIGHTS_AI_TICKET_LIMIT;
  }

  const limit = Number(raw);
  if (!Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_WORK_INSIGHTS_AI_TICKET_LIMIT;
  }

  return Math.floor(limit);
}

/** Keep only open and pending tickets — active agent work queue. */
export function filterActiveWorkSnapshots(
  snapshots: TicketSnapshot[]
): TicketSnapshot[] {
  return snapshots.filter((snapshot) =>
    ACTIVE_WORK_STATUSES.has(snapshot.status.toLowerCase())
  );
}

/**
 * Sort snapshots for work-insights analysis:
 * 1. priority (urgent → high → normal → low → none)
 * 2. status (open before pending)
 * 3. original Zendesk order when still tied
 */
export function sortSnapshotsByPriority(
  snapshots: TicketSnapshot[]
): TicketSnapshot[] {
  return snapshots
    .map((snapshot, index) => ({ snapshot, index }))
    .sort((left, right) => {
      const priorityDiff =
        getPriorityRank(left.snapshot.priority) -
        getPriorityRank(right.snapshot.priority);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const statusDiff =
        getStatusRank(left.snapshot.status) -
        getStatusRank(right.snapshot.status);
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return left.index - right.index;
    })
    .map(({ snapshot }) => snapshot);
}

/** After sorting, keep only the top N snapshots that will be sent to AI. */
export function capSnapshotsForAi(
  sortedSnapshots: TicketSnapshot[],
  limit = getWorkInsightsAiTicketLimit()
): TicketSnapshot[] {
  return sortedSnapshots.slice(0, limit);
}

/** Filter to open/pending, sort by priority, then apply the AI payload cap. */
export function prepareSnapshotsForAi(snapshots: TicketSnapshot[]): {
  sorted: TicketSnapshot[];
  forAi: TicketSnapshot[];
  analyzedCount: number;
} {
  const active = filterActiveWorkSnapshots(snapshots);
  const sorted = sortSnapshotsByPriority(active);
  const forAi = capSnapshotsForAi(sorted);

  return {
    sorted,
    forAi,
    analyzedCount: forAi.length,
  };
}
