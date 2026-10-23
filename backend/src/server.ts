import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth.js';
import leadsRouter from './routes/leads.js';
import salesRouter from './routes/sales.js';
import adminRouter from './routes/admin.js';
import monthlyRouter from './routes/monthly.js';
import supportRouter from './routes/support.js';
import crmRouter from './routes/crm.js';

const app = express();
const port = Number(process.env.PORT) || 5000;

export const prisma = new PrismaClient();

// Configure CORS
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Define API routes
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/leads', monthlyRouter);
app.use('/api/sales', salesRouter);
app.use('/api/sales-reps', monthlyRouter);
app.use('/api/admin', adminRouter);
app.use('/api/support', supportRouter);
app.use('/api/crm', crmRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Resolve frontend dist directory (supports dev, local prod, and packaged Electron)
const possibleFrontendDirs = [
  path.join(process.cwd(), 'frontend', 'dist'),
  path.join(process.cwd(), '..', 'frontend', 'dist'),
  path.join(__dirname, '..', '..', 'frontend', 'dist'),
  path.join(__dirname, '..', 'frontend', 'dist'),
  path.join((process as any).resourcesPath || '', 'frontend', 'dist'),
  path.join((process as any).resourcesPath || '', 'app', 'frontend', 'dist'),
];

let frontendDistDir = possibleFrontendDirs.find((dir) => fs.existsSync(dir));

if (frontendDistDir) {
  console.log(`[Novotion API] Serving static frontend from: ${frontendDistDir}`);
  app.use(express.static(frontendDistDir));

  // Catch-all route to support client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistDir!, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export function startServer(customPort?: number): Promise<number> {
  return new Promise((resolve) => {
    const listenPort = customPort || port;
    const server = app.listen(listenPort, '0.0.0.0', () => {
      console.log(`[Novotion API] Server listening at http://0.0.0.0:${listenPort}`);
      resolve(listenPort);
    });
  });
}

const isCloudFunction = Boolean(
  process.env.FUNCTION_NAME || 
  process.env.K_SERVICE || 
  process.env.FIREBASE_CONFIG
);

// Run immediately if started directly
if (
  process.env.NODE_ENV !== 'test' && 
  !process.env.ELECTRON_MANAGED && 
  !isCloudFunction
) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Novotion API] Server listening at http://0.0.0.0:${port}`);
  });
}

export default app;
