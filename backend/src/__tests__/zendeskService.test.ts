// GOAL
// Prove your service:

// - Builds correct URLs / auth
// - Maps Zendesk JSON → your types
// - Throws ZendeskError on 401
// - Handles empty lists safely
// All without network.



import {
    listTickets,
    getTicketById,
    ZendeskError,
  } from '../services/zendeskService';

// Setup: mock fetch + fake env (every test)
describe('zendeskService', () => {
    const mockFetch = jest.fn();
  
    beforeEach(() => {
      jest.resetAllMocks();
      global.fetch = mockFetch as unknown as typeof fetch;
  
      process.env.ZENDESK_SUBDOMAIN = 'z3n-test';
      process.env.ZENDESK_EMAIL = 'test@example.com';
      process.env.ZENDESK_API_TOKEN = 'fake-test-token';
    });


    // Test 1 — 200 list success + normalization (required)
    it('lists tickets and normalizes response (200)', async () => {
        mockFetch.mockResolvedValueOnce(
          mockJsonResponse({
            tickets: [
              {
                id: 3549,
                subject: 'Login not working',
                description: 'Cannot reset password',
                status: 'open',
                priority: 'high',
                created_at: '2026-06-20T10:15:30Z',
                updated_at: '2026-06-24T14:22:01Z',
                requester_id: 999999, // extra — must NOT appear in result
              },
            ],
            meta: { has_more: false, after_cursor: null },
          })
        );
      
        const result = await listTickets(1, 30);
      
        expect(result.tickets).toHaveLength(1);
        expect(result.tickets[0]).toEqual({
          id: 3549,
          subject: 'Login not working',
          description: 'Cannot reset password',
          status: 'open',
          priority: 'high',
          created_at: '2026-06-20T10:15:30Z',
          updated_at: '2026-06-24T14:22:01Z',
        });
        expect(result.meta).toMatchObject({
          page: 1,
          per_page: 30,
          has_more: false,
        });
        expect(result.tickets[0]).not.toHaveProperty('requester_id');
      
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('z3n-test.zendesk.com/api/v2/tickets.json'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: expect.stringMatching(/^Basic /),
            }),
          })
        );
      });


  // Test 2 — 401 throws ZENDESK_UNAUTHORIZED (required)
  it('throws ZENDESK_UNAUTHORIZED on 401', async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ error: 'Could not authenticate you' }, 401)
    );
  
    await expect(listTickets(1, 30)).rejects.toMatchObject({
      code: 'ZENDESK_UNAUTHORIZED',
    });
  });


  // Test 3 — Empty list (required)
  it('returns empty tickets array when Zendesk has no tickets', async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({
        tickets: [],
        meta: { has_more: false },
      })
    );
  
    const result = await listTickets(1, 30);
  
    expect(result.tickets).toEqual([]);
    expect(result.meta.has_more).toBe(false);
    expect(result.meta.page).toBe(1);
    expect(result.meta.per_page).toBe(30);
  });


  // Test 4 — Normalization: null priority / missing description (required)
  it('normalizes missing priority to null and missing description to empty string', async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({
        tickets: [
          {
            id: 1,
            subject: 'Billing',
            status: 'open',
            created_at: '2026-06-20T10:15:30Z',
            updated_at: '2026-06-23T09:10:00Z',
          },
        ],
        meta: { has_more: false },
      })
    );
  
    const result = await listTickets(1, 30);
  
    expect(result.tickets[0].priority).toBeNull();
    expect(result.tickets[0].description).toBe('');
  });


  // Test 5 — getTicketById uses data.ticket (optional but recommended)
  it('fetches ticket by id and maps data.ticket', async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({
        ticket: {
          id: 42,
          subject: 'Help',
          description: 'Need help',
          status: 'open',
          priority: null,
          created_at: '2026-06-20T10:15:30Z',
          updated_at: '2026-06-20T10:15:30Z',
        },
      })
    );
  
    const ticket = await getTicketById(42);
  
    expect(ticket.id).toBe(42);
    expect(ticket.subject).toBe('Help');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tickets/42.json'),
      expect.any(Object)
    );
  });

});

// Helper: fake successful Response
function mockJsonResponse(body: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }