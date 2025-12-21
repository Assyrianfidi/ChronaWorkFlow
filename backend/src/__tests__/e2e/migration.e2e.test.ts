/**
 * End-to-End Tests for QuickBooks Migration
 * Tests QBO/IIF file parsing, data mapping, and AI categorization
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';
let authToken: string;

// Sample QBO content for testing
const sampleQBOContent = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20240101120000
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>USD
<BANKACCTFROM>
<BANKID>123456789
<ACCTID>987654321
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20240101
<DTEND>20240131
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20240115
<TRNAMT>-150.00
<FITID>2024011501
<NAME>AMAZON WEB SERVICES
<MEMO>AWS Monthly Subscription
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20240120
<TRNAMT>5000.00
<FITID>2024012001
<NAME>STRIPE TRANSFER
<MEMO>Customer Payment
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>25000.00
<DTASOF>20240131
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

// Sample IIF content for testing
const sampleIIFContent = `!ACCNT	NAME	ACCNTTYPE	DESC	ACCNUM	EXTRA
ACCNT	Checking	BANK	Main Business Checking	1000	
ACCNT	Accounts Receivable	AR	Customer Receivables	1100	
ACCNT	Office Supplies	EXP	Office Supplies Expense	6000	
ACCNT	Software	EXP	Software Subscriptions	6100	
!TRNS	TRNSID	TRNSTYPE	DATE	ACCNT	NAME	AMOUNT	DOCNUM	MEMO
!SPL	SPLID	TRNSTYPE	DATE	ACCNT	NAME	AMOUNT	DOCNUM	MEMO
!ENDTRNS
TRNS		GENERAL JOURNAL	01/15/2024	Checking		-150.00	1001	AWS Payment
SPL		GENERAL JOURNAL	01/15/2024	Software		150.00	1001	AWS Payment
ENDTRNS
TRNS		GENERAL JOURNAL	01/20/2024	Checking		5000.00	1002	Customer Payment
SPL		GENERAL JOURNAL	01/20/2024	Accounts Receivable		-5000.00	1002	Customer Payment
ENDTRNS
!CUST	NAME	BADDR1	BADDR2	BADDR3	BADDR4	BADDR5	PHONE1	FAXNUM	EMAIL
CUST	Acme Corp	123 Main St	Suite 100	New York	NY	10001	555-1234	555-5678	acme@example.com
CUST	TechStart Inc	456 Tech Blvd		San Francisco	CA	94105	555-9876		tech@example.com`;

describe('QuickBooks Migration E2E Tests', () => {
  beforeAll(async () => {
    const loginResponse = await request(API_BASE_URL)
      .post('/api/v1/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@accubooks.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data?.token || loginResponse.body.token;
    }
  });

  describe('QBO File Import', () => {
    it('should successfully parse and import QBO file', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/migration/qbo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sampleQBOContent), 'test-import.qbo');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('migrationId');
      expect(response.body.data).toHaveProperty('summary');
    });

    it('should extract transactions from QBO file', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/migration/qbo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sampleQBOContent), 'test-import.qbo');

      expect(response.status).toBe(200);
      expect(response.body.data.summary.transactionsImported).toBeGreaterThan(0);
    });

    it('should apply AI categorization to imported transactions', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/migration/qbo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sampleQBOContent), 'test-import.qbo');

      expect(response.status).toBe(200);
      expect(response.body.data.summary).toHaveProperty('categorizedTransactions');
      expect(response.body.data.summary.categorizationAccuracy).toBeGreaterThan(0);
    });

    it('should reject invalid file types', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/migration/qbo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('invalid content'), 'test.txt');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('IIF File Import', () => {
    it('should successfully parse and import IIF file', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/migration/iif')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sampleIIFContent), 'test-import.iif');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('migrationId');
    });

    it('should import accounts from IIF file', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/migration/iif')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sampleIIFContent), 'test-import.iif');

      expect(response.status).toBe(200);
      expect(response.body.data.summary.accountsImported).toBeGreaterThan(0);
    });

    it('should import customers from IIF file', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/migration/iif')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sampleIIFContent), 'test-import.iif');

      expect(response.status).toBe(200);
      expect(response.body.data.summary.customersImported).toBeGreaterThan(0);
    });

    it('should import transactions from IIF file', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/migration/iif')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sampleIIFContent), 'test-import.iif');

      expect(response.status).toBe(200);
      expect(response.body.data.summary.transactionsImported).toBeGreaterThan(0);
    });
  });

  describe('Migration Status', () => {
    it('should return migration status by ID', async () => {
      // First create a migration
      const migrationResponse = await request(API_BASE_URL)
        .post('/api/migration/qbo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sampleQBOContent), 'test-import.qbo');

      const migrationId = migrationResponse.body.data?.migrationId;

      if (migrationId) {
        const statusResponse = await request(API_BASE_URL)
          .get(`/api/migration/${migrationId}/status`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body.data).toHaveProperty('status');
      }
    });
  });

  describe('Supported Formats', () => {
    it('should return list of supported file formats', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/migration/supported-formats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.formats).toContain('.qbo');
      expect(response.body.data.formats).toContain('.iif');
      expect(response.body.data.formats).toContain('.ofx');
    });
  });

  describe('Migration Performance', () => {
    it('should complete migration within 15 minutes for standard files', async () => {
      const startTime = Date.now();

      const response = await request(API_BASE_URL)
        .post('/api/migration/qbo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(sampleQBOContent), 'test-import.qbo');

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      // Should complete in under 15 minutes (900000ms)
      expect(duration).toBeLessThan(900000);
      // For small files, should be much faster
      expect(duration).toBeLessThan(30000); // 30 seconds for small test file
    });
  });
});
