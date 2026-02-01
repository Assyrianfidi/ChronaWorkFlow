import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { createApp } from '../../app.js';
import { registerAllRoutes } from '../../routes/index.js';

describe('runtime entrypoint invariants', () => {
  it('mounts /api routes and they are not served as a placeholder (requires auth)', async () => {
    const app = createApp();
    await registerAllRoutes(app);

    const res = await request(app).get('/api/companies');

    // Regression lock: if the runtime drifts back to a placeholder server,
    // this would typically return 200 with a generic message.
    expect(res.status).toBe(401);
  });
});
