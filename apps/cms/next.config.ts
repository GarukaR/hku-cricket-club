import path from "node:path";
import { fileURLToPath } from "node:url";

import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // The image copies one directory and runs it. Without this Next expects the
  // whole node_modules tree at runtime, which for Payload is most of a gigabyte.
  output: "standalone",

  // File tracing has to start at the repo root or it misses the hoisted
  // node_modules and the `@hkucc/domain` workspace, both of which live above
  // this app. The symptom is a build that succeeds and an image that cannot
  // resolve `payload` at start-up.
  outputFileTracingRoot: path.resolve(dirname, "../.."),

  // The domain package ships as TypeScript source rather than a build step, so
  // Next has to compile it the same way it compiles the app's own files.
  transpilePackages: ["@hkucc/domain"],

  // This repo writes its own agent instructions — CLAUDE.md at the root, and
  // docs/ beneath it. Next's generated pair would sit inside the workspace and
  // compete with them.
  agentRules: false,

  // There is nothing at the root of this app and never will be; it exists to
  // serve the admin panel. A committee member who types the bare hostname
  // should land somewhere useful rather than on a 404.
  async redirects() {
    return [{ source: "/", destination: "/admin", permanent: false }];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
