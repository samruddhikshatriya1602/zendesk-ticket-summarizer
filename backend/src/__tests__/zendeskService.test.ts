// GOAL
// Prove your service:

// - Builds correct URLs / auth
// - Maps Zendesk JSON → your types
// - Throws ZendeskError on 401
// - Handles empty lists safely
// All without network.



import {
    listTickets,
    searchTickets,
    getTicketById,
    fetchAllTicketSnapshots,
    buildTicketSearchQuery,
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


  describe('searchTickets', () => {
    it('searches tickets and normalizes search results', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse({
          results: [
            {
              result_type: 'ticket',
              id: 10482,
              subject: 'Password reset failed',
              description: 'Customer cannot log in',
              status: 'open',
              priority: 'high',
              created_at: '2026-06-20T10:15:30Z',
              updated_at: '2026-06-24T14:22:01Z',
            },
          ],
          next_page: 'https://z3n-test.zendesk.com/api/v2/search.json?page=2',
        })
      );

      const result = await searchTickets('password', 1, 30, { status: 'open' });

      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0].subject).toBe('Password reset failed');
      expect(result.meta).toMatchObject({
        page: 1,
        per_page: 30,
        has_more: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search.json?'),
        expect.any(Object)
      );
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('query=type%3Aticket');
      expect(url).toContain('password');
      expect(url).toContain('status%3Aopen');
    });

    it('returns empty tickets when search has no matches', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse({
          results: [],
          next_page: null,
        })
      );

      const result = await searchTickets('missing-topic', 1, 30);

      expect(result.tickets).toEqual([]);
      expect(result.meta.has_more).toBe(false);
    });
  });

  describe('buildTicketSearchQuery', () => {
    it('builds a full-account ticket search query with optional filters', () => {
      expect(buildTicketSearchQuery('password reset')).toBe(
        'type:ticket (subject:"password reset" OR description:"password reset")'
      );
      expect(buildTicketSearchQuery('10482')).toBe('type:ticket 10482');
      expect(buildTicketSearchQuery('veri')).toBe('type:ticket subject:veri*');
      expect(
        buildTicketSearchQuery('billing', { status: 'open', priority: 'high' })
      ).toBe('type:ticket subject:billing* status:open priority:high');
    });
  });


  describe('fetchAllTicketSnapshots', () => {
    function makeZendeskTicket(id: number) {
      return {
        id,
        subject: `Ticket ${id}`,
        description: 'Should not appear in snapshot',
        status: 'open',
        priority: 'high',
        created_at: '2026-06-20T10:15:30Z',
        updated_at: '2026-06-24T14:22:01Z',
        requester_id: 999999,
      };
    }

    it('returns lightweight snapshots with only id, subject, status, priority', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse({
          tickets: [makeZendeskTicket(1)],
          meta: { has_more: false },
        })
      );

      const result = await fetchAllTicketSnapshots();

      expect(result).toEqual([
        {
          id: 1,
          subject: 'Ticket 1',
          status: 'open',
          priority: 'high',
        },
      ]);
      expect(result[0]).not.toHaveProperty('description');
      expect(result[0]).not.toHaveProperty('created_at');
    });

    it('paginates with cursor until has_more is false', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockJsonResponse({
            tickets: [makeZendeskTicket(1), makeZendeskTicket(2)],
            meta: { has_more: true, after_cursor: 'cursor-page-2' },
          })
        )
        .mockResolvedValueOnce(
          mockJsonResponse({
            tickets: [makeZendeskTicket(3)],
            meta: { has_more: false },
          })
        );

      const result = await fetchAllTicketSnapshots();

      expect(result).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0]).toContain('page%5Bafter%5D=cursor-page-2');
    });

    it('stops at WORK_INSIGHTS_MAX_TICKETS cap', async () => {
      process.env.WORK_INSIGHTS_MAX_TICKETS = '3';

      mockFetch
        .mockResolvedValueOnce(
          mockJsonResponse({
            tickets: [makeZendeskTicket(1), makeZendeskTicket(2)],
            meta: { has_more: true, after_cursor: 'cursor-page-2' },
          })
        )
        .mockResolvedValueOnce(
          mockJsonResponse({
            tickets: [makeZendeskTicket(3), makeZendeskTicket(4)],
            meta: { has_more: true, after_cursor: 'cursor-page-3' },
          })
        );

      const result = await fetchAllTicketSnapshots();

      expect(result).toHaveLength(3);
      expect(result.map((ticket) => ticket.id)).toEqual([1, 2, 3]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('returns an empty array when Zendesk has no tickets', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse({
          tickets: [],
          meta: { has_more: false },
        })
      );

      const result = await fetchAllTicketSnapshots();

      expect(result).toEqual([]);
    });

    it('stops paginating when has_more is true but after_cursor is missing', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockJsonResponse({
            tickets: [makeZendeskTicket(1), makeZendeskTicket(2)],
            meta: { has_more: true },
          })
        )
        .mockResolvedValueOnce(
          mockJsonResponse({
            tickets: [makeZendeskTicket(1), makeZendeskTicket(2)],
            meta: { has_more: true },
          })
        );

      const result = await fetchAllTicketSnapshots();

      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
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