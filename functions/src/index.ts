import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { prisma } from "./server.js";
import authRouter from "./routes/auth.js";
import leadsRouter from "./routes/leads.js";
import salesRouter from "./routes/sales.js";
import adminRouter from "./routes/admin.js";
import monthlyRouter from "./routes/monthly.js";
import supportRouter from "./routes/support.js";
import crmRouter from "./routes/crm.js";

dotenv.config();

const app = express();

// Comprehensive CORS middleware supporting credentials and preflights
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Normalize duplicate prefix if client sends /api/api/**
app.use((req, res, next) => {
  if (req.url.startsWith("/api/api/")) {
    req.url = req.url.replace(/^\/api\/api\//, "/api/");
  } else if (req.url === "/api/api") {
    req.url = "/api";
  }
  next();
});

// Request logging
app.use((req, _res, next) => {
  console.log(`[Novotion API] ${req.method} ${req.url}`);
  next();
});

// Create API router for all business routes
const apiRouter = express.Router();

// Health check handler
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
    message: "Novotion backend running on Firebase Functions with Supabase",
  });
};

apiRouter.get("/", healthHandler);
apiRouter.get("/health", healthHandler);

// Mount business routers
apiRouter.use("/auth", authRouter);
apiRouter.use("/leads", leadsRouter);
apiRouter.use("/leads", monthlyRouter);
apiRouter.use("/sales", salesRouter);
apiRouter.use("/sales-reps", monthlyRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/access-keys", adminRouter);
apiRouter.use("/support", supportRouter);
apiRouter.use("/crm", crmRouter);

// Direct health routes on root
app.get(["/", "/health", "/api", "/api/health"], healthHandler);

// Mount router on BOTH /api and / to handle direct calls and Firebase rewrites
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Novotion Cloud Function API] Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Export Cloud Function v2
export const api = onRequest({
  region: "asia-south1",
  memory: "512MiB",
  timeoutSeconds: 60,
  maxInstances: 10,
  concurrency: 80,
}, app);