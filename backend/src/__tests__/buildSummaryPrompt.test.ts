import { buildSummaryPrompt } from '../services/buildSummaryPrompt';
import { Ticket, TicketComment } from '../types';

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
    return {
      id: 42,
      subject: 'Login not working',
      description: 'Cannot reset password',
      status: 'open',
      priority: 'high',
      created_at: '2026-06-01T10:00:00Z',
      updated_at: '2026-06-02T14:00:00Z',
      ...overrides,
    };
  }

  function makeComment(overrides: Partial<TicketComment> = {}): TicketComment {
    return {
      id: 1001,
      author_id: 99,
      body: 'I still cannot log in',
      public: true,
      created_at: '2026-06-02T12:00:00Z',
      ...overrides,
    };
  }

// Wrap tests in describe
describe('buildSummaryPrompt', () => {
    // Test 1: includes ticket fields
    it('includes ticket subject, status, and priority in the prompt', () => {
        const ticket = makeTicket({
          subject: 'Payment failed',
          status: 'pending',
          priority: 'urgent',
        });
      
        const prompt = buildSummaryPrompt(ticket, []);
      
        expect(prompt).toContain('Payment failed');
        expect(prompt).toContain('pending');
        expect(prompt).toContain('urgent');
        expect(prompt).toContain('TICKET:');
        expect(prompt).toContain('mainIssue');
      });


      // Test 2: includes comments
      it('includes public comment body text in the prompt', () => {
        const ticket = makeTicket();
        const comments = [
          makeComment({ body: 'Please reset my password ASAP' }),
          makeComment({
            id: 1002,
            body: 'Still locked out after 24 hours',
            created_at: '2026-06-03T09:00:00Z',
          }),
        ];
      
        const prompt = buildSummaryPrompt(ticket, comments);
      
        expect(prompt).toContain('Please reset my password ASAP');
        expect(prompt).toContain('Still locked out after 24 hours');
        expect(prompt).toContain('COMMENTS (oldest first):');
      });


      // Test 3: truncates long comment
      it('truncates long comment bodies with ellipsis', () => {
        const ticket = makeTicket();
        const longBody = 'A'.repeat(600);
      
        const prompt = buildSummaryPrompt(ticket, [
          makeComment({ body: longBody }),
        ]);
      
        expect(prompt).toContain('...');
        expect(prompt).not.toContain(longBody);
      });


      // Test 4: limits comment count to last 10
      it('includes only the last 10 public comments when more are provided', () => {
        const ticket = makeTicket();
      
        const comments: TicketComment[] = Array.from({ length: 15 }, (_, i) => {
          const n = i + 1;
          return makeComment({
            id: 2000 + n,
            body: `COMMENT-${String(n).padStart(2, '0')}`,
            created_at: `2026-06-${String(n).padStart(2, '0')}T10:00:00Z`,
          });
        });
      
        const prompt = buildSummaryPrompt(ticket, comments);
      
        // First 5 should be dropped (only last 10 kept: 06–15)
        expect(prompt).not.toContain('COMMENT-01');
        expect(prompt).not.toContain('COMMENT-05');
      
        // Last 10 should be present
        expect(prompt).toContain('COMMENT-06');
        expect(prompt).toContain('COMMENT-15');
      
        // Sanity: middle of the kept range
        expect(prompt).toContain('COMMENT-10');
      });


      // Optional Test 5 (private comments skipped)
      it('skips non-public comments', () => {
        const ticket = makeTicket();
        const comments = [
          makeComment({ body: 'PUBLIC-VISIBLE', public: true }),
          makeComment({ body: 'INTERNAL-HIDDEN', public: false }),
        ];
      
        const prompt = buildSummaryPrompt(ticket, comments);
      
        expect(prompt).toContain('PUBLIC-VISIBLE');
        expect(prompt).not.toContain('INTERNAL-HIDDEN');
      });
});