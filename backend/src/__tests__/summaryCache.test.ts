import { get, set, clear } from '../services/summaryCache';
import { TicketSummary } from '../types';

function makeSummary(overrides: Partial<TicketSummary> = {}): TicketSummary {
    return {
      mainIssue: 'Login broken',
      priorityAssessment: 'high',
      priorityReasoning: 'Customer cannot access account',
      currentStatus: 'open',
      recommendedNextSteps: ['Reset password', 'Verify email'],
      ...overrides,
    };
}

describe('summaryCache', () => {
    beforeEach(() => {
      clear();
    });
  
    // Test 1: miss
    it('returns null on cache miss', () => {
        const result = get(1, 'date-a');
      
        expect(result).toBeNull();
    });



    // Test 2: hit
    it('returns cached summary after set', () => {
        const summary = makeSummary({ mainIssue: 'Payment failed' });
      
        set(1, 'date-a', summary);
      
        const result = get(1, 'date-a');
      
        expect(result).not.toBeNull();
        expect(result!.summary).toEqual(summary);
        expect(result!.generatedAt).toBeDefined();
        expect(typeof result!.generatedAt).toBe('string');
    });



    // Test 3: wrong updated_at
    it('returns null when updated_at does not match', () => {
        const summary = makeSummary();
      
        set(1, 'date-a', summary);
      
        const result = get(1, 'date-b');
      
        expect(result).toBeNull();
    });



    // Test 4: clear
    it('returns null after clear', () => {
        const summary = makeSummary();
      
        set(1, 'date-a', summary);
        clear();
      
        const result = get(1, 'date-a');
      
        expect(result).toBeNull();
    });
});