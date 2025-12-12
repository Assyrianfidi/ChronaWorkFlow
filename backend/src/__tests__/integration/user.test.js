const {
  prisma,
  createTestServer,
  cleanupDatabase,
  createTestUser,
  createTestAdmin,
  generateAuthToken,
  testUser: globalTestUser,
  testAdmin: globalTestAdmin,
} = require("../test-utils.cjs");
const request = require("supertest");
const { ROLES } = require("../../constants/roles.js");

describe("User API", () => {
  let server;
  let app;
  let testUser;
  let adminUser;
  let authToken;
  let adminToken;

  beforeAll(async () => {
    // Start test server first
    const testServer = createTestServer();
    app = testServer.app;
    server = testServer.server;

    // Use the global test users created in test-utils.cjs
    testUser = globalTestUser;
    adminUser = globalTestAdmin;

    // Generate tokens with proper roles
    authToken = generateAuthToken({
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      isActive: testUser.isActive,
    });

    // Generate admin token
    adminToken = generateAuthToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      isActive: adminUser.isActive,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupDatabase();

    // Close the server
    if (server && typeof server.close === "function") {
      await new Promise((resolve) => server.close(resolve));
    }

    // Close Prisma connection
    await prisma.$disconnect();
  });

  describe("POST /api/users", () => {
    it("should create a new user", async () => {
      const newUser = {
        name: "New User",
        email: `newuser-${Date.now()}@example.com`,
        password: "password123",
        role: "USER",
      };

      const response = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newUser)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("name", newUser.name);
      expect(response.body.data).toHaveProperty("email", newUser.email);
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("should not create a user with duplicate email", async () => {
      const existingUser = await createTestUser({
        email: "duplicate@example.com",
        name: "Existing User",
      });

      const response = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "New User",
          email: existingUser.email, // Duplicate email
          password: "password123",
          role: "USER",
        })
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/users", () => {
    it("should return 403 for non-admin users", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .expect("Content-Type", /json/)
        .expect(403);

      expect(response.body).toHaveProperty("error");
    });

    it("should return a list of users for admin", async () => {
      // Create an additional user to ensure we have at least 2 users
      await createTestUser({
        email: `testuser2-${Date.now()}@example.com`,
        name: "Test User 2",
      });

      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data[0]).toHaveProperty("id");
      expect(response.body.data[0]).toHaveProperty("email");
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return a user by id", async () => {
      const testUser = await createTestUser({
        email: "getbyid@example.com",
        name: "Get By ID",
      });

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id", testUser.id);
      expect(response.body.data).toHaveProperty("email", testUser.email);
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .get(`/api/users/${nonExistentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error", "User not found");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update a user", async () => {
      const testUser = await createTestUser({
        email: "toupdate@example.com",
        name: "Original Name",
      });

      const updatedData = {
        name: "Updated Name",
        role: ROLES.MANAGER,
      };

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updatedData)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("name", updatedData.name);
      // Role should be in uppercase
      expect(response.body.data).toHaveProperty(
        "role",
        updatedData.role.toUpperCase(),
      );
      expect(response.body.data).toHaveProperty("email", testUser.email); // Email shouldn't change
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete a user", async () => {
      const testUser = await createTestUser({
        email: "todelete@example.com",
        name: "To Delete",
      });

      // First, verify the user exists
      await request(app)
        .get(`/api/users/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Delete the user
      await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(204);

      // Verify the user no longer exists - should return 404
      await request(app)
        .get(`/api/users/${testUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
