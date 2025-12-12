const {
  prisma,
  createTestServer,
  generateAuthToken,
  createTestUser,
  cleanupDatabase,
} = require("../test-utils.cjs");
const request = require("supertest");
const { ROLES } = require("../../constants/roles");

describe("Reports API", () => {
  let server;
  let app;
  let testUser;
  let adminUser;
  let authToken;
  let adminToken;

  beforeAll(async () => {
    // Initialize test server
    const testServer = createTestServer();
    app = testServer.app;
    server = testServer.server;

    // Create test users
    testUser = await createTestUser({
      name: "Test User",
      email: "test@example.com",
      password: "test1234",
      role: ROLES.USER,
      isActive: true,
    });

    adminUser = await createTestUser({
      name: "Admin User",
      email: "admin@example.com",
      password: "admin1234",
      role: ROLES.ADMIN,
      isActive: true,
    });

    // Generate auth tokens
    authToken = generateAuthToken(testUser);
    adminToken = generateAuthToken(adminUser);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupDatabase();

    // Close server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    // Disconnect Prisma
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up reports between tests
    await prisma.reconciliationReport.deleteMany({});
  });

  describe("GET /api/reports", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/reports").expect(401);

      expect(response.body).toHaveProperty(
        "message",
        "Not authorized, no token",
      );
    });

    it("should return user's reports for regular user", async () => {
      // Create test reports
      await prisma.reconciliationReport.createMany({
        data: [
          {
            title: "User Report 1",
            startDate: new Date("2023-01-01"),
            endDate: new Date("2023-12-31"),
            status: "pending",
            data: { test: "data" },
            createdById: testUser.id,
          },
          {
            title: "Admin Report",
            startDate: new Date("2023-01-01"),
            endDate: new Date("2023-12-31"),
            status: "completed",
            data: { test: "admin data" },
            createdById: adminUser.id,
          },
        ],
      });

      const response = await request(app)
        .get("/api/reports")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe("User Report 1");
    });

    it("should return all reports for admin", async () => {
      // Create test reports
      await prisma.reconciliationReport.createMany({
        data: [
          {
            title: "User Report 1",
            startDate: new Date("2023-01-01"),
            endDate: new Date("2023-12-31"),
            status: "pending",
            data: { test: "data" },
            createdById: testUser.id,
          },
          {
            title: "Admin Report",
            startDate: new Date("2023-01-01"),
            endDate: new Date("2023-12-31"),
            status: "completed",
            data: { test: "admin data" },
            createdById: adminUser.id,
          },
        ],
      });

      const response = await request(app)
        .get("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe("POST /api/reports", () => {
    it("should create a new report with valid data", async () => {
      const reportData = {
        title: "New Report",
        startDate: "2023-01-01T00:00:00.000Z",
        endDate: "2023-12-31T23:59:59.999Z",
        status: "pending",
        data: { test: "data" },
      };

      const response = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(reportData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: reportData.title,
        status: reportData.status,
        createdById: adminUser.id,
      });
    });

    it("should return 400 for invalid report data", async () => {
      const response = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ invalid: "data" })
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });
});
