import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';

import { ControlRegistry } from './control-registry.js';
import { EvidenceStore } from './evidence-store.js';
import { EvidenceEngine } from './evidence-engine.js';

describe('STEP 10 compliance gates', () => {
  it('has minimum control coverage and mappings', () => {
    const registry = ControlRegistry.loadFromRepo();

    registry.assertMinimumCoverage(9);
    registry.assertAllControlsHaveEvidenceSources();
    registry.assertAllControlsHaveFrameworkMappings();

    registry.requireControl('ACCU-CONTROL-001');
    registry.requireControl('ACCU-CONTROL-002');
    registry.requireControl('ACCU-CONTROL-003');
    registry.requireControl('ACCU-CONTROL-004');
    registry.requireControl('ACCU-CONTROL-005');
    registry.requireControl('ACCU-CONTROL-006');
    registry.requireControl('ACCU-CONTROL-007');
    registry.requireControl('ACCU-CONTROL-008');
    registry.requireControl('ACCU-CONTROL-009');
  });

  describe('evidence store integrity', () => {
    beforeEach(() => {
      process.env.COMPLIANCE_DETERMINISTIC_TIME_ISO = '1970-01-01T00:00:00.000Z';
    });

    it('records evidence and verifies hash chain per tenant', () => {
      const storeDir = path.resolve(process.cwd(), '.tmp', 'evidence-store-test');
      fs.rmSync(storeDir, { recursive: true, force: true });
      const store = new EvidenceStore(storeDir);
      const engine = new EvidenceEngine(store);

      engine.recordRbacDecision({
        tenantId: 'tn_test',
        actorId: 'user_1',
        correlationId: 'corr_1',
        permission: 'reports:read',
        authorized: true,
        reason: 'AUTHORIZED',
      });

      engine.recordFeatureFlagChange({
        tenantId: 'tn_test',
        actorId: 'user_1',
        correlationId: 'corr_2',
        flag: 'FEATURE_ANALYTICS_STEP8',
        enabled: true,
        previous: false,
      });

      const check = engine.verifyTenantEvidenceChain('tn_test');
      expect(check.valid).toBe(true);
      expect(check.violations).toEqual([]);
    });
  });
});
