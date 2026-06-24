import { Router, Request, Response } from 'express';
import { ApiError } from '../types';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const body: ApiError = {
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Ticket list endpoint will be implemented on Day 2.',
    },
  };
  res.status(501).json(body);
});

router.get('/:id', (_req: Request, res: Response) => {
  const body: ApiError = {
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Ticket detail endpoint will be implemented on Day 2.',
    },
  };
  res.status(501).json(body);
});

export default router;