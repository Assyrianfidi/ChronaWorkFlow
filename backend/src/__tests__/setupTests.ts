import { prisma } from "../utils/prisma.js";

beforeAll(async () => {
  // Initialize test database
});

afterEach(async () => {
  // Clean database between tests
  await prisma.$executeRaw`TRUNCATE TABLE \"ReconciliationReport\" CASCADE;`;
});

afterAll(async () => {
  // Disconnect Prisma
  await prisma.$disconnect();
});
