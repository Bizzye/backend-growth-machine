import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { openApiDocument } from "./docs/openapi.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { createLoginRateLimit } from "./middlewares/rate-limit.js";
import { createAuthRoutes } from "./modules/auth/auth.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import { logger } from "./shared/logger.js";

export interface AppOptions {
  /** Login attempts allowed per IP every 15 minutes. */
  loginAttemptsLimit?: number;
}

/** Application factory — builds a fresh Express app (used by the server and by the tests). */
export function createApp({ loginAttemptsLimit = 10 }: AppOptions = {}): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  // Swagger UI needs inline scripts/styles, so it is mounted before the strict CSP from helmet.
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "10kb" }));
  app.use(pinoHttp({ logger }));

  const api = express.Router();

  api.get("/health", (_req, res) => {
    const database = mongoose.connection.readyState === mongoose.ConnectionStates.connected;
    res.status(database ? 200 : 503).json({ status: database ? "ok" : "degraded", database });
  });
  api.use("/auth", createAuthRoutes(createLoginRateLimit(loginAttemptsLimit)));
  api.use("/users", userRoutes);

  app.use("/api", api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
