// update-tsconfig.js
const fs = require("fs");
const path = require("path");

const tsconfigPath = path.join(__dirname, "tsconfig.json");

const tsconfigContent = {
  compilerOptions: {
    module: "ESNext",
    moduleResolution: "Node",
    target: "ES6",
    jsx: "react-jsx",
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
  },
  include: ["src", ".storybook"],
};

// Write the JSON file
fs.writeFileSync(
  tsconfigPath,
  JSON.stringify(tsconfigContent, null, 2),
  "utf-8",
);
console.log("✅ tsconfig.json updated successfully!");
