import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createApp } from './src/server/app.ts';
import { initializeFirebaseAdmin } from './src/server/auth/firebaseAdmin.ts';
import { initializeRepositories } from './src/repositories/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // 1. Initialize Firebase Admin if credentials configured
  initializeFirebaseAdmin();

  // 2. Initialize Repositories (Cloud Firestore if available, In-Memory fallback)
  await initializeRepositories();

  const app = createApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // In dev: mount Vite middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In prod: serve static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SPIS Server] Running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
    console.log(`[SPIS Server] Health Check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('[SPIS Server Error] Failed to start:', err);
  process.exit(1);
});
