import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

beforeAll(async () => {
  // One database per test file, so files can run in parallel safely.
  const dbName = `test-${process.env.VITEST_POOL_ID ?? "0"}-${Date.now()}`;
  await mongoose.connect(inject("mongoUri"), { dbName });
});

afterEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
