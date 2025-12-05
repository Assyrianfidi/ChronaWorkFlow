const { createTestServer, TEST_CONFIG } = require('../test-utils');
const request = require('supertest');

describe('Example API', () => {
  let server;
  let app;
  let testAdmin;
  let testUser;

  beforeAll(async () => {
    // Create test server and get server and app instances
    const testServer = createTestServer();
    server = testServer.server;
    app = testServer.app;
    
    // Store test users in global for easy access
    testAdmin = global.testAdmin;
    testUser = global.testUser;
  });

  afterAll(async () => {
    // Close the server after all tests
    if (server && typeof server.close === 'function') {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('should return 200 for health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should return 404 for non-existent route', async () => {
    const response = await request(app).get('/non-existent-route');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
