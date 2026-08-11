/* THIS FILE IS PART OF PAYLOAD'S REQUIRED ROUTE SURFACE.
 *
 * Payload ships the admin panel as components rather than as a mounted server,
 * so the app has to hand it a route group to live in. There is nothing of ours
 * in here beyond the wiring.
 */
import type { ServerFunctionClient } from "payload";

import config from "@payload-config";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import React from "react";

import { importMap } from "./admin/importMap.js";

import "@payloadcms/next/css";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
