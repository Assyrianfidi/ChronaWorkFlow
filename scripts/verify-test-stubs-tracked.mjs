import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(message, details) {
  console.error(`\n❌ TEST STUB TRACKING FAILED: ${message}\n`);
  if (details) console.error(JSON.stringify(details, null, 2));
  process.exit(1);
}

function gitLines(args) {
  const r = spawnSync("git", args, { encoding: "utf8" });
  if (r.error) {
    fail("Unable to execute git", { error: String(r.error) });
  }
  if (r.status !== 0) {
    fail("git command failed", { args, stderr: String(r.stderr || "").trim() });
  }
  return String(r.stdout || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function hasAnyFiles(dirAbs) {
  if (!fs.existsSync(dirAbs)) return false;
  const stat = fs.statSync(dirAbs);
  if (!stat.isDirectory()) return false;

  const stack = [dirAbs];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(cur, e.name);
      if (e.isDirectory()) {
        stack.push(abs);
        continue;
      }
      return true;
    }
  }
  return false;
}

function main() {
  const repoRoot = process.cwd();
  const stubRootsRel = ["client/src/test-stubs"];

  const offenders = [];

  for (const rel of stubRootsRel) {
    const abs = path.join(repoRoot, rel);
    if (!hasAnyFiles(abs)) continue;

    const untracked = gitLines(["ls-files", "--others", "--exclude-standard", "--", rel]);
    const ignored = gitLines(["ls-files", "--others", "-i", "--exclude-standard", "--", rel]);

    for (const f of untracked) offenders.push({ type: "untracked", file: f.replace(/\\/g, "/") });
    for (const f of ignored) offenders.push({ type: "ignored", file: f.replace(/\\/g, "/") });
  }

  if (offenders.length) {
    fail("Test stubs must be tracked by git (no untracked/ignored stub files allowed).", {
      offenders: offenders.slice(0, 200),
      count: offenders.length,
    });
  }

  console.log("✅ Test stub tracking verification passed");
}

main();
