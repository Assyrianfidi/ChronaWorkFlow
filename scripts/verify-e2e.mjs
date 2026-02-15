import { spawn } from 'node:child_process';
import process from 'node:process';

const ROOT = process.cwd();

const isWin = process.platform === 'win32';
const NPX = isWin ? 'npx.cmd' : 'npx';
const NPM = isWin ? 'npm.cmd' : 'npm';
const NODE = isWin ? 'node.exe' : 'node';

const SCHEMA_PATH = 'server/prisma/schema.prisma';
const SERVER_ENTRY = 'server/app.mjs';
const SMOKE_ENTRY = 'scripts/phase1-smoke.mjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const HEALTH_PATH = process.env.HEALTH_PATH || '/api/health';

const withBuild = process.argv.includes('--with-build');

const run = (cmd, args, { name, env } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: isWin,
      env: {
        ...process.env,
        ...env,
      },
      windowsHide: false,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${name || cmd} terminated by signal ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${name || cmd} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const waitForHealth = async ({ timeoutMs = 30_000, intervalMs = 750 } = {}) => {
  const deadline = Date.now() + timeoutMs;
  const url = `${BASE_URL}${HEALTH_PATH}`;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // ignore and retry
    }

    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for health endpoint: ${url}`);
};

const startServer = () => {
  const child = spawn(NODE, [SERVER_ENTRY], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
    },
    windowsHide: false,
  });

  return child;
};

const stopServer = async (child) => {
  if (!child || child.killed) return;

  const killWith = (signal) => {
    try {
      child.kill(signal);
    } catch {
      // ignore
    }
  };

  killWith('SIGTERM');

  const exited = await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    sleep(6_000).then(() => null),
  ]);

  if (exited == null) {
    killWith('SIGKILL');
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      sleep(4_000),
    ]);
  }
};

let serverProc;

const onExit = async () => {
  try {
    await stopServer(serverProc);
  } catch {
    // ignore
  }
};

process.on('SIGINT', () => void onExit().finally(() => process.exit(130)));
process.on('SIGTERM', () => void onExit().finally(() => process.exit(143)));
process.on('exit', () => {
  // best-effort; cannot await here
  void onExit();
});

const main = async () => {
  console.log('=== AccuBooks E2E Verify (local) ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Health:   ${HEALTH_PATH}`);
  console.log(`Build:    ${withBuild ? 'enabled' : 'disabled'}`);
  console.log('');

  console.log('1) Prisma validate');
  await run(NPX, ['prisma', 'validate', '--schema', SCHEMA_PATH], { name: 'prisma validate' });

  console.log('');
  console.log('2) Prisma generate (ensure server is NOT running to avoid Windows EPERM)');
  await run(NPX, ['prisma', 'generate', '--schema', SCHEMA_PATH], { name: 'prisma generate' });

  console.log('');
  console.log('3) Start backend server');
  serverProc = startServer();

  try {
    console.log('');
    console.log('4) Wait for /api/health');
    await waitForHealth({ timeoutMs: 45_000 });

    console.log('');
    console.log('5) Phase 1 smoke test');
    await run(NODE, [SMOKE_ENTRY], { name: 'phase1 smoke' });

    if (withBuild) {
      console.log('');
      console.log('6) Frontend build');
      await run(NPM, ['run', 'build'], { name: 'npm run build' });
    }

    console.log('');
    console.log('✅ verify:e2e PASS');
  } finally {
    console.log('');
    console.log('Stopping backend server (idle repo state)...');
    await stopServer(serverProc);
    serverProc = undefined;
  }
};

await main();
