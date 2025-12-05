const { prisma, createTestServer, generateAuthToken, createTestUser, cleanupDatabase } = require('../test-utils.cjs');
const request = require('supertest');
const { ROLES } = require('../../constants/roles');

// Test data
const testReportData = {
  title: 'Test Report',
  startDate: new Date('2023-01-01').toISOString(),
  endDate: new Date('2023-12-31').toISOString(),
  status: 'pending',
  data: { test: 'data' }
};

describe('Report API', () => {
  let server;
  let app;
  let testUser;
  let adminUser;
  let authToken;
  let adminToken;

  // Helper function to create a test report
  const createTestReport = async (reportData = {}) => {
    try {
      // Ensure we have a valid user ID
      const userId = reportData.userId || testUser.id;
      
      // Remove userId from reportData to avoid duplication
      const { userId: _, ...restData } = reportData;
      
      const defaultData = {
        title: `Test Report ${Date.now()}`,
        amount: 1000.50,
        userId,
        ...restData
      };

      // First, ensure the user exists
      try {
        await prisma.user.findUniqueOrThrow({
          where: { id: userId }
        });
      } catch (error) {
        // If user doesn't exist, create one
        const newUser = await createTestUser(prisma, {
          email: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.com`,
          password: 'password123',
          role: ROLES.USER
        });
        defaultData.userId = newUser.id;
      }

      return await prisma.reconciliationReport.create({
        data: defaultData,
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error creating test report:', error);
      throw error;
    }
  };

  beforeAll(async () => {
    // Initialize test server
    const testServer = createTestServer();
    app = testServer.app;
    server = testServer.server;

    // Create test users
    testUser = await createTestUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'test1234',
      role: ROLES.USER,
      isActive: true
    });

    adminUser = await createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin1234',
      role: ROLES.ADMIN,
      isActive: true
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
      await new Promise(resolve => server.close(resolve));
    }
    
    // Disconnect Prisma
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up reports between tests
    await prisma.reconciliationReport.deleteMany({});
  });

  describe('POST /api/reports', () => {
    it('should create a new report with valid data', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testReportData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: testReportData.title,
        status: testReportData.status,
        createdById: adminUser.id
      });
    });

    it('should return 400 for invalid report data', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/reports', () => {
    it('should return all reports for admin', async () => {
      // Create test reports
      await prisma.reconciliationReport.createMany({
        data: [
          {
            ...testReportData,
            createdById: testUser.id
          },
          {
            ...testReportData,
            title: 'Another Report',
            createdById: adminUser.id
          }
        ]
      });

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return only user\'s reports for non-admin', async () => {
      // Create test reports
      await prisma.reconciliationReport.createMany({
        data: [
          {
            ...testReportData,
            createdById: testUser.id
          },
          {
            ...testReportData,
            title: 'Admin Report',
            createdById: adminUser.id
          }
        ]
      });

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].createdById).toBe(testUser.id);
    });
  });

  describe('GET /api/reports/:id', () => {
    it('should return a report by id', async () => {
      const report = await prisma.reconciliationReport.create({
        data: {
          ...testReportData,
          createdById: testUser.id
        }
      });

      const response = await request(app)
        .get(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: report.id,
        title: report.title,
        createdById: testUser.id
      });
    });

    it('should return 404 for non-existent report', async () => {
      const response = await request(app)
        .get('/api/reports/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Report not found');
    });
  });

  describe('PATCH /api/reports/:id', () => {
    it('should update a report', async () => {
      const report = await prisma.reconciliationReport.create({
        data: {
          ...testReportData,
          createdById: testUser.id
        }
      });

      const updateData = {
        title: 'Updated Report Title',
        status: 'completed'
      };

      const response = await request(app)
        .patch(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: report.id,
        title: updateData.title,
        status: updateData.status,
        createdById: testUser.id
      });
    });

    it('should return 403 when updating another user\'s report', async () => {
      const report = await prisma.reconciliationReport.create({
        data: {
          ...testReportData,
          createdById: adminUser.id
        }
      });

      await request(app)
        .patch(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('should delete a report', async () => {
      const report = await prisma.reconciliationReport.create({
        data: {
          ...testReportData,
          createdById: testUser.id
        }
      });

      await request(app)
        .delete(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deletion
      const deletedReport = await prisma.reconciliationReport.findUnique({
        where: { id: report.id }
      });
      expect(deletedReport).toBeNull();
    });

    it('should allow admin to delete any report', async () => {
      const report = await prisma.reconciliationReport.create({
        data: {
          ...testReportData,
          createdById: testUser.id
        }
      });

      await request(app)
        .delete(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });

  it('should create a report', async () => {
    const report = await prisma.reconciliationReport.create({
      data: {
        title: 'Test Report',
        status: 'DRAFT',
        userId: testUser.id
      }
    });

    expect(report).toBeDefined();
    expect(report.title).toBe('Test Report');
  });
});

describe('POST /api/reports', () => {
    it('should create a new report', async () => {
      // Create a test user for this report
      const reportUser = await createTestUser({
        email: 'reportuser@example.com',
        password: 'password123',
        role: ROLES.USER
      });
      
      const reportData = {
        title: 'Q1 2025 Financial Report',
        userId: reportUser.id,
        amount: 12500.75,
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(reportData.title);
      expect(parseFloat(response.body.amount)).toBe(reportData.amount);
      expect(response.body).toHaveProperty('userId', testUser.id);
    });

    it('should not create a report with duplicate title for the same user', async () => {
      const existingReport = await createTestReport({
        title: 'Duplicate Title Report'
      });

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: existingReport.title, // Duplicate title
          amount: 2000.50,
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/reports', () => {
    it('should return a list of reports', async () => {
      // Create test reports
      await createTestReport({ title: 'Report 1' });
      await createTestReport({ title: 'Report 2' });

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter reports by user ID when requested', async () => {
      // Create a second user
      const anotherUser = await createTestUser({
        email: 'anotheruser@example.com'
      });

      // Create reports for both users
      await createTestReport({ title: 'User 1 Report 1' });
      await createTestReport({ 
        title: 'User 2 Report 1',
        userId: anotherUser.id 
      });

      // Get reports for the test user
      const response = await request(app)
        .get('/api/reports?userId=' + testUser.id)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Should only return reports for the specified user
      const allForTestUser = response.body.every(
        report => report.userId === testUser.id
      );
      expect(allForTestUser).toBe(true);
    });
  });

  describe('GET /api/reports/:id', () => {
    it('should return a report by id', async () => {
      const testReport = await createTestReport({
        title: 'Get By ID Report'
      });

      const response = await request(app)
        .get(`/api/reports/${testReport.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', testReport.id);
      expect(response.body).toHaveProperty('title', testReport.title);
    });

    it('should return 404 for non-existent report', async () => {
      const nonExistentId = 999999;
      const response = await request(app)
        .get(`/api/reports/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Report not found');
    });
  });

  describe('PUT /api/reports/:id', () => {
    it('should update a report', async () => {
      const testReport = await createTestReport({
        title: 'Original Report Title',
        amount: 1000.00
      });

      const updatedData = {
        title: 'Updated Report Title',
        amount: 2000.00
      };

      const response = await request(app)
        .put(`/api/reports/${testReport.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('title', updatedData.title);
      expect(parseFloat(response.body.amount)).toBe(updatedData.amount);
    });

    it('should not allow updating another user\'s report', async () => {
      // Create a second user
      const anotherUser = await createTestUser({
        email: 'anotheruser2@example.com'
      });

      // Create a report as the second user
      const otherUserReport = await prisma.reconciliationReport.create({
        data: {
          title: 'Other User Report',
          amount: 1000.00,
          userId: anotherUser.id
        }
      });

      // Try to update the other user's report
      const response = await request(app)
        .put(`/api/reports/${otherUserReport.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hacked Report' })
        .expect('Content-Type', /json/)
        .expect(403); // Forbidden

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('should delete a report', async () => {
      const testReport = await createTestReport({
        title: 'Report to Delete'
      });

      // First, verify the report exists
      await request(app)
        .get(`/api/reports/${testReport.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Delete the report
      await request(app)
        .delete(`/api/reports/${testReport.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify the report is deleted
      await request(app)
        .get(`/api/reports/${testReport.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
