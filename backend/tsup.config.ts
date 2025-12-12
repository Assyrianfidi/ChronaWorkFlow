import { defineConfig } from "tsup";

export default defineConfig({
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
  esbuildOptions(options) {
    options.external = ["@prisma/client", "prisma"];
  },
  onSuccess: "node dist/server.js",
});
