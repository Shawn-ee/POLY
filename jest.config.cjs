/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  resetMocks: true,
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "src/server/services/__tests__/ledger\\.phase3\\.test\\.ts$",
    "src/server/services/__tests__/canonical_unit\\.phase5\\.test\\.ts$",
    "src/server/services/__tests__/canonical_client\\.phase6\\.test\\.ts$",
  ],
};
