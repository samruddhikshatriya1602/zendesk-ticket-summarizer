import { Router, Request, Response } from 'express';
import { ApiError } from '../types';

const router = Router({ mergeParams: true });

router.post('/', (_req: Request, res: Response) => {
  const body: ApiError = {
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Summary endpoint will be implemented on Day 5.',
    },
  };
  res.status(501).json(body);
});

export default router;