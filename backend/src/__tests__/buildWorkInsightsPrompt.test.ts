import { buildWorkInsightsPrompt } from '../services/buildWorkInsightsPrompt';
import { TicketSnapshot } from '../types';

function makeSnapshot(overrides: Partial<TicketSnapshot> = {}): TicketSnapshot {
  return {
    id: 123,
    subject: 'Refund not processed',
    status: 'open',
    priority: 'high',
    ...overrides,
  };
}

describe('buildWorkInsightsPrompt', () => {
  it('includes analyzed and total ticket counts in the header', () => {
    const prompt = buildWorkInsightsPrompt([makeSnapshot()], {
      ticketCount: 500,
      analyzedCount: 300,
    });

    expect(prompt).toContain('TICKETS (300 analyzed of 500 total');
  });

  it('formats each ticket as id|subject|status|priority on one line', () => {
    const prompt = buildWorkInsightsPrompt(
      [
        makeSnapshot({
          id: 123,
          subject: 'Refund not processed',
          status: 'open',
          priority: 'high',
        }),
      ],
      { ticketCount: 1 }
    );

    expect(prompt).toContain('123|Refund not processed|open|high');
  });

  it('sanitizes pipe characters and newlines in subject fields', () => {
    const prompt = buildWorkInsightsPrompt(
      [
        makeSnapshot({
          id: 9,
          subject: 'API|error\non login',
          status: 'pending',
          priority: 'urgent',
        }),
      ],
      { ticketCount: 1 }
    );

    expect(prompt).toContain('9|API/error on login|pending|urgent');
    expect(prompt).not.toContain('API|error');
  });

  it('uses none when priority is null', () => {
    const prompt = buildWorkInsightsPrompt(
      [makeSnapshot({ id: 7, priority: null })],
      { ticketCount: 1 }
    );

    expect(prompt).toContain('7|Refund not processed|open|none');
  });

  it('includes work insights JSON schema and anti-bias rules', () => {
    const prompt = buildWorkInsightsPrompt([makeSnapshot()], { ticketCount: 1 });

    expect(prompt).toContain('"headline": "Summary of your work"');
    expect(prompt).toContain('"themes"');
    expect(prompt).toContain('max 25 words');
    expect(prompt).toContain('urgent | high | normal | low');
    expect(prompt).toContain('Do not use "mixed"');
    expect(prompt).toContain('Analyze ONLY the TICKETS section above');
    expect(prompt).toContain('Do not invent issues');
    expect(prompt).not.toContain('refund not being processed');
    expect(prompt).not.toContain('"count": 10');
  });

  it('shows a placeholder when there are no tickets', () => {
    const prompt = buildWorkInsightsPrompt([], { ticketCount: 0, analyzedCount: 0 });

    expect(prompt).toContain('(no tickets)');
    expect(prompt).toContain('TICKETS (0 analyzed of 0 total');
  });
});
