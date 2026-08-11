import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The domain package ships as TypeScript source rather than a build step, so
  // Next has to compile it the same way it compiles the app's own files.
  transpilePackages: ["@hkucc/domain"],
  // This repo writes its own agent instructions — CLAUDE.md at the root, and
  // docs/ beneath it. Next's generated pair would sit inside the workspace and
  // compete with them.
  agentRules: false,
};

export default nextConfig;
