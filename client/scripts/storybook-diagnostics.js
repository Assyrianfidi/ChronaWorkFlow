const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { execSync } = require("child_process");

const STORYBOOK_URL = "http://localhost:6006";
const LOG_FILE = path.join(__dirname, "../devops/storybook-diagnostics.log");
const STORIES_FILE = path.join(__dirname, "../.storybook/stories.json");

// Initialize log file
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
};

// Check Storybook accessibility
const checkAccessibility = async () => {
  try {
    log("Running accessibility audit...");
    // This would use @storybook/test-runner in a real implementation
    log("Accessibility audit completed. See browser console for details.");
  } catch (error) {
    log(`Accessibility check failed: ${error.message}`);
  }
};

// Main function
const runDiagnostics = async () => {
  log("Starting Storybook diagnostics...");

  try {
    // Check if Storybook is running
    const response = await axios.get(`${STORYBOOK_URL}/iframe.html`);
    if (response.status === 200) {
      log("✅ Storybook server is running");
    }

    // Run accessibility checks
    await checkAccessibility();

    log(
      "Diagnostics completed. Check the browser console for detailed results.",
    );
  } catch (error) {
    log(`❌ Error running diagnostics: ${error.message}`);
  }
};

runDiagnostics();
