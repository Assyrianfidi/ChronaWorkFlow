import fs from "node:fs";
import path from "node:path";

function fail(message) {
  console.error(`\n❌ RELEASE GUARD FAILED: ${message}\n`);
  process.exit(1);
}

function normalizeNewlines(s) {
  return String(s).replace(/\r\n/g, "\n");
}

function listFilesRecursive(dirAbs, out = []) {
  if (!fs.existsSync(dirAbs)) return out;
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dirAbs, e.name);
    if (e.isDirectory()) {
      if (
        e.name === "node_modules" ||
        e.name === "dist" ||
        e.name === "build" ||
        e.name === "coverage" ||
        e.name === ".git" ||
        e.name === "storybook-static" ||
        e.name === "generated"
      ) {
        continue;
      }
      listFilesRecursive(abs, out);
      continue;
    }
    out.push(abs);
  }
  return out;
}

function readTextSafe(abs) {
  try {
    return normalizeNewlines(fs.readFileSync(abs, "utf8"));
  } catch {
    return "";
  }
}

function isCodeFile(abs) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(abs);
}

function checkNoFocusedOrSkippedTests(repoRoot) {
  const roots = [
    path.join(repoRoot, "client"),
    path.join(repoRoot, "server"),
    path.join(repoRoot, "backend"),
    path.join(repoRoot, "tests"),
    path.join(repoRoot, "e2e"),
  ];

  const patterns = [
    { label: "focused test (only)", re: /\b(describe|it|test)\.only\s*\(/g },
    { label: "focused test (fit/fdescribe)", re: /\b(fit|fdescribe)\s*\(/g },
    { label: "skipped test (skip)", re: /\b(describe|it|test)\.skip\s*\(/g },
    { label: "skipped test (xit/xdescribe)", re: /\b(xit|xdescribe)\s*\(/g },
  ];

  const offenders = [];
  for (const r of roots) {
    const files = listFilesRecursive(r).filter(isCodeFile);
    for (const abs of files) {
      const text = readTextSafe(abs);
      for (const p of patterns) {
        if (p.re.test(text)) {
          offenders.push({ file: path.relative(repoRoot, abs).replace(/\\/g, "/"), rule: p.label });
        }
        p.re.lastIndex = 0;
      }
    }
  }

  if (offenders.length > 0) {
    const msg = offenders
      .slice(0, 200)
      .map((o) => `- ${o.rule}: ${o.file}`)
      .join("\n");
    fail(`Focused/skipped tests are not allowed in release branches:\n${msg}`);
  }
}

function checkEnvProduction(repoRoot) {
  const envProd = path.join(repoRoot, ".env.production");
  if (!fs.existsSync(envProd)) return;
  const text = readTextSafe(envProd);
  const bad = /(^|\n)\s*ALLOW_DEV_RELAXATIONS\s*=\s*true\s*(\n|$)/i.test(text);
  if (bad) {
    fail(".env.production must not set ALLOW_DEV_RELAXATIONS=true");
  }
}

function main() {
  const repoRoot = process.cwd();
  checkNoFocusedOrSkippedTests(repoRoot);
  checkEnvProduction(repoRoot);
  console.log("✅ Release guard verification passed");
}

main();
