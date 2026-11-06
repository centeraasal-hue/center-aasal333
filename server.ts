import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './server/routes/api.js';
import { initDatabase } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize SQLite database and tables
initDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Handle JSON body parse errors so they return JSON, never HTML
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).setHeader('Content-Type', 'application/json; charset=utf-8').json({ error: 'صيغة البيانات غير صحيحة' });
    return;
  }
  next(err);
});

// Set default Content-Type for all /api requests
app.use('/api', (_req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// Catch all unhandled /api/* routes so they NEVER fall through to Vite SPA html
app.all('/api/*', (_req, res) => {
  res.status(404).setHeader('Content-Type', 'application/json; charset=utf-8').json({ error: 'الرابط البرمجي غير موجود (404)' });
});

// Global API error handler ensuring JSON response
app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(err.status || 500).setHeader('Content-Type', 'application/json; charset=utf-8').json({
    error: err?.message || 'حدث خطأ في معالجة طلب الخادم'
  });
});

async function startServer() {
  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 سنتر العسال (Al-Assal With You) server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
