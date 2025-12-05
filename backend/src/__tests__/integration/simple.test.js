const { prisma, createTestServer, generateAuthToken, createTestUser, cleanupDatabase } = require('../test-utils.cjs');
const request = require('supertest');
const { ROLES } = require('../../constants/roles');

describe('Simple Test', () => {
  let server;
  let app;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Initialize test server
    const testServer = createTestServer();
    app = testServer.app;
    server = testServer.server;

    // Create a test user
    testUser = await createTestUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'test1234',
      role: ROLES.USER,
      isActive: true
    });

    // Generate auth token
    authToken = generateAuthToken(testUser);
  });

  afterAll(async () => {
    // Clean up
    await cleanupDatabase();
    await prisma.$disconnect();
    
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('should pass a simple test', () => {
    expect(true).toBe(true);
  });

  it('should have a valid test user', () => {
    expect(testUser).toBeDefined();
    expect(testUser.email).toBe('test@example.com');
  });

  it('should generate a valid JWT token', () => {
    expect(authToken).toBeDefined();
    expect(typeof authToken).toBe('string');
    expect(authToken.length).toBeGreaterThan(10);
  });
});
