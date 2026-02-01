const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
    "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$":
      "<rootDir>/__mocks__/fileMock.js",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/src/app/",
    "<rootDir>/src/components/accessibility/__tests__/",
    "<rootDir>/src/components/analytics/__tests__/",
    "<rootDir>/src/components/automation/__tests__/",
    "<rootDir>/src/components/integration/__tests__/",
    "<rootDir>/src/components/interaction/__tests__/",
    "<rootDir>/src/components/inventory/__tests__/",
    "<rootDir>/src/components/forms/__tests__/ReportForm.test.tsx",
    "<rootDir>/src/components/adaptive/__tests__/AdaptiveLayoutEngine.test.tsx",
    "<rootDir>/src/components/adaptive/__tests__/basic.test.tsx",
    "<rootDir>/src/pages/inventory/__tests__/InventoryPage.test.tsx",
  ],
  // Test spec file resolution pattern
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ["/node_modules/"],
};

export default config;
