/// <reference types="vite/client" />
/// <reference types="vitest" />

// Vitest global types
declare const describe: (typeof import("vitest"))["describe"];
declare const it: (typeof import("vitest"))["it"];
declare const expect: (typeof import("vitest"))["expect"];
declare const vi: (typeof import("vitest"))["vi"];
declare const beforeEach: (typeof import("vitest"))["beforeEach"];
declare const afterEach: (typeof import("vitest"))["afterEach"];
declare const beforeAll: (typeof import("vitest"))["beforeAll"];
declare const afterAll: (typeof import("vitest"))["afterAll"];

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
