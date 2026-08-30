export default {
  testEnvironment: "node",

  testMatch: ["<rootDir>/tests/**/*.test.js"],

  testPathIgnorePatterns: [
    "/node_modules/",
    "/.vercel/",
  ],

  setupFilesAfterEnv: [
    "<rootDir>/tests/setup.js",
  ],

  clearMocks: true,
};
