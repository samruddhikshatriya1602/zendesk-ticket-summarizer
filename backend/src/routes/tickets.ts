import { Router, Request, Response, NextFunction } from 'express';
import {
  listTickets,
  getTicketById,
  getTicketComments,
  ZendeskError,
} from '../services/zendeskService';


// VALIDATION HELPERS
function parsePage(value: unknown): number | null {
    const page = Number(value ?? 1);
    if (!Number.isInteger(page) || page < 1) return null;
    return page;
  }
  
  function parsePerPage(value: unknown): number | null {
    const perPage = Number(value ?? 30);
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) return null;
    return perPage;
  }
  
  function parseTicketId(value: unknown): number | null {
    const str = Array.isArray(value) ? value[0] : value;
    const id = Number(str);
    if (!Number.isInteger(id) || id < 1) return null;
    return id;
  }



  // SEND ZENDESK ERROR
  function sendZendeskError(err: unknown, res: Response): boolean {
    if (!(err instanceof ZendeskError)) return false;
  
    const statusMap: Record<string, number> = {
      TICKET_NOT_FOUND: 404,
      ZENDESK_UNAUTHORIZED: 502,
      ZENDESK_RATE_LIMITED: 503,
      ZENDESK_NETWORK_ERROR: 503,
      ZENDESK_ERROR: 502,
    };
  
    const status = statusMap[err.code] ?? 502;
  
    res.status(status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  
    return true;
  }


const router = Router();

// LIST TICKETS ROUTE
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parsePage(req.query.page);
      if (page === null) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'page must be a positive integer.' },
        });
      }
  
      const perPage = parsePerPage(req.query.per_page);
      if (perPage === null) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'per_page must be an integer between 1 and 100.',
          },
        });
      }
  
      const result = await listTickets(page, perPage);
      res.status(200).json(result);
    } catch (err) {
      if (sendZendeskError(err, res)) return;
      next(err);
    }
  });



  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseTicketId(req.params.id);
      if (id === null) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Ticket id must be a positive integer.' },
        });
      }
  
      const [ticket, comments] = await Promise.all([
        getTicketById(id),
        getTicketComments(id),
      ]);
  
      res.status(200).json({ ticket, comments });
    } catch (err) {
      if (sendZendeskError(err, res)) return;
      next(err);
    }
  });

  export default router;