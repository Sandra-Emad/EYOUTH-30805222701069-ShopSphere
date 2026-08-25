import "@testing-library/jest-dom/vitest";

import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "../mocks/server";
import { resetMockData } from "../mocks/handlers";

beforeAll(() => {
  server.listen({
    onUnhandledRequest: "error",
  });
});

afterEach(() => {
  server.resetHandlers();
  resetMockData();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});