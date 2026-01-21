import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(message, details) {
  console.error(`\n❌ ARTIFACT POLICY VIOLATION: ${message}\n`);
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

function toPosix(p) {
  return String(p).replace(/\\/g, "/");
}

function parsePolicy(policyAbs) {
  if (!fs.existsSync(policyAbs)) {
    fail("Missing required policy file", { policy: toPosix(path.relative(process.cwd(), policyAbs)) });
  }

  const text = String(fs.readFileSync(policyAbs, "utf8"));

  function extractBlock(beginMarker, endMarker) {
    const begin = text.indexOf(beginMarker);
    const end = text.indexOf(endMarker);
    if (begin === -1 || end === -1 || end <= begin) return null;

    const between = text.slice(begin + beginMarker.length, end);
    const fenceStart = between.indexOf("```");
    if (fenceStart === -1) return null;
    const afterFenceStart = between.slice(fenceStart + 3);
    const fenceEnd = afterFenceStart.indexOf("```");
    if (fenceEnd === -1) return null;
    const body = afterFenceStart.slice(0, fenceEnd);

    return body
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const denylist = extractBlock("<!-- BEGIN DENYLIST -->", "<!-- END DENYLIST -->");
  const allowlist = extractBlock("<!-- BEGIN ALLOWLIST -->", "<!-- END ALLOWLIST -->");

  if (!denylist || !denylist.length) {
    fail("Policy denylist block is missing or empty", { policy: toPosix(path.relative(process.cwd(), policyAbs)) });
  }
  if (!allowlist || !allowlist.length) {
    fail("Policy allowlist block is missing or empty", { policy: toPosix(path.relative(process.cwd(), policyAbs)) });
  }

  const invalidAllow = allowlist.filter((p) => p.includes("*"));
  if (invalidAllow.length) {
    fail("Allowlist must not contain wildcards", { invalidAllowlistEntries: invalidAllow });
  }

  return {
    denylist,
    allowlist: new Set(allowlist.map(toPosix)),
  };
}

function matchesDenylist(file, denylist) {
  for (const pat of denylist) {
    if (pat.endsWith("/**")) {
      const prefix = pat.slice(0, -3);
      if (file === prefix || file.startsWith(`${prefix}/`)) return pat;
      continue;
    }

    if (pat.endsWith("/")) {
      const prefix = pat.slice(0, -1);
      if (file === prefix || file.startsWith(`${prefix}/`)) return pat;
      continue;
    }

    if (pat.startsWith("**/*.")) {
      const ext = pat.slice("**/*".length);
      if (file.endsWith(ext)) return pat;
      continue;
    }

    if (pat.endsWith("/**") && pat.includes("/")) {
      const prefix = pat.slice(0, -3);
      if (file === prefix || file.startsWith(`${prefix}/`)) return pat;
      continue;
    }

    if (file === pat) return pat;
  }
  return null;
}

function main() {
  const repoRoot = process.cwd();
  const policyAbs = path.join(repoRoot, "governance", "artifact-policy.md");
  const { denylist, allowlist } = parsePolicy(policyAbs);

  const staged = new Set(
    gitLines(["diff", "--name-only", "--cached", "--diff-filter=ACMR"]).map(toPosix)
  );
  const tracked = new Set(gitLines(["ls-files"]).map(toPosix));

  const offenders = [];

  function consider(kind, file) {
    if (!file) return;
    if (file.startsWith("node_modules/") || file.includes("/node_modules/")) return;

    if (file.startsWith("governance/")) {
      if (!allowlist.has(file)) {
        offenders.push({ kind, file, rule: "governance-allowlist" });
      }
      return;
    }

    if (allowlist.has(file)) return;

    const matched = matchesDenylist(file, denylist);
    if (matched) {
      offenders.push({ kind, file, rule: matched });
    }
  }

  for (const f of staged) consider("staged", f);
  for (const f of tracked) consider("tracked", f);

  if (offenders.length) {
    offenders.sort((a, b) =>
      a.kind.localeCompare(b.kind) || a.file.localeCompare(b.file) || a.rule.localeCompare(b.rule)
    );

    fail("Denylisted artifacts (or non-allowlisted governance files) are tracked or staged.", {
      policy: "governance/artifact-policy.md",
      offenders,
      count: offenders.length,
      remediation:
        "Remove denylisted files from git tracking (e.g., git rm --cached) or revert the staged change. Governance files under governance/ must be exactly allowlisted.",
    });
  }

  console.log("✅ Artifact denylist verification passed");
}

main();
