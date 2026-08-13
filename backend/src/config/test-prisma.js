import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.TEST_DATABASE_URL,
});

const testPrisma = new PrismaClient({
  adapter,
});

export default testPrisma;