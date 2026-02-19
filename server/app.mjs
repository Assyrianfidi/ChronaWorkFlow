/**
 * Canonical Backend Launcher (Non-Destructive Consolidation)
 *
 * Canonical runtime: backend/server.js
 *
 * This file intentionally contains no business logic. It exists to provide
 * exactly one stable backend entrypoint: `node server/app.mjs`.
 */

const CANONICAL_BACKEND_ENTRY = new URL('../backend/server.js', import.meta.url);

function logBanner() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || '5000';
  console.log('AccuBooks Canonical Backend Launcher');
  console.log('============================================================');
  console.log(`NODE_ENV: ${nodeEnv}`);
  console.log(`PORT: ${port}`);
  console.log(`Launching: ${CANONICAL_BACKEND_ENTRY.pathname}`);
  console.log('============================================================');
}

try {
  logBanner();
  await import(CANONICAL_BACKEND_ENTRY.href);
} catch (error) {
  console.error('❌ Failed to launch canonical backend:', error);
  process.exitCode = 1;
}
