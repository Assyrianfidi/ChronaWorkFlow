import fs from "node:fs";
import path from "node:path";

function die(message, details) {
  console.error(`\n❌ OBSERVABILITY INVARIANTS FAILED: ${message}\n`);
  if (details) console.error(JSON.stringify(details, null, 2));
  process.exit(1);
}

function readText(abs) {
  return String(fs.readFileSync(abs, "utf8"));
}

function mustExist(abs, label) {
  if (!fs.existsSync(abs)) {
    die(`Missing required file: ${label}`, { path: abs });
  }
}

function mustInclude(abs, needles, label) {
  const text = readText(abs);
  for (const n of needles) {
    if (!text.includes(n)) {
      die(`Invariant missing: ${label}`, { invariant: n, file: label });
    }
  }
}

function main() {
  const repoRoot = process.cwd();

  const serverIndex = path.join(repoRoot, "server", "index.ts");
  mustExist(serverIndex, "server/index.ts");
  mustInclude(
    serverIndex,
    ["res.setHeader(\"x-request-id\"", "req.requestId = requestId"],
    "server/index.ts request correlation",
  );

  const clientMain = path.join(repoRoot, "client", "src", "main.tsx");
  mustExist(clientMain, "client/src/main.tsx");
  mustInclude(clientMain, ["./utils/errorHandler"], "client/src/main.tsx global errorHandler import");

  const clientErr = path.join(repoRoot, "client", "src", "utils", "errorHandler.ts");
  mustExist(clientErr, "client/src/utils/errorHandler.ts");
  mustInclude(
    clientErr,
    ["unhandledrejection", "addEventListener(\"error\"", "runtime_error"],
    "client/src/utils/errorHandler.ts global handlers",
  );

  const secureClient = path.join(repoRoot, "client", "src", "api", "secure-client.ts");
  mustExist(secureClient, "client/src/api/secure-client.ts");
  mustInclude(
    secureClient,
    ["X-Request-Id", "localStorage.getItem(\"requestId\")", "localStorage.setItem(\"requestId\""],
    "client/src/api/secure-client.ts request-id propagation",
  );

  console.log("✅ Observability invariants passed");
}

main();
