import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run a single test with detailed output
const testCommand =
  'npx jest src/__tests__/integration/report-api.test.js -t "should return all reports for admin" --config=jest.config.cjs --verbose';

console.log(`Running: ${testCommand}`);

const child = exec(testCommand, { cwd: __dirname });

child.stdout.on("data", (data) => {
  console.log(data);
});

child.stderr.on("data", (data) => {
  console.error(data);
});

child.on("close", (code) => {
  console.log(`Test process exited with code ${code}`);
  process.exit(code);
});
