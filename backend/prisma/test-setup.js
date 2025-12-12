import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function setupTestDatabase() {
  // Set test database URL
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/accubooks_test";

  try {
    // Reset the test database
    execSync("npx prisma migrate reset --force --skip-seed", {
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.TEST_DATABASE_URL ||
          "postgresql://postgres:postgres@localhost:5432/accubooks_test",
      },
      stdio: "inherit",
    });

    console.log("✅ Test database reset successfully");
  } catch (error) {
    console.error("❌ Error resetting test database:", error);
    process.exit(1);
  }
}

export { setupTestDatabase, prisma };
