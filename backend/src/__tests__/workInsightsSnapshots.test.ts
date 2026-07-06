import {
  capSnapshotsForAi,
  filterActiveWorkSnapshots,
  prepareSnapshotsForAi,
  sortSnapshotsByPriority,
} from '../services/workInsightsSnapshots';
import { TicketSnapshot } from '../types';

function makeSnapshot(
  id: number,
  priority: string | null,
  status = 'open'
): TicketSnapshot {
  return {
    id,
    subject: `Ticket ${id}`,
    status,
    priority,
  };
}

describe('workInsightsSnapshots', () => {
  beforeEach(() => {
    delete process.env.WORK_INSIGHTS_AI_TICKET_LIMIT;
  });

  it('sorts urgent before high before normal', () => {
    const snapshots = [
      makeSnapshot(1, 'normal'),
      makeSnapshot(2, 'high'),
      makeSnapshot(3, 'urgent'),
    ];

    const sorted = sortSnapshotsByPriority(snapshots);

    expect(sorted.map((ticket) => ticket.priority)).toEqual([
      'urgent',
      'high',
      'normal',
    ]);
  });

  it('sorts by priority urgent → high → normal → low → null', () => {
    const snapshots = [
      makeSnapshot(1, 'low'),
      makeSnapshot(2, null),
      makeSnapshot(3, 'urgent'),
      makeSnapshot(4, 'normal'),
      makeSnapshot(5, 'high'),
    ];

    const sorted = sortSnapshotsByPriority(snapshots);

    expect(sorted.map((ticket) => ticket.id)).toEqual([3, 5, 4, 1, 2]);
  });

  it('sorts open before pending within the same priority', () => {
    const snapshots = [
      makeSnapshot(1, 'high', 'pending'),
      makeSnapshot(2, 'high', 'open'),
    ];

    const sorted = sortSnapshotsByPriority(snapshots);

    expect(sorted.map((ticket) => ticket.id)).toEqual([2, 1]);
  });

  it('filterActiveWorkSnapshots keeps only open and pending tickets', () => {
    const snapshots = [
      makeSnapshot(1, 'high', 'open'),
      makeSnapshot(2, 'urgent', 'solved'),
      makeSnapshot(3, 'normal', 'pending'),
      makeSnapshot(4, 'low', 'closed'),
      makeSnapshot(5, 'high', 'new'),
    ];

    const active = filterActiveWorkSnapshots(snapshots);

    expect(active.map((ticket) => ticket.id)).toEqual([1, 3]);
    expect(active.every((ticket) => ['open', 'pending'].includes(ticket.status))).toBe(
      true
    );
  });

  it('keeps Zendesk order when priority and status are tied', () => {
    const snapshots = [
      makeSnapshot(10, 'normal', 'open'),
      makeSnapshot(11, 'normal', 'open'),
      makeSnapshot(12, 'normal', 'open'),
    ];

    const sorted = sortSnapshotsByPriority(snapshots);

    expect(sorted.map((ticket) => ticket.id)).toEqual([10, 11, 12]);
  });

  it('caps sorted snapshots for AI using WORK_INSIGHTS_AI_TICKET_LIMIT', () => {
    process.env.WORK_INSIGHTS_AI_TICKET_LIMIT = '3';

    const snapshots = [
      makeSnapshot(1, 'low'),
      makeSnapshot(2, 'urgent'),
      makeSnapshot(3, 'high'),
      makeSnapshot(4, 'normal'),
      makeSnapshot(5, 'high'),
    ];

    const sorted = sortSnapshotsByPriority(snapshots);
    const forAi = capSnapshotsForAi(sorted);

    expect(forAi.map((ticket) => ticket.id)).toEqual([2, 3, 5]);
    expect(forAi).toHaveLength(3);
  });

  it('prepareSnapshotsForAi ignores solved and closed tickets', () => {
    process.env.WORK_INSIGHTS_AI_TICKET_LIMIT = '10';

    const snapshots = [
      makeSnapshot(1, 'low', 'solved'),
      makeSnapshot(2, 'urgent', 'open'),
      makeSnapshot(3, 'high', 'closed'),
      makeSnapshot(4, 'normal', 'pending'),
    ];

    const result = prepareSnapshotsForAi(snapshots);

    expect(result.sorted.map((ticket) => ticket.id)).toEqual([2, 4]);
    expect(result.forAi.map((ticket) => ticket.id)).toEqual([2, 4]);
    expect(result.analyzedCount).toBe(2);
  });

  it('prepareSnapshotsForAi returns sorted list, capped AI list, and analyzedCount', () => {
    process.env.WORK_INSIGHTS_AI_TICKET_LIMIT = '2';

    const snapshots = [
      makeSnapshot(1, 'low'),
      makeSnapshot(2, 'urgent'),
      makeSnapshot(3, 'high'),
    ];

    const result = prepareSnapshotsForAi(snapshots);

    expect(result.sorted.map((ticket) => ticket.id)).toEqual([2, 3, 1]);
    expect(result.forAi.map((ticket) => ticket.id)).toEqual([2, 3]);
    expect(result.analyzedCount).toBe(2);
  });
});
