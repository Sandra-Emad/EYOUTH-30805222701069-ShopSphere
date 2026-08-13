import testPrisma from "../src/config/test-prisma.js";

afterAll(async () => {
  await testPrisma.$disconnect();
});