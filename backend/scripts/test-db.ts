import { db, closeConnection, sql } from "../src/db/index.js";
import { users } from "../src/db/schema.js";
import { eq, and } from "drizzle-orm";
import { config } from "../src/config/config.js";

type QueryResult =
  | {
      rows: Array<{ now: Date }>;
    }
  | Array<{ now: Date }>
  | { now: Date };

async function testConnection() {
  try {
    console.log("🔌 Testing database connection...");
    console.log("Executing query: SELECT NOW() as now");

    // Use the raw client to execute the query
    const client = (db as any).$client;
    const result = await client.unsafe<{ now: Date }[]>("SELECT NOW() as now");
    console.log("Query result:", JSON.stringify(result, null, 2));

    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error("No valid result returned from query");
    }

    const now = result[0]?.now;

    if (!now) {
      throw new Error("Could not get current time from database");
    }

    console.log("✅ Database connection successful");
    console.log("Current database time:", now);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

async function testUserRepository() {
  try {
    console.log("\n🧪 Testing User Repository...");

    // Test creating a user
    console.log("Creating test user...");
    const newUser = {
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      password: "hashedpassword123",
      role: "user" as const, // Ensure type safety with 'as const'
      isActive: true,
      // Add default values for required fields
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Log the user data being inserted
    console.log("User data to insert:", JSON.stringify(newUser, null, 2));

    console.log("Inserting user with data:", JSON.stringify(newUser, null, 2));
    const [createdUser] = await db.insert(users).values(newUser).returning();
    console.log("✅ Created user:", createdUser);

    // Test finding the user by ID
    console.log("\nFinding user by ID...");
    console.log("Looking for user with ID:", createdUser.id);
    const foundUser = await db
      .select()
      .from(users)
      .where(eq(users.id, createdUser.id));
    console.log("Found user:", JSON.stringify(foundUser, null, 2));
    console.log("✅ Found user by ID:", foundUser[0]);

    // Test updating the user
    console.log("\nUpdating user...");
    const updateData = {
      name: "Updated Test User",
      updatedAt: new Date(),
    };
    console.log(
      "Updating user with data:",
      JSON.stringify(updateData, null, 2),
    );
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, createdUser.id))
      .returning();
    console.log("Updated user:", JSON.stringify(updatedUser, null, 2));
    console.log("✅ Updated user:", updatedUser[0]);

    // Test deleting the user
    console.log("\nDeleting user...");
    console.log("Deleting user with ID:", createdUser.id);
    await db.delete(users).where(eq(users.id, createdUser.id));

    // Verify user was deleted
    const deletedUser = await db
      .select()
      .from(users)
      .where(eq(users.id, createdUser.id));
    if (deletedUser.length === 0) {
      console.log("✅ User successfully deleted");
    } else {
      console.log("❌ User was not deleted:", deletedUser);
      throw new Error("User was not deleted");
    }

    return true;
  } catch (error) {
    console.error("❌ User repository test failed:", error);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting database tests...\n");

  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.error("❌ Database tests aborted due to connection failure");
    process.exit(1);
  }

  const repositorySuccess = await testUserRepository();

  console.log("\n📊 Test Results:");
  console.log(
    `- Database Connection: ${connectionSuccess ? "✅ PASSED" : "❌ FAILED"}`,
  );
  console.log(
    `- User Repository: ${repositorySuccess ? "✅ PASSED" : "❌ FAILED"}`,
  );

  // Close the database connection
  await closeConnection();

  process.exit(repositorySuccess ? 0 : 1);
}

runTests().catch(async (error) => {
  console.error("Test failed:", error);
  await closeConnection().catch(console.error);
  process.exit(1);
});
