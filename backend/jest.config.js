export default {
  testEnvironment: "node",

  testMatch: ["**/tests/**/*.test.js"],

  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  transform: {},

  transformIgnorePatterns: [
    "node_modules/",
    "<rootDir>/src/generated/prisma/",
  ],
};