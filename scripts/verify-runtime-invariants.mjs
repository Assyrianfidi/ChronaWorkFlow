import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function die(message, details) {
  console.error(`\n❌ RUNTIME INVARIANTS FAILED: ${message}\n`);
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

function safeReadIfExists(abs) {
  if (!fs.existsSync(abs)) return null;
  return readText(abs);
}

function listExistingFiles(repoRoot, relFiles) {
  const out = [];
  for (const rel of relFiles) {
    const abs = path.join(repoRoot, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) out.push({ rel, abs });
  }
  return out;
}

function listMatchingFiles(repoRoot, relDir, filenameRe) {
  const absDir = path.join(repoRoot, relDir);
  if (!fs.existsSync(absDir)) return [];
  if (!fs.statSync(absDir).isDirectory()) return [];
  const out = [];
  for (const f of fs.readdirSync(absDir)) {
    if (!filenameRe.test(f)) continue;
    const abs = path.join(absDir, f);
    if (fs.statSync(abs).isFile()) out.push({ rel: path.join(relDir, f), abs });
  }
  return out;
}

function listFilesRecursive(repoRoot, relDir, fileRe) {
  const absDir = path.join(repoRoot, relDir);
  const out = [];
  if (!fs.existsSync(absDir)) return out;
  if (!fs.statSync(absDir).isDirectory()) return out;

  const stack = [absDir];
  while (stack.length) {
    const cur = stack.pop();
    for (const name of fs.readdirSync(cur)) {
      const abs = path.join(cur, name);
      const st = fs.statSync(abs);
      if (st.isDirectory()) {
        if (
          name === "node_modules" ||
          name === "dist" ||
          name === "backup" ||
          name === "Archive" ||
          name === "DoNotTouch" ||
          name === "__tests__" ||
          name === "test" ||
          name === "tests"
        ) {
          continue;
        }
        stack.push(abs);
        continue;
      }
      if (!st.isFile()) continue;
      if (!fileRe.test(name)) continue;
      const rel = normalizeRel(path.relative(repoRoot, abs));
      out.push({ rel, abs });
    }
  }
  return out;
}

function normalizeRel(rel) {
  return rel.replace(/\\/g, "/");
}

function scanForExecutedServerTargets(file, allowedExecutedServerTargets) {
  const text = readText(file.abs);
  const normalizedRel = normalizeRel(file.rel);

  const candidates = new Set();

  // Heuristics: identify direct execution of a TypeScript/JS file.
  // This intentionally errs on the side of catching executable targets.
  const patterns = [
    /\bnode\b[^\n\r]*\b(server\/[\w./-]+\.(?:ts|js))\b/g,
    /\btsx\b[^\n\r]*\b(server\/[\w./-]+\.(?:ts|js))\b/g,
    /\bts-node\b[^\n\r]*\b(server\/[\w./-]+\.(?:ts|js))\b/g,
    /\bnodemon\b[^\n\r]*--exec\s+tsx\s+\b(server\/[\w./-]+\.(?:ts|js))\b/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      candidates.add(m[1]);
    }
  }

  if (!candidates.size) return;

  const forbidden = [];
  for (const target of candidates) {
    if (!allowedExecutedServerTargets.some((x) => x === target || (x instanceof RegExp && x.test(target)))) {
      forbidden.push(target);
    }
  }
  if (forbidden.length) {
    die("Non-canonical server entrypoint executed via node/tsx/ts-node", {
      file: normalizedRel,
      executed_targets: [...candidates],
      forbidden_executed_targets: forbidden,
      allowed: allowedExecutedServerTargets.map((x) => (x instanceof RegExp ? String(x) : x)),
    });
  }
}

function mustNotIncludeInFile(file, forbidden) {
  const text = readText(file.abs);
  const hits = forbidden.filter((x) => text.includes(x));
  if (hits.length) {
    die("Forbidden runtime entrypoint reference detected", {
      file: file.rel,
      forbidden_hits: hits,
    });
  }
}

function mustIncludeInFile(file, required) {
  const text = readText(file.abs);
  const missing = required.filter((x) => !text.includes(x));
  if (missing.length) {
    die("Required runtime invariant missing", {
      file: file.rel,
      missing,
    });
  }
}

function warn(message, details) {
  console.warn(`\n⚠️  RUNTIME INVARIANT WARNING: ${message}\n`);
  if (details) console.warn(JSON.stringify(details, null, 2));
}

function parseTsFile(abs) {
  const text = readText(abs);
  return ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function getStringLiteral(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

function isIdentifierNamed(node, name) {
  return !!node && ts.isIdentifier(node) && node.text === name;
}

function isAppCall(node, method) {
  if (!ts.isCallExpression(node)) return false;
  const expr = node.expression;
  if (!ts.isPropertyAccessExpression(expr)) return false;
  if (!isIdentifierNamed(expr.expression, "app")) return false;
  return expr.name.text === method;
}

function isApiMountCall(node) {
  if (!isAppCall(node, "use")) return false;
  const args = node.arguments || [];
  return getStringLiteral(args[0]) === "/api";
}

function isApiPrefixedFirstArg(callExpr) {
  const first = callExpr?.arguments?.[0];
  const lit = getStringLiteral(first);
  return typeof lit === "string" && lit.startsWith("/api");
}

function findCreateAppFunction(sourceFile) {
  for (const st of sourceFile.statements) {
    if (ts.isFunctionDeclaration(st) && st.name?.text === "createApp" && st.body) {
      return st;
    }
  }
  return null;
}

function checkStaticApiGuardChain(repoRoot) {
  const appTs = path.join(repoRoot, "server", "app.ts");
  mustExist(appTs, "server/app.ts");

  const sf = parseTsFile(appTs);
  const createAppFn = findCreateAppFunction(sf);
  if (!createAppFn) {
    die("server/app.ts must export function createApp()", { file: "server/app.ts" });
  }

  const bodyStatements = createAppFn.body.statements;

  const directApiMounts = [];
  for (let i = 0; i < bodyStatements.length; i += 1) {
    const st = bodyStatements[i];
    if (!ts.isExpressionStatement(st)) continue;
    const expr = st.expression;
    if (!ts.isCallExpression(expr)) continue;
    if (!isApiMountCall(expr)) continue;
    directApiMounts.push({ index: i, node: expr });
  }

  // Also count *any* /api mounts in app.ts. If the only mount is not a top-level statement
  // inside createApp(), treat it as conditional / non-canonical.
  let totalApiMountsInFile = 0;
  (function walk(node) {
    if (ts.isCallExpression(node) && isApiMountCall(node)) totalApiMountsInFile += 1;
    ts.forEachChild(node, walk);
  })(sf);

  if (directApiMounts.length !== 1) {
    if (totalApiMountsInFile === 1 && directApiMounts.length === 0) {
      die("/api mount is conditional or not a top-level statement inside createApp()", {
        file: "server/app.ts",
      });
    }
    die("Exactly one app.use('/api', ...) mount must exist in createApp()", {
      file: "server/app.ts",
      direct_api_mounts_found: directApiMounts.length,
      total_api_mounts_in_file: totalApiMountsInFile,
    });
  }

  const mount = directApiMounts[0];
  const mountArgs = mount.node.arguments || [];
  const expectedChain = [
    "authenticate",
    "enforceCompanyIsolation",
    "authorizeRequest",
    "enforceBillingStatus",
    "enforcePlanLimits",
  ];

  if (mountArgs.length !== 1 + expectedChain.length) {
    die("/api guard-chain mount must include exactly the required middleware (no more, no less)", {
      file: "server/app.ts",
      expected_argument_count: 1 + expectedChain.length,
      actual_argument_count: mountArgs.length,
    });
  }

  for (let i = 0; i < expectedChain.length; i += 1) {
    const arg = mountArgs[i + 1];
    if (!ts.isCallExpression(arg) || !ts.isIdentifier(arg.expression) || arg.expression.text !== expectedChain[i]) {
      die("/api guard-chain middleware order mismatch", {
        file: "server/app.ts",
        expected_order: expectedChain,
        at_index: i,
        expected_middleware: expectedChain[i],
        actual_node_kind: arg ? ts.SyntaxKind[arg.kind] : null,
      });
    }
  }

  const apiMethods = new Set(["use", "get", "post", "put", "patch", "delete", "all"]);
  const preGuardApiUses = [];
  for (let i = 0; i < mount.index; i += 1) {
    const st = bodyStatements[i];
    if (!ts.isExpressionStatement(st)) continue;
    const expr = st.expression;
    if (!ts.isCallExpression(expr)) continue;
    const callee = expr.expression;
    if (!ts.isPropertyAccessExpression(callee)) continue;
    if (!isIdentifierNamed(callee.expression, "app")) continue;
    if (!apiMethods.has(callee.name.text)) continue;
    if (!isApiPrefixedFirstArg(expr)) continue;
    preGuardApiUses.push({ method: callee.name.text, index: i });
  }
  if (preGuardApiUses.length) {
    die("/api routes or middleware are mounted before the canonical /api guard chain", {
      file: "server/app.ts",
      pre_guard_api_uses: preGuardApiUses,
    });
  }

  // Fail if *any* other server/*.ts file mounts /api.
  const serverTs = listFilesRecursive(repoRoot, "server", /\.ts$/);
  const extraMounts = [];
  for (const file of serverTs) {
    if (normalizeRel(file.rel) === "server/app.ts") continue;
    const src = parseTsFile(file.abs);
    let found = 0;
    (function walk(node) {
      if (ts.isCallExpression(node) && isApiMountCall(node)) found += 1;
      ts.forEachChild(node, walk);
    })(src);
    if (found) {
      extraMounts.push({ file: normalizeRel(file.rel), count: found });
    }
  }
  if (extraMounts.length) {
    die("Second /api mount point detected outside server/app.ts", {
      extra_mounts: extraMounts,
    });
  }
}

function checkStorageWriteGuards(repoRoot) {
  const storageTs = path.join(repoRoot, "server", "storage.ts");
  mustExist(storageTs, "server/storage.ts");

  const sf = parseTsFile(storageTs);
  const violations = [];

  function hasWriteOperation(node) {
    let found = false;
    (function walk(n) {
      if (found) return;
      if (ts.isCallExpression(n)) {
        const expr = n.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          const name = expr.name?.text;
          if (name === "insert" || name === "update" || name === "delete") {
            found = true;
            return;
          }
        }
      }
      ts.forEachChild(n, walk);
    })(node);
    return found;
  }

  function hasWriteGuard(node) {
    let found = false;
    (function walk(n) {
      if (found) return;
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
        const name = n.expression.text;
        if (name === "enforceWriteCompanyScope" || name === "forbidUnscopedWrite") {
          found = true;
          return;
        }
      }
      ts.forEachChild(n, walk);
    })(node);
    return found;
  }

  for (const st of sf.statements) {
    if (!ts.isClassDeclaration(st) || st.name?.text !== "DatabaseStorage") continue;

    for (const member of st.members) {
      if (!ts.isMethodDeclaration(member) || !member.body) continue;
      const methodName = member.name && ts.isIdentifier(member.name) ? member.name.text : null;
      if (!methodName) continue;

      if (!hasWriteOperation(member.body)) continue;
      if (hasWriteGuard(member.body)) continue;

      violations.push({ method: methodName });
    }
  }

  if (violations.length) {
    die("Storage write drift detected: write method missing tenant write guard", {
      file: "server/storage.ts",
      violations,
      required_guards: ["enforceWriteCompanyScope", "forbidUnscopedWrite"],
    });
  }
}

function main() {
  const repoRoot = process.cwd();

  checkStaticApiGuardChain(repoRoot);
  checkStorageWriteGuards(repoRoot);

  const canonicalDevEntrypoint = "server/index.ts";
  const canonicalProdEntrypoint = "dist/server/index.js";

  const packageJson = path.join(repoRoot, "package.json");
  mustExist(packageJson, "package.json");

  const serverIndex = path.join(repoRoot, "server", "index.ts");
  mustExist(serverIndex, "server/index.ts");

  const pkg = JSON.parse(readText(packageJson));
  const scripts = pkg?.scripts || {};
  if (typeof scripts.start !== "string" || !scripts.start.includes(canonicalProdEntrypoint)) {
    die("package.json scripts.start must run the canonical production server entrypoint", {
      expected_to_include: canonicalProdEntrypoint,
      actual: scripts.start,
    });
  }
  if (typeof scripts["start:dev"] !== "string" || !scripts["start:dev"].includes(canonicalDevEntrypoint)) {
    die("package.json scripts.start:dev must run the canonical dev server entrypoint", {
      expected_to_include: canonicalDevEntrypoint,
      actual: scripts["start:dev"],
    });
  }

  const forbiddenEntrypointFragments = [
    "src/index.ts",
    "backend/src/index.ts",
    "backend/src/server.ts",
    "backend/src/server-simple.ts",
    "backend/src/server-minimal.ts",
    "backend/server.js",
    "backend/server.mjs",
    "server.simple.js",
    "dist/index.js",
    "dist/backend",
  ];

  const dockerfiles = [
    ...listMatchingFiles(repoRoot, ".", /^Dockerfile(\\..+)?$/),
    ...listMatchingFiles(repoRoot, "backend", /^Dockerfile(\\..+)?$/),
    ...listMatchingFiles(repoRoot, "client", /^Dockerfile(\\..+)?$/),
    ...listMatchingFiles(repoRoot, "docs", /^Dockerfile(\\..+)?$/),
    ...listMatchingFiles(repoRoot, "status", /^Dockerfile(\\..+)?$/),
  ];

  const composeFiles = [
    ...listMatchingFiles(repoRoot, ".", /^docker-compose.*\\.ya?ml$/),
    ...listMatchingFiles(repoRoot, "backend", /^docker-compose.*\\.ya?ml$/),
  ];

  const workflowFiles = listMatchingFiles(repoRoot, ".github/workflows", /\\.ya?ml$/);
  const scriptFiles = [
    ...listMatchingFiles(repoRoot, "scripts", /\\.(mjs|js|ts|ps1|sh)$/),
    ...listMatchingFiles(repoRoot, "backend", /\\.(mjs|js|ts|ps1|sh)$/),
  ];

  const legacyEntrypoints = [
    "src/index.ts",
    "backend/src/index.ts",
    "backend/src/server.ts",
    "backend/src/server-simple.ts",
    "backend/src/server-minimal.ts",
    "backend/server.js",
    "backend/server.mjs",
  ];
  const legacyExisting = legacyEntrypoints.filter((rel) => fs.existsSync(path.join(repoRoot, rel)));
  if (legacyExisting.length) {
    warn(
      "Legacy/alternate server entrypoint files exist in the repo. This is allowed only because CI enforces they are unreachable (no scripts/Docker/compose may reference them).",
      { legacy_existing: legacyExisting },
    );
  }

  const topLevelServerTsFiles = listMatchingFiles(repoRoot, "server", /^[^/\\]+\.ts$/).map((x) => normalizeRel(x.rel));
  const allowedTopLevelServerTsFiles = new Set([
    "server/app.ts",
    "server/db.ts",
    "server/index.ts",
    "server/minimal.ts",
    "server/prisma.ts",
    "server/routes-legacy.ts",
    "server/routes.ts",
    "server/seed.ts",
    "server/storage.ts",
    "server/vite.ts",
    "server/worker.ts",
  ]);
  const unexpectedTopLevel = topLevelServerTsFiles.filter((rel) => !allowedTopLevelServerTsFiles.has(rel));
  if (unexpectedTopLevel.length) {
    die("New top-level server/*.ts file detected (potential second runtime entrypoint)", {
      unexpected_top_level_server_ts_files: unexpectedTopLevel,
      allowed_top_level_server_ts_files: [...allowedTopLevelServerTsFiles],
    });
  }

  const allowedExecutedServerTargets = [
    canonicalDevEntrypoint,
    /server\/migration\/[\w./-]+\.ts$/,
  ];

  for (const file of [...dockerfiles, ...composeFiles, ...workflowFiles, ...scriptFiles]) {
    if (normalizeRel(file.rel) === "scripts/verify-runtime-invariants.mjs") continue;
    mustNotIncludeInFile(file, forbiddenEntrypointFragments);
    scanForExecutedServerTargets(file, allowedExecutedServerTargets);
  }

  const dockerfileDev = dockerfiles.find((x) => x.rel === "Dockerfile.dev");
  if (dockerfileDev) {
    mustIncludeInFile(dockerfileDev, ["npm", "start:dev"]);
  }

  console.log("✅ Runtime invariants passed");
}

main();
