import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORIES_DIR = path.join(__dirname, "../src");
const LOG_FILE = path.join(
  __dirname,
  "../devops/storybook-default-cleanup.log",
);

const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
};

const duplicatePattern =
  /\n{0,2}export default \{[\s\S]*?tags:\s*\['autodocs'\],[\s\S]*?\};\s*$/;

const findStoryFiles = async (dir) => {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findStoryFiles(fullPath)));
    } else if (/\.stories\.(t|j)sx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
};

const processFile = async (filePath) => {
  const content = await fs.promises.readFile(filePath, "utf8");
  const hasMetaExport = content.includes("export default meta");
  const hasDuplicateBlock = duplicatePattern.test(content);

  if (hasMetaExport && hasDuplicateBlock) {
    const updated = content.replace(duplicatePattern, "\n");
    await fs.promises.writeFile(filePath, updated.trimEnd() + "\n", "utf8");
    log(`✅ Removed duplicate default export from ${filePath}`);
    return true;
  }

  return false;
};

const main = async () => {
  fs.writeFileSync(
    LOG_FILE,
    `Storybook default cleanup - ${new Date().toISOString()}\n\n`,
  );
  const storyFiles = await findStoryFiles(STORIES_DIR);
  let cleaned = 0;

  for (const file of storyFiles) {
    if (await processFile(file)) cleaned += 1;
  }

  log(`Cleanup complete. Files updated: ${cleaned}`);
};

main().catch((error) => {
  log(`❌ Cleanup failed: ${error.message}`);
  process.exit(1);
});
