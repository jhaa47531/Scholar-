import express from 'express';
import { healthRouter } from './routes/health.ts';
import { authRouter } from './routes/auth.ts';
import { academicRouter } from './routes/academic.ts';
import { assessmentRouter } from './routes/assessments.ts';
import { reportRouter } from './routes/reports.ts';
import { auditRouter } from './routes/audit.ts';
import { migrationRouter } from './routes/migration.ts';

export function createApp() {
  const app = express();
  app.use(express.json());

  // Mount API Routers
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/academic', academicRouter);
  app.use('/api/assessments', assessmentRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/migration', migrationRouter);

  // Strict 404 handler for unmatched /api routes to prevent falling through to Vite SPA index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      code: 'API_NOT_FOUND',
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global JSON error handler for /api routes
  app.use('/api', (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(`[SPIS API Error] ${req.method} ${req.originalUrl}:`, err);
    res.status(err.status || 500).json({
      success: false,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred.',
    });
  });

  return app;
}
