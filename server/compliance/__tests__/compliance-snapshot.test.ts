import { describe, it, expect } from 'vitest';

import { buildComplianceSnapshot } from '../compliance-snapshot.js';

describe('STEP16 compliance snapshot', () => {
  it('is deterministic when DETERMINISTIC_TEST_IDS=true', async () => {
    process.env.DETERMINISTIC_TEST_IDS = 'true';

    const a = await buildComplianceSnapshot({});
    const b = await buildComplianceSnapshot({});

    expect(a.integrityHash).toBe(b.integrityHash);
    expect(a.generatedAt).toBe(b.generatedAt);
  });
});
