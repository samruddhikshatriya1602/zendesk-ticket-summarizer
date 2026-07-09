import { Router, Request, Response, NextFunction } from 'express';
import {
  listTickets,
  searchTickets,
  getTicketById,
  getTicketComments,
} from '../services/zendeskService';
import {
  parseTicketId,
  sendZendeskError,
} from '../utils/routeHelpers';
import summaryRouter from './summary';

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

function parseSearchQuery(value: unknown): string | null {
  if (Array.isArray(value)) {
    return null;
  }

  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value !== 'string') {
    return null;
  }

  return value.trim();
}

function parseOptionalFilter(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed === '' || trimmed === 'all' ? undefined : trimmed;
}

function parseCursor(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

const router = Router();

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

    const searchQuery = parseSearchQuery(req.query.q);
    if (searchQuery === null) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'q must be a string.',
        },
      });
    }

    const cursor = parseCursor(req.query.cursor);

    const result =
      searchQuery.length > 0
        ? await searchTickets(searchQuery, page, perPage, {
            status: parseOptionalFilter(req.query.status),
            priority: parseOptionalFilter(req.query.priority),
          })
        : await listTickets(page, perPage, cursor);

    res.status(200).json(result);
  } catch (err) {
    if (sendZendeskError(err, res)) return;
    next(err);
  }
});

router.use('/:id/summary', summaryRouter);

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
