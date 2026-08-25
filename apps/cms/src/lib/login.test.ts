import { describe, expect, it } from "vitest";

import { adminPath, loginUrl, queryString } from "./login";

describe("loginUrl", () => {
  it("sends an editor to the login screen and remembers where they were going", () => {
    expect(loginUrl("/admin", "/admin/import")).toBe(
      "/admin/login?redirect=%2Fadmin%2Fimport",
    );
  });

  // The target is a query parameter, so every character that means something in
  // a query string has to stop meaning it. A raw `?` here truncates the
  // redirect and lands the editor on the bare screen with no explanation.
  it("encodes a target that carries its own query string", () => {
    expect(loginUrl("/admin", "/admin/import?file=saturday&step=2")).toBe(
      "/admin/login?redirect=%2Fadmin%2Fimport%3Ffile%3Dsaturday%26step%3D2",
    );
  });

  it("honours a non-default admin route", () => {
    expect(loginUrl("/cms", "/cms/import")).toBe(
      "/cms/login?redirect=%2Fcms%2Fimport",
    );
  });

  // Nothing to come back to is not a failure — it is the login screen plain.
  it("omits the redirect when there is nowhere to return to", () => {
    expect(loginUrl("/admin", "")).toBe("/admin/login");
    expect(loginUrl("/admin", undefined)).toBe("/admin/login");
  });

  // A trailing slash on the configured admin route would otherwise produce
  // `/admin//login`, which is a different path and 404s.
  it("does not double the separator", () => {
    expect(loginUrl("/admin/", "/admin/import")).toBe(
      "/admin/login?redirect=%2Fadmin%2Fimport",
    );
  });

  // Only somewhere on this site. An absolute URL in `redirect` is an open
  // redirect: a link that looks like the club's login and lands somewhere else.
  it("refuses to send anybody off this site", () => {
    expect(loginUrl("/admin", "https://example.com/phish")).toBe("/admin/login");
    expect(loginUrl("/admin", "//example.com/phish")).toBe("/admin/login");
  });
});

describe("adminPath", () => {
  it("joins the admin route to the segments of the screen", () => {
    expect(adminPath("/admin", ["import"])).toBe("/admin/import");
  });

  it("survives a trailing slash on the configured route", () => {
    expect(adminPath("/admin/", ["import"])).toBe("/admin/import");
  });

  it("is the admin route itself when there are no segments", () => {
    expect(adminPath("/admin", [])).toBe("/admin");
  });
});

describe("queryString", () => {
  it("writes the query back the way it arrived", () => {
    expect(queryString({ file: "saturday", step: "2" })).toBe(
      "?file=saturday&step=2",
    );
  });

  it("keeps a repeated parameter as a list", () => {
    expect(queryString({ team: ["league", "student"] })).toBe(
      "?team=league&team=student",
    );
  });

  // A parameter that was not there is different from one that was empty, and
  // writing `key=` would turn the first into the second.
  it("leaves out what was never there", () => {
    expect(queryString({ file: undefined })).toBe("");
    expect(queryString({})).toBe("");
    expect(queryString(undefined)).toBe("");
  });

  it("escapes what would otherwise punctuate the query", () => {
    expect(queryString({ q: "a&b=c" })).toBe("?q=a%26b%3Dc");
  });
});
