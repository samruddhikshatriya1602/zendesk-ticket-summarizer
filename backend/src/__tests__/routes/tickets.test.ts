// GOAL
// Prove your HTTP layer:

// - Correct status codes (200, 400, 404, 502)
// - Validation before service calls
// - Response JSON shape { tickets, meta } and { ticket, comments }
// - Error shape { error: { code, message } }
// Without calling real listTickets or Zendesk.

jest.mock('../../services/zendeskService', () => {
  const actual = jest.requireActual('../../services/zendeskService');
  return {
    ...actual,
    listTickets: jest.fn(),
    searchTickets: jest.fn(),
    getTicketById: jest.fn(),
    getTicketComments: jest.fn(),
  };
});

import request from 'supertest';
import app from '../../index';
import * as zendeskService from '../../services/zendeskService';
import { ZendeskError } from '../../services/zendeskService';

const mockedListTickets = jest.mocked(zendeskService.listTickets);
const mockedSearchTickets = jest.mocked(zendeskService.searchTickets);
const mockedGetTicketById = jest.mocked(zendeskService.getTicketById);
const mockedGetTicketComments = jest.mocked(zendeskService.getTicketComments);

// Step 8B.3 — beforeEach reset mocks
describe('GET /api/tickets', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
  
    // tests...

    // Test 1 — GET /api/tickets returns 200 + shape (required)
    it('returns 200 with tickets and meta', async () => {
        mockedListTickets.mockResolvedValueOnce({
          tickets: [
            {
              id: 1,
              subject: 'Test',
              description: '',
              status: 'open',
              priority: null,
              created_at: '2026-06-20T10:15:30Z',
              updated_at: '2026-06-20T10:15:30Z',
            },
          ],
          meta: { page: 1, per_page: 30, has_more: false },
        });
      
        const res = await request(app)
          .get('/api/tickets')
          .query({ page: 1, per_page: 30 });
      
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('tickets');
        expect(res.body).toHaveProperty('meta');
        expect(res.body.meta).toMatchObject({ page: 1, per_page: 30, has_more: false });
        expect(Array.isArray(res.body.tickets)).toBe(true);
        expect(mockedListTickets).toHaveBeenCalledWith(1, 30, undefined);
      });

      it('returns 200 from searchTickets when q is provided', async () => {
        mockedSearchTickets.mockResolvedValueOnce({
          tickets: [
            {
              id: 99,
              subject: 'Password reset',
              description: '',
              status: 'open',
              priority: 'high',
              created_at: '2026-06-20T10:15:30Z',
              updated_at: '2026-06-20T10:15:30Z',
            },
          ],
          meta: { page: 1, per_page: 30, has_more: false },
        });

        const res = await request(app)
          .get('/api/tickets')
          .query({ page: 1, per_page: 30, q: 'password', status: 'open' });

        expect(res.status).toBe(200);
        expect(res.body.tickets).toHaveLength(1);
        expect(mockedSearchTickets).toHaveBeenCalledWith('password', 1, 30, {
          status: 'open',
          priority: undefined,
        });
        expect(mockedListTickets).not.toHaveBeenCalled();
      });

      it('uses listTickets when q is empty', async () => {
        mockedListTickets.mockResolvedValueOnce({
          tickets: [],
          meta: { page: 1, per_page: 30, has_more: false },
        });

        const res = await request(app)
          .get('/api/tickets')
          .query({ page: 1, per_page: 30, q: '   ' });

        expect(res.status).toBe(200);
        expect(mockedListTickets).toHaveBeenCalledWith(1, 30, undefined);
        expect(mockedSearchTickets).not.toHaveBeenCalled();
      });



      // Test 2 — GET /api/tickets?page=abc → 400 (required)
      it('returns 400 when page is invalid', async () => {
        const res = await request(app)
          .get('/api/tickets')
          .query({ page: 'abc' });
      
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('BAD_REQUEST');
        expect(res.body.error.message).toMatch(/page/i);
        expect(mockedListTickets).not.toHaveBeenCalled();
      });



      // Test 3 — GET /api/tickets/:id returns 200 + shape (required)
      describe('GET /api/tickets/:id', () => {
        beforeEach(() => {
          jest.resetAllMocks();
        });
      
        it('returns 200 with ticket and comments', async () => {
          mockedGetTicketById.mockResolvedValueOnce({
            id: 42,
            subject: 'Help',
            description: 'Need help',
            status: 'open',
            priority: null,
            created_at: '2026-06-20T10:15:30Z',
            updated_at: '2026-06-20T10:15:30Z',
          });
      
          mockedGetTicketComments.mockResolvedValueOnce([
            {
              id: 90001,
              author_id: 111,
              body: 'Need help',
              public: true,
              created_at: '2026-06-20T10:15:30Z',
            },
          ]);
      
          const res = await request(app).get('/api/tickets/42');
      
          expect(res.status).toBe(200);
          expect(res.body.ticket.id).toBe(42);
          expect(res.body.comments).toHaveLength(1);
          expect(mockedGetTicketById).toHaveBeenCalledWith(42);
          expect(mockedGetTicketComments).toHaveBeenCalledWith(42);
        });
      });



      // Test 4 — GET /api/tickets/abc → 400 (required)
      it('returns 400 when ticket id is not a number', async () => {
        const res = await request(app).get('/api/tickets/abc');
      
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('BAD_REQUEST');
        expect(mockedGetTicketById).not.toHaveBeenCalled();
        expect(mockedGetTicketComments).not.toHaveBeenCalled();
      });



      // Test 5 — Zendesk error from service → 502/404 + error shape (required)
      it('returns 404 when ticket is not found', async () => {
        mockedGetTicketById.mockRejectedValueOnce(
          new ZendeskError('TICKET_NOT_FOUND', 'Ticket not found.')
        );
        mockedGetTicketComments.mockResolvedValueOnce([]);
      
        const res = await request(app).get('/api/tickets/999');
      
        expect(res.status).toBe(404);
        expect(res.body.error).toEqual({
          code: 'TICKET_NOT_FOUND',
          message: 'Ticket not found.',
        });
      });

      it('returns 502 when Zendesk auth fails on list', async () => {
        mockedListTickets.mockRejectedValueOnce(
          new ZendeskError(
            'ZENDESK_UNAUTHORIZED',
            'Could not authenticate with Zendesk. Check backend .env credentials.'
          )
        );
      
        const res = await request(app)
          .get('/api/tickets')
          .query({ page: 1, per_page: 30 });
      
        expect(res.status).toBe(502);
        expect(res.body.error.code).toBe('ZENDESK_UNAUTHORIZED');
        expect(res.body.error.message).not.toMatch(/fake-test-token|api_token/i);
      });
  });