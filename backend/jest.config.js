export default {
  testEnvironment: "node",

  testMatch: ["<rootDir>/tests/**/*.test.js"],

  testPathIgnorePatterns: ["/node_modules/", "/.vercel/"],

  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  transform: {},

  transformIgnorePatterns: [
    "node_modules/",
    "<rootDir>/src/generated/prisma/",
  ],

  clearMocks: true,
};
