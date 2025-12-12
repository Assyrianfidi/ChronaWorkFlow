/// <reference types="vite/client" />
/// <reference types="vitest" />

// Vitest global types
// @ts-ignore
// @ts-ignore
declare const describe: (typeof import("vitest"))["describe"];
// @ts-ignore
// @ts-ignore
declare const it: (typeof import("vitest"))["it"];
// @ts-ignore
// @ts-ignore
declare const expect: (typeof import("vitest"))["expect"];
// @ts-ignore
// @ts-ignore
declare const vi: (typeof import("vitest"))["vi"];
// @ts-ignore
// @ts-ignore
declare const beforeEach: (typeof import("vitest"))["beforeEach"];
// @ts-ignore
// @ts-ignore
declare const afterEach: (typeof import("vitest"))["afterEach"];
// @ts-ignore
// @ts-ignore
declare const beforeAll: (typeof import("vitest"))["beforeAll"];
// @ts-ignore
// @ts-ignore
declare const afterAll: (typeof import("vitest"))["afterAll"];

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
// @ts-ignore
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
