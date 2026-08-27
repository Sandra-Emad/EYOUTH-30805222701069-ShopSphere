import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is not defined"
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const testPrisma = new PrismaClient({
  adapter,
});

export default testPrisma;
