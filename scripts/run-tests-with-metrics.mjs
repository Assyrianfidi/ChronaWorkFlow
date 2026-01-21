import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function fail(message, details) {
  console.error(`\n❌ TEST METRICS FAILED: ${message}\n`);
  if (details) console.error(JSON.stringify(details, null, 2));
  process.exit(1);
}

function normalizeNewlines(s) {
  return String(s).replace(/\r\n/g, "\n");
}

function readJsonSafe(abs) {
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(abs, obj) {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function run(cmd, args, env) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += String(d)));
    child.stderr.on("data", (d) => (stderr += String(d)));

    child.on("close", (code) => {
      resolve({ code: Number(code), stdout: normalizeNewlines(stdout), stderr: normalizeNewlines(stderr) });
    });
  });
}

function npmCommand(args) {
  const isWin = process.platform === "win32";
  if (isWin) {
    return { cmd: "cmd.exe", args: ["/c", "npm", ...args] };
  }
  return { cmd: "npm", args };
}

function parseVitestSummary(output) {
  // Best-effort parse; vitest output can vary.
  const lines = output.split("\n");
  let durationMs = null;
  for (const line of lines) {
    // Example patterns:
    // "Duration 12.34s"
    // "Duration 1m 2.34s"
    const m = line.match(/\bDuration\s+(.+)$/i);
    if (!m) continue;
    const txt = m[1].trim();
    let ms = 0;
    const min = txt.match(/(\d+)m/);
    const sec = txt.match(/([0-9]+(?:\.[0-9]+)?)s/);
    if (min) ms += Number(min[1]) * 60_000;
    if (sec) ms += Number(sec[1]) * 1000;
    if (ms > 0) durationMs = ms;
  }
  return { durationMs };
}

function pctIncrease(base, current) {
  if (!Number.isFinite(base) || base <= 0) return null;
  return (current - base) / base;
}

function isTrueEnv(v) {
  return String(v || "") === "1" || String(v || "").toLowerCase() === "true";
}

async function main() {
  const repoRoot = process.cwd();
  const baselinePath = path.join(repoRoot, "governance", "test-performance-baseline.json");
  const snapshotPath = path.join(repoRoot, "governance", "test-performance-snapshot.json");

  const updateBaseline = isTrueEnv(process.env.UPDATE_TEST_METRICS_BASELINE);

  const startedAt = Date.now();

  // Use vitest directly to avoid coupling to package.json scripts.
  const npm = npmCommand(["test", "--", "--project", "client"]);
  const r = await run(npm.cmd, npm.args, { CI: process.env.CI || "true" });

  const endedAt = Date.now();
  const wallMs = endedAt - startedAt;

  const summary = parseVitestSummary(`${r.stdout}\n${r.stderr}`);

  const mem = process.memoryUsage();
  const snapshot = {
    generated_at: new Date().toISOString(),
    wall_ms: wallMs,
    vitest_duration_ms: summary.durationMs,
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    },
    exit_code: r.code,
  };

  writeJson(snapshotPath, snapshot);

  if (r.code !== 0) {
    fail("Tests failed; refusing to compute regression metrics.", {
      exit_code: r.code,
      snapshot: path.relative(repoRoot, snapshotPath).replace(/\\/g, "/"),
    });
  }

  const baseline = readJsonSafe(baselinePath);
  if (!baseline) {
    if (!updateBaseline) {
      fail("Missing governance/test-performance-baseline.json (baseline must be created explicitly)", {
        hint: "Run: npm run relock:test-metrics-baseline",
      });
    }

    writeJson(baselinePath, snapshot);
    console.log("✅ Test metrics baseline created (explicit)", {
      baseline: path.relative(repoRoot, baselinePath).replace(/\\/g, "/"),
    });
    return;
  }

  if (updateBaseline) {
    writeJson(baselinePath, snapshot);
    console.log("✅ Test metrics baseline updated (explicit)", {
      baseline: path.relative(repoRoot, baselinePath).replace(/\\/g, "/"),
    });
    return;
  }

  const baselineWall = Number(baseline.wall_ms);
  const baselineHeap = Number(baseline?.memory?.heapUsed);

  const wallIncrease = pctIncrease(baselineWall, snapshot.wall_ms);
  const heapIncrease = pctIncrease(baselineHeap, snapshot.memory.heapUsed);

  const maxWallIncrease = Number(process.env.TEST_WALL_REGRESSION_PCT || 0.5); // 50%
  const maxHeapIncrease = Number(process.env.TEST_HEAP_REGRESSION_PCT || 0.5); // 50%

  if (wallIncrease !== null && wallIncrease > maxWallIncrease) {
    fail("Test wall-time regression exceeded threshold", {
      baseline_wall_ms: baselineWall,
      current_wall_ms: snapshot.wall_ms,
      increase_pct: wallIncrease,
      threshold_pct: maxWallIncrease,
      snapshot: path.relative(repoRoot, snapshotPath).replace(/\\/g, "/"),
    });
  }

  if (heapIncrease !== null && heapIncrease > maxHeapIncrease) {
    fail("Test heapUsed regression exceeded threshold", {
      baseline_heap_used: baselineHeap,
      current_heap_used: snapshot.memory.heapUsed,
      increase_pct: heapIncrease,
      threshold_pct: maxHeapIncrease,
      snapshot: path.relative(repoRoot, snapshotPath).replace(/\\/g, "/"),
    });
  }

  console.log("✅ Test metrics verification passed", {
    wall_ms: snapshot.wall_ms,
    heap_used: snapshot.memory.heapUsed,
    snapshot: path.relative(repoRoot, snapshotPath).replace(/\\/g, "/"),
  });
}

main().catch((e) => fail("Unexpected error", { error: String(e?.message || e) }));
