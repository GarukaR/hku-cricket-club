import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // The same `@/*` the app imports through, so a test reads a module the way
    // the app does rather than by a relative path that could drift.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Only the pure seams. Payload's own config is verified by starting it —
    // `docker compose up` is the test that matters for the rest of this app.
    include: ["src/lib/**/*.test.ts"],
  },
});
