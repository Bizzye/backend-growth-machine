import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { logger } from "./shared/logger.js";

async function bootstrap() {
  await connectDatabase(env.MONGODB_URI);

  const server = createApp().listen(env.PORT, () => {
    logger.info(`API running on http://localhost:${env.PORT}/api (docs: /docs)`);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully");
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, "Failed to start the server");
  process.exit(1);
});
