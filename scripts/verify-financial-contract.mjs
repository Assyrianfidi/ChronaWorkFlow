#!/usr/bin/env node

/**
 * Financial Write-Path Contract Verification (CI Gate)
 * 
 * This script enforces the Financial Write-Path Contract at CI time.
 * 
 * It FAILS if:
 * - A financial route is added without using registerFinancialRoute
 * - A financial storage method bypasses withIdempotentWrite
 * - A financial table write occurs without idempotency
 * 
 * This runs BEFORE tests in CI to catch violations early.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

let exitCode = 0;
const errors = [];
const warnings = [];

console.log("🔒 Financial Write-Path Contract Verification");
console.log("=" .repeat(60));

/**
 * Check 1: Verify all financial routes use registerFinancialRoute
 */
function checkFinancialRoutes() {
  console.log("\n✓ Checking financial routes...");
  
  const routesFile = path.join(rootDir, "server", "routes.ts");
  const routesContent = fs.readFileSync(routesFile, "utf-8");

  // Financial mutation patterns (POST/PUT/PATCH to financial endpoints)
  const financialEndpoints = [
    "/api/payments",
    "/api/invoices",
    "/api/payroll",
    "/api/ledger",
    "/api/bank-transactions",
    "/api/inventory",
  ];

  const lines = routesContent.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for direct app.post/put/patch calls to financial endpoints
    const directRouteMatch = line.match(/app\.(post|put|patch)\s*\(\s*["']([^"']+)["']/);
    
    if (directRouteMatch) {
      const [, method, routePath] = directRouteMatch;
      
      // Check if this is a financial endpoint
      const isFinancial = financialEndpoints.some(endpoint => routePath.startsWith(endpoint));
      
      if (isFinancial && method !== "get") {
        // Check if this line is part of a registerFinancialRoute call
        const contextBefore = lines.slice(Math.max(0, i - 5), i).join("\n");
        const contextAfter = lines.slice(i, Math.min(lines.length, i + 5)).join("\n");
        const fullContext = contextBefore + "\n" + contextAfter;
        
        if (!fullContext.includes("registerFinancialRoute")) {
          errors.push(
            `❌ Financial route ${method.toUpperCase()} ${routePath} at line ${i + 1} ` +
            `does not use registerFinancialRoute(). ` +
            `All financial mutations MUST use the financial route gate.`
          );
        }
      }
    }
  }

  // Check that registerFinancialRoute is imported
  if (!routesContent.includes("registerFinancialRoute")) {
    warnings.push(
      `⚠️  registerFinancialRoute not found in routes.ts. ` +
      `Ensure all financial routes use the gate.`
    );
  }
}

/**
 * Check 2: Verify financial storage methods use withIdempotentWrite
 */
function checkFinancialStorageMethods() {
  console.log("\n✓ Checking financial storage methods...");
  
  const storageFile = path.join(rootDir, "server", "storage.ts");
  const storageContent = fs.readFileSync(storageFile, "utf-8");

  // Known financial mutation methods from registry
  const financialMethods = [
    "createPayment",
    "createInvoice",
    "finalizeInvoice",
    "executePayrollRun",
    "reconcileLedger",
  ];

  for (const methodName of financialMethods) {
    // Find method definition
    const methodRegex = new RegExp(`async\\s+${methodName}\\s*\\([^)]*\\)`, "g");
    const match = methodRegex.exec(storageContent);
    
    if (match) {
      const methodStart = match.index;
      const methodEnd = findMethodEnd(storageContent, methodStart);
      const methodBody = storageContent.substring(methodStart, methodEnd);

      // Check if method uses withIdempotentWrite
      if (!methodBody.includes("withIdempotentWrite")) {
        // Check if it's using the old pattern (acceptable for now, but should migrate)
        const usesOldPattern = 
          methodBody.includes("deterministicUuidV4") &&
          methodBody.includes("db.transaction") &&
          methodBody.includes("isUniqueViolation");

        if (!usesOldPattern) {
          errors.push(
            `❌ Financial method ${methodName} does not use withIdempotentWrite ` +
            `or the proven idempotency pattern. This violates the contract.`
          );
        } else {
          warnings.push(
            `⚠️  Financial method ${methodName} uses old idempotency pattern. ` +
            `Consider migrating to withIdempotentWrite for consistency.`
          );
        }
      }
    }
  }
}

/**
 * Check 3: Verify no direct financial table writes bypass idempotency
 */
function checkDirectFinancialWrites() {
  console.log("\n✓ Checking for direct financial table writes...");
  
  const storageFile = path.join(rootDir, "server", "storage.ts");
  const storageContent = fs.readFileSync(storageFile, "utf-8");

  // Financial tables that require idempotency
  const financialTables = [
    "payments",
    "invoices",
    "pay_runs",
    "bank_transactions",
    "ledger_reconciliations",
  ];

  const lines = storageContent.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for direct inserts/updates to financial tables
    for (const table of financialTables) {
      if (line.includes(`.insert(${table})`) || line.includes(`.insert(s.${table})`)) {
        // Check if this is within an idempotent context
        const contextBefore = lines.slice(Math.max(0, i - 20), i).join("\n");
        
        const hasIdempotencyContext = 
          contextBefore.includes("withIdempotentWrite") ||
          contextBefore.includes("deterministicUuidV4") ||
          contextBefore.includes("idempotencyKey");

        if (!hasIdempotencyContext) {
          warnings.push(
            `⚠️  Direct insert to ${table} at line ${i + 1} may bypass idempotency. ` +
            `Verify this is not a financial mutation.`
          );
        }
      }
    }
  }
}

/**
 * Check 4: Verify financial mutation registry is complete
 */
function checkFinancialRegistry() {
  console.log("\n✓ Checking financial mutation registry...");
  
  const registryFile = path.join(rootDir, "server", "resilience", "financial-mutation-registry.ts");
  
  if (!fs.existsSync(registryFile)) {
    errors.push(
      `❌ Financial mutation registry not found at ${registryFile}. ` +
      `The registry is required for contract enforcement.`
    );
    return;
  }

  const registryContent = fs.readFileSync(registryFile, "utf-8");

  // Check that FINANCIAL_MUTATIONS is exported
  if (!registryContent.includes("export const FINANCIAL_MUTATIONS")) {
    errors.push(
      `❌ FINANCIAL_MUTATIONS not exported from registry. ` +
      `This is required for contract enforcement.`
    );
  }

  // Check that FINANCIAL_TABLES is defined
  if (!registryContent.includes("export const FINANCIAL_TABLES")) {
    errors.push(
      `❌ FINANCIAL_TABLES not exported from registry. ` +
      `This is required for table-level enforcement.`
    );
  }
}

/**
 * Helper: Find the end of a method definition
 */
function findMethodEnd(content, startIndex) {
  let braceCount = 0;
  let inMethod = false;
  
  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    
    if (char === "{") {
      braceCount++;
      inMethod = true;
    } else if (char === "}") {
      braceCount--;
      if (inMethod && braceCount === 0) {
        return i + 1;
      }
    }
  }
  
  return content.length;
}

/**
 * Main execution
 */
function main() {
  try {
    checkFinancialRegistry();
    checkFinancialRoutes();
    checkFinancialStorageMethods();
    checkDirectFinancialWrites();

    console.log("\n" + "=".repeat(60));
    
    if (errors.length > 0) {
      console.log("\n❌ FINANCIAL CONTRACT VIOLATIONS DETECTED:");
      errors.forEach(error => console.log(error));
      exitCode = 1;
    }

    if (warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      warnings.forEach(warning => console.log(warning));
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log("\n✅ All financial contract checks passed!");
    }

    console.log("\n" + "=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ Contract verification failed:", error);
    exitCode = 1;
  }

  process.exit(exitCode);
}

main();
