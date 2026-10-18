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

  return app;
}
