import type { TicketSummary } from '../types';

export function formatSummaryForCopy(summary: TicketSummary): string {
  const steps = summary.recommendedNextSteps
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');

  return [
    'Main issue',
    summary.mainIssue,
    '',
    'Priority',
    summary.priorityAssessment,
    '',
    'Why this priority',
    summary.priorityReasoning,
    '',
    'Current status',
    summary.currentStatus,
    '',
    'Recommended next steps',
    steps,
  ].join('\n');
}

export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Copy is not supported in this browser.');
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    throw new Error('Could not copy to clipboard. Please try again.');
  }
}