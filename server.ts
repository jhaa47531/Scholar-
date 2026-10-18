import { spawn } from 'node:child_process';

const isTsxLoaded =
  process.execArgv.some((arg) => arg.includes('tsx')) ||
  process.env.__TSX_ACTIVE === '1' ||
  typeof (process as any)[Symbol.for('tsx')] !== 'undefined';

if (!isTsxLoaded) {
  const child = spawn(process.execPath, ['--import', 'tsx', ...process.argv.slice(1)], {
    env: { ...process.env, __TSX_ACTIVE: '1' },
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
} else {
  runServer();
}

async function runServer() {
  const express = (await import('express')).default;
  const path = (await import('path')).default;
  const { fileURLToPath } = await import('url');
  const { createServer: createViteServer } = await import('vite');
  const { createApp } = await import('./src/server/app.ts');
  const { initializeFirebaseAdmin } = await import('./src/server/auth/firebaseAdmin.ts');
  const { initializeRepositories } = await import('./src/repositories/index.ts');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

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

