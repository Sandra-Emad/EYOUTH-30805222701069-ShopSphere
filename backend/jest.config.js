export default {
  testEnvironment: "node",

  testMatch: ["**/tests/**/*.test.js"],

  transform: {},

  transformIgnorePatterns: [
    "node_modules/",
    "<rootDir>/src/generated/prisma/"
  ],
};