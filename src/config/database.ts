import mongoose from "mongoose";

import { logger } from "../shared/logger.js";

export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);
  const connection = await mongoose.connect(uri);
  logger.info({ host: connection.connection.host }, "MongoDB connected");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
