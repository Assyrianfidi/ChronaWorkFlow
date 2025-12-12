"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tsup_1 = require("tsup");
exports.default = (0, tsup_1.defineConfig)({
  entry: ["src/server.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "es2020",
  dts: true,
  sourcemap: true,
  clean: true,
  minify: process.env.NODE_ENV === "production",
  bundle: true,
  splitting: false,
  skipNodeModulesBundle: true,
  platform: "node",
  external: ["@prisma/client", "prisma"],
  esbuildOptions: function (options) {
    options.external = ["@prisma/client", "prisma"];
  },
  onSuccess: "node dist/server.js",
});
