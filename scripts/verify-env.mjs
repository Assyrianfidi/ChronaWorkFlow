import fs from "node:fs";
import path from "node:path";

function die(message, details) {
  console.error(`\n❌ ENV VERIFICATION FAILED: ${message}\n`);
  if (details) console.error(JSON.stringify(details, null, 2));
  process.exit(1);
}

function fileExists(abs) {
  try {
    return fs.existsSync(abs);
  } catch {
    return false;
  }
}

function assertProductionRuntimeEnv() {
  if (String(process.env.NODE_ENV || "").toLowerCase() !== "production") return;
  if (String(process.env.ALLOW_DEV_RELAXATIONS || "").toLowerCase() === "true") {
    die("ALLOW_DEV_RELAXATIONS must not be enabled in production runtime environment");
  }
}

function assertServerPerfEnvShape() {
  if (typeof process.env.SLOW_REQUEST_MS === "undefined") return;
  const v = Number(process.env.SLOW_REQUEST_MS);
  if (!Number.isFinite(v) || v <= 0) {
    die("SLOW_REQUEST_MS must be a positive finite number when set", { value: process.env.SLOW_REQUEST_MS });
  }
}

function readText(abs) {
  return String(fs.readFileSync(abs, "utf8"));
}

function assertFileIncludes(abs, needles, label) {
  if (!fileExists(abs)) {
    die(`Missing required file: ${label}`, { path: abs });
  }
  const t = readText(abs);
  for (const n of needles) {
    if (!t.includes(n)) {
      die(`Missing required invariant in ${label}`, { invariant: n });
    }
  }
}

function main() {
  const repoRoot = process.cwd();
  assertProductionRuntimeEnv();
  assertServerPerfEnvShape();

  const envProd = path.join(repoRoot, ".env.production");
  if (fileExists(envProd)) {
    const t = readText(envProd);
    if (/(^|\n)\s*ALLOW_DEV_RELAXATIONS\s*=\s*true\s*(\n|$)/i.test(t)) {
      die(".env.production must not set ALLOW_DEV_RELAXATIONS=true");
    }
  }

  // Observability defaults must be safe and always present.
  assertFileIncludes(
    path.join(repoRoot, "server", "index.ts"),
    [
      "res.setHeader(\"x-request-id\"",
      "process.env.SLOW_REQUEST_MS || 1500",
    ],
    "server/index.ts",
  );

  assertFileIncludes(
    path.join(repoRoot, "client", "src", "api", "secure-client.ts"),
    [
      "VITE_SLOW_API_MS",
      "|| 1500",
      "VITE_PERF_SAMPLE_RATE",
      "|| 0.05",
    ],
    "client/src/api/secure-client.ts",
  );

  console.log("✅ Env verification passed");
}

main();
