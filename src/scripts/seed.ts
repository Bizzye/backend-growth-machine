/**
 * Populates the database with demo users (idempotent). Run with `npm run seed`.
 * Every demo user has the password `Str0ng!Pass`.
 */
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { userRepository } from "../modules/users/user.repository.js";
import { hashPassword } from "../shared/security/password.js";
import { logger } from "../shared/logger.js";

const DEMO_PASSWORD = "Str0ng!Pass";

const demoUsers = [
  { firstName: "Jane", lastName: "Cooper", email: "jane.cooper@example.com", birthDate: "1994-03-12" },
  { firstName: "Wade", lastName: "Warren", email: "wade.warren@example.com", birthDate: "1988-11-02" },
  { firstName: "Esther", lastName: "Howard", email: "esther.howard@example.com", birthDate: null },
  {
    firstName: "Cameron",
    lastName: "Williamson",
    email: "cameron.williamson@example.com",
    birthDate: "2000-07-23",
  },
  {
    firstName: "Brooklyn",
    lastName: "Simmons",
    email: "brooklyn.simmons@example.com",
    birthDate: "1997-01-30",
  },
  {
    firstName: "Leslie",
    lastName: "Alexander",
    email: "leslie.alexander@example.com",
    birthDate: "1991-09-14",
  },
];

async function seed() {
  await connectDatabase(env.MONGODB_URI);
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  let created = 0;

  for (const { birthDate, ...user } of demoUsers) {
    if (await userRepository.existsByEmail(user.email)) continue;

    await userRepository.create({
      ...user,
      passwordHash,
      birthDate: birthDate ? new Date(`${birthDate}T00:00:00.000Z`) : null,
    });
    created++;
  }

  logger.info(
    { created, total: demoUsers.length },
    `Seed finished — password for all users: ${DEMO_PASSWORD}`,
  );
  await disconnectDatabase();
}

seed().catch(async (error: unknown) => {
  logger.fatal({ err: error }, "Seed failed");
  await disconnectDatabase();
  process.exit(1);
});
