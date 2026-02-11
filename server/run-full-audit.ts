/**
 * QuickBooks-class Accounting Platform
 * COMPREHENSIVE STRESS TEST & AUDIT EXECUTION
 * 
 * This script executes all stress tests and generates the final audit report.
 * Run with: npx ts-node server/run-full-audit.ts
 */

import { runFullStressTestAndAudit } from "./stress-test-harness";

console.log("Initializing comprehensive stress test and audit...");
console.log("This will take approximately 2-5 minutes...\n");

runFullStressTestAndAudit()
  .then((report) => {
    console.log("\n✅ Audit completed successfully");
    
    // Write detailed report to file
    const fs = require("fs");
    const reportPath = "./AUDIT_REPORT.json";
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report written to: ${reportPath}`);
    
    // Exit with appropriate code
    const criticalFailures = report.results.filter(r => r.severity === "CRITICAL" && !r.passed).length;
    process.exit(criticalFailures > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error("\n❌ Audit failed with error:", err);
    process.exit(1);
  });
