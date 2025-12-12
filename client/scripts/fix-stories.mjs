import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORIES_DIR = path.join(__dirname, "../src");
const LOG_FILE = path.join(__dirname, "../devops/storybook-fixes.log");

const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
};

const processStoryFile = async (filePath) => {
  try {
    let content = await fs.promises.readFile(filePath, "utf8");
    let updated = false;

    // Convert to CSF3 format if needed
    if (content.includes("storiesOf(")) {
      log(`Converting ${filePath} to CSF3 format...`);
      // This is a simplified example - in a real implementation, we'd use a proper transformer
      content = content.replace(
        /storiesOf\('([^']+)', module\)/g,
        "export default {\n  title: '$1',\n  component: Component,\n} as ComponentMeta<typeof Component>;",
      );
      updated = true;
    }

    // Ensure proper default export
    if (!content.match(/export default\s*{/)) {
      log(`Adding default export to ${filePath}...`);
      const componentName = path.basename(filePath).replace(".stories.tsx", "");
      content += `\n\nexport default {\n  title: 'Components/${componentName}',\n  component: ${componentName},\n  tags: ['autodocs'],\n};\n`;
      updated = true;
    }

    if (updated) {
      await fs.promises.writeFile(filePath, content, "utf8");
      log(`✅ Updated ${filePath}`);
    }

    return updated;
  } catch (error) {
    log(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
};

const findStoryFiles = async (dir) => {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  let results = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(await findStoryFiles(fullPath));
    } else if (
      file.name.endsWith(".stories.tsx") ||
      file.name.endsWith(".stories.ts")
    ) {
      results.push(fullPath);
    }
  }

  return results;
};

const main = async () => {
  log("Starting Storybook auto-repair...");
  const storyFiles = await findStoryFiles(STORIES_DIR);
  log(`Found ${storyFiles.length} story files to process`);

  let fixedCount = 0;
  for (const file of storyFiles) {
    if (await processStoryFile(file)) {
      fixedCount++;
    }
  }

  log(
    `\nAuto-repair completed. Fixed ${fixedCount} of ${storyFiles.length} story files.`,
  );
  log("Please check the browser console for any remaining issues.");
};

main().catch(console.error);
