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
    // Only the pure seams are under test. Components are verified by the build
    // and in a browser; a jsdom render of a <div> with a class on it proves
    // nothing this page cares about.
    include: ["src/lib/**/*.test.ts"],
    // The suite runs in a zone behind UTC on purpose. Every date on this site is
    // date-only, and the bug this guards against — dropping `timeZone: "UTC"` —
    // is invisible in UTC and on the CI runner, which is also UTC. Here it moves
    // Saturday's fixture to Friday and the test fails.
    env: { TZ: "America/Los_Angeles" },
  },
});
