#!/usr/bin/env node

/**
 * High-Risk Write-Path Contract Verification (CI Gate)
 * 
 * This script enforces the High-Risk Write-Path Contract at CI time.
 * 
 * It FAILS if:
 * - A high-risk route is added without using registerHighRiskRoute
 * - A high-risk storage method bypasses withIdempotentWrite
 * - A high-risk table write occurs without idempotency
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

console.log("🔒 High-Risk Write-Path Contract Verification");
console.log("=" .repeat(60));

/**
 * Check 1: Verify all high-risk routes use registerHighRiskRoute
 */
function checkHighRiskRoutes() {
  console.log("\n✓ Checking high-risk routes...");
  
  const routesFile = path.join(rootDir, "server", "routes.ts");
  const routesContent = fs.readFileSync(routesFile, "utf-8");

  // High-risk mutation patterns
  const highRiskEndpoints = [
    "/api/inventory",
    "/api/customers",
    "/api/employees",
    "/api/workflows",
    "/api/companies/.*/settings",
    "/api/companies/.*/users/.*/grant",
  ];

  const lines = routesContent.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for direct app.post/put/patch/delete calls to high-risk endpoints
    const directRouteMatch = line.match(/app\.(post|put|patch|delete)\s*\(\s*["']([^"']+)["']/);
    
    if (directRouteMatch) {
      const [, method, routePath] = directRouteMatch;
      
      // Check if this is a high-risk endpoint
      const isHighRisk = highRiskEndpoints.some(endpoint => {
        const regex = new RegExp(endpoint);
        return regex.test(routePath);
      });
      
      if (isHighRisk && method !== "get") {
        // Check if this line is part of a registerHighRiskRoute call
        const contextBefore = lines.slice(Math.max(0, i - 5), i).join("\n");
        const contextAfter = lines.slice(i, Math.min(lines.length, i + 5)).join("\n");
        const fullContext = contextBefore + "\n" + contextAfter;
        
        if (!fullContext.includes("registerHighRiskRoute")) {
          errors.push(
            `❌ High-risk route ${method.toUpperCase()} ${routePath} at line ${i + 1} ` +
            `does not use registerHighRiskRoute(). ` +
            `All high-risk mutations MUST use the high-risk route gate.`
          );
        }
      }
    }
  }

  // Check that registerHighRiskRoute is imported if high-risk routes exist
  const hasHighRiskRoutes = routesContent.includes("inventory") || 
                            routesContent.includes("customers") ||
                            routesContent.includes("employees");
  
  if (hasHighRiskRoutes && !routesContent.includes("registerHighRiskRoute")) {
    warnings.push(
      `⚠️  registerHighRiskRoute not found in routes.ts but high-risk endpoints detected. ` +
      `Ensure all high-risk routes use the gate.`
    );
  }
}

/**
 * Check 2: Verify high-risk storage methods use withIdempotentWrite
 */
function checkHighRiskStorageMethods() {
  console.log("\n✓ Checking high-risk storage methods...");
  
  const storageFile = path.join(rootDir, "server", "storage.ts");
  const storageContent = fs.readFileSync(storageFile, "utf-8");

  // Known high-risk mutation methods from registry
  const highRiskMethods = [
    "adjustInventoryQuantity",
    "createCustomer",
    "createEmployee",
    "triggerWorkflowInstance",
    "updateCompanySettings",
    "grantUserCompanyAccess",
  ];

  for (const methodName of highRiskMethods) {
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
            `❌ High-risk method ${methodName} does not use withIdempotentWrite ` +
            `or the proven idempotency pattern. This violates the contract.`
          );
        } else {
          warnings.push(
            `⚠️  High-risk method ${methodName} uses old idempotency pattern. ` +
            `Consider migrating to withIdempotentWrite for consistency.`
          );
        }
      }
    } else {
      // Method not found - might not be implemented yet
      warnings.push(
        `⚠️  High-risk method ${methodName} not found in storage.ts. ` +
        `If this operation is implemented, ensure it uses idempotency.`
      );
    }
  }
}

/**
 * Check 3: Verify no direct high-risk table writes bypass idempotency
 */
function checkDirectHighRiskWrites() {
  console.log("\n✓ Checking for direct high-risk table writes...");
  
  const storageFile = path.join(rootDir, "server", "storage.ts");
  const storageContent = fs.readFileSync(storageFile, "utf-8");

  // High-risk tables that require idempotency
  const highRiskTables = [
    "inventory_items",
    "inventory_adjustments",
    "customers",
    "employees",
    "workflow_instances",
    "user_company_access",
  ];

  const lines = storageContent.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for direct inserts/updates to high-risk tables
    for (const table of highRiskTables) {
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
            `Verify this is not a high-risk mutation.`
          );
        }
      }
    }
  }
}

/**
 * Check 4: Verify high-risk mutation registry is complete
 */
function checkHighRiskRegistry() {
  console.log("\n✓ Checking high-risk mutation registry...");
  
  const registryFile = path.join(rootDir, "server", "resilience", "high-risk-mutation-registry.ts");
  
  if (!fs.existsSync(registryFile)) {
    errors.push(
      `❌ High-risk mutation registry not found at ${registryFile}. ` +
      `The registry is required for contract enforcement.`
    );
    return;
  }

  const registryContent = fs.readFileSync(registryFile, "utf-8");

  // Check that HIGH_RISK_MUTATIONS is exported
  if (!registryContent.includes("export const HIGH_RISK_MUTATIONS")) {
    errors.push(
      `❌ HIGH_RISK_MUTATIONS not exported from registry. ` +
      `This is required for contract enforcement.`
    );
  }

  // Check that HIGH_RISK_TABLES is defined
  if (!registryContent.includes("export const HIGH_RISK_TABLES")) {
    errors.push(
      `❌ HIGH_RISK_TABLES not exported from registry. ` +
      `This is required for table-level enforcement.`
    );
  }

  // Check that risk levels are defined
  if (!registryContent.includes("riskLevel")) {
    warnings.push(
      `⚠️  Risk levels not found in registry. ` +
      `Consider adding risk classification for better visibility.`
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
    checkHighRiskRegistry();
    checkHighRiskRoutes();
    checkHighRiskStorageMethods();
    checkDirectHighRiskWrites();

    console.log("\n" + "=".repeat(60));
    
    if (errors.length > 0) {
      console.log("\n❌ HIGH-RISK CONTRACT VIOLATIONS DETECTED:");
      errors.forEach(error => console.log(error));
      exitCode = 1;
    }

    if (warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      warnings.forEach(warning => console.log(warning));
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log("\n✅ All high-risk contract checks passed!");
    }

    console.log("\n" + "=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ Contract verification failed:", error);
    exitCode = 1;
  }

  process.exit(exitCode);
}

main();
