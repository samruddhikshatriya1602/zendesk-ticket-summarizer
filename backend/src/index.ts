import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ticketsRouter from './routes/tickets';
import summaryRouter from './routes/summary';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// 1. CORS — lets React (port 5173) call this API from the browser
app.use(
  cors({
    origin: CORS_ORIGIN,
  })
);

// 2. JSON parser — needed for POST /api/tickets/:id/summary later
app.use(express.json());

// Health check (Day 1 deliverable)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Ticket routes
app.use('/api/tickets', ticketsRouter);

// Summary route: POST /api/tickets/:id/summary
app.use('/api/tickets/:id/summary', summaryRouter);

// 404 — friendly JSON for unknown URLs
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist.',
    },
  });
});

// 500 — unexpected server errors
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server error]', err.message);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on the server. Please try again.',
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

export default app;