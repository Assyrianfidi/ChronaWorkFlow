const { prisma, createTestServer, generateAuthToken, createTestUser, cleanupDatabase } = require('../test-utils.cjs');
const request = require('supertest');
const { ROLES } = require('../../constants/roles');

// Test data
const testReportData = {
  title: 'Test Report',
  startDate: new Date('2023-01-01').toISOString(),
  endDate: new Date('2023-12-31').toISOString(),
  status: 'pending',
  data: { test: 'data' },
  // Add any other required fields from your Prisma schema
  notes: 'Test report notes',
  isActive: true
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
    const { userId = testUser.id, ...restData } = reportData;
    
    return prisma.reconciliationReport.create({
      data: {
        ...testReportData,
        ...restData,
        userId,
        // Ensure dates are properly formatted if overridden
        startDate: reportData.startDate || testReportData.startDate,
        endDate: reportData.endDate || testReportData.endDate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  };

  beforeAll(async () => {
    // Initialize test server
    const testServer = createTestServer();
    app = testServer.app;
    server = testServer.server;

    // Create test users
    testUser = await createTestUser({
      ...testUserData,
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
    
    // Close the server
    if (server && typeof server.close === 'function') {
      await new Promise((resolve) => server.close(resolve));
    }
    
    // Disconnect Prisma
    await prisma.$disconnect();
  });

  describe('GET /api/reports', () => {
    it('should return all reports for admin', async () => {
      // Create test reports
      await createTestReport({ title: 'Report 1' });
      await createTestReport({ title: 'Report 2' });

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should only return user\'s reports for non-admin', async () => {
      // Create a report for test user
      await createTestReport({ title: 'User Report' });
      
      // Create a report for admin user
      await prisma.reconciliationReport.create({
        data: {
          ...testReportData,
          title: 'Admin Report',
          userId: adminUser.id
        }
      });

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should only see the user's own reports
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('User Report');
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
        .expect(200);

      expect(response.body).toHaveProperty('id', testReport.id);
      expect(response.body.title).toBe('Get By ID Report');
    });

    it('should return 404 for non-existent report', async () => {
      await request(app)
        .get('/api/reports/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/reports', () => {
    it('should create a new report', async () => {
      const newReport = {
        ...testReportData,
        title: 'New Test Report'
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newReport)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Test Report');
      expect(response.body.createdById).toBe(testUser.id);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/reports/:id', () => {
    it('should update a report', async () => {
      const report = await createTestReport({
        title: 'Report to Update'
      });

      const updates = {
        title: 'Updated Report Title',
        status: 'completed'
      };

      const response = await request(app)
        .patch(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe('Updated Report Title');
      expect(response.body.status).toBe('completed');
    });

    it('should not allow unauthorized updates', async () => {
      const report = await createTestReport({
        title: 'Unauthorized Update Test'
      });

      // Create a different user
      const otherUser = await createTestUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'test1234',
        role: ROLES.USER
      });
      const otherUserToken = generateAuthToken(otherUser);

      await request(app)
        .patch(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('should delete a report', async () => {
      const report = await createTestReport({
        title: 'Report to Delete'
      });

      await request(app)
        .delete(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify the report is deleted
      const deletedReport = await prisma.reconciliationReport.findUnique({
        where: { id: report.id }
      });
      expect(deletedReport).toBeNull();
    });

    it('should allow admin to delete any report', async () => {
      const report = await createTestReport({
        title: 'Admin Delete Test'
      });

      await request(app)
        .delete(`/api/reports/${report.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
