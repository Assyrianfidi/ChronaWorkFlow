import fs from "node:fs";
import path from "node:path";

function die(msg, details) {
  console.error(`\n❌ WORKFLOW SCRIPT ALIGNMENT FAILED: ${msg}\n`);
  if (details) console.error(JSON.stringify(details, null, 2));
  process.exit(1);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function scriptsFrom(repoRoot, relDir) {
  const pkg = path.join(repoRoot, relDir, "package.json");
  if (!fs.existsSync(pkg)) return new Set();
  const scripts = readJson(pkg)?.scripts || {};
  return new Set(Object.keys(scripts));
}

function normalizeRelDir(s) {
  const v = String(s || "").trim();
  if (!v) return "";
  return v.replace(/^\.\//, "").replace(/^\//, "").replace(/\/$/, "");
}

function chooseScriptSet(rootScripts, clientScripts, backendScripts, workingDir) {
  const wd = normalizeRelDir(workingDir);
  if (wd === "client") return clientScripts;
  if (wd === "backend") return backendScripts;
  return rootScripts;
}

function assertCiCdHasRequiredGates(repoRoot) {
  const ciCd = path.join(repoRoot, ".github", "workflows", "ci-cd.yml");
  if (!fs.existsSync(ciCd)) {
    die("Missing required workflow: .github/workflows/ci-cd.yml");
  }
  const text = String(fs.readFileSync(ciCd, "utf8"));
  const required = [
    "npm run verify:workflow-scripts",
    "npm run verify:test-stubs-tracked",
    "npm run verify:artifact-denylist",
    "npm run verify:env",
    "npm run verify:observability-invariants",
    "npm run verify:test-metrics",
    "npm run verify:release-guard",
  ];
  const missing = required.filter((x) => !text.includes(x));
  if (missing.length) {
    die("ci-cd.yml is missing required governance gates", { missing });
  }
}

function main() {
  const repoRoot = process.cwd();
  const rootScripts = scriptsFrom(repoRoot, ".");
  const clientScripts = scriptsFrom(repoRoot, "client");
  const backendScripts = scriptsFrom(repoRoot, "backend");

  assertCiCdHasRequiredGates(repoRoot);

  const wfDir = path.join(repoRoot, ".github", "workflows");
  if (!fs.existsSync(wfDir)) return;

  const missing = [];
  for (const f of fs.readdirSync(wfDir)) {
    if (!f.endsWith(".yml") && !f.endsWith(".yaml")) continue;
    const abs = path.join(wfDir, f);

    const lines = String(fs.readFileSync(abs, "utf8")).split(/\r?\n/);
    let stepWorkingDir = "";

    for (const line of lines) {
      const stepStart = line.match(/^\s*-\s+name:/);
      if (stepStart) {
        stepWorkingDir = "";
      }

      const wdMatch = line.match(/^\s*working-directory:\s*(.+)\s*$/);
      if (wdMatch?.[1]) {
        stepWorkingDir = wdMatch[1];
      }

      // Detect common inline cd patterns inside multi-line run blocks.
      const cdClient = /\bcd\s+client\b/.test(line);
      const cdBackend = /\bcd\s+backend\b/.test(line);

      const re = /\bnpm\s+run\s+([A-Za-z0-9:_-]+)/g;
      for (const m of line.matchAll(re)) {
        const name = m[1];
        if (!name) continue;

        const effectiveWd = cdClient ? "client" : cdBackend ? "backend" : stepWorkingDir;
        const scripts = chooseScriptSet(rootScripts, clientScripts, backendScripts, effectiveWd);
        if (!scripts.has(name)) {
          missing.push({ workflow: f, script: name, working_directory: normalizeRelDir(effectiveWd) || "(root)" });
        }
      }
    }
  }

  if (missing.length) {
    die("Workflows reference npm scripts that do not exist in root/client/backend package.json", {
      missing,
    });
  }

  console.log("✅ Workflow script alignment passed");
}

main();
