import { describe, expect, it } from "vitest";

import { validateEnquiry } from "@/lib/enquiry";

const VALID = { name: "Garuka R", email: "garuka@example.com", message: "I'd like to play." };

describe("validateEnquiry", () => {
  it("passes a fully filled Enquiry", () => {
    expect(validateEnquiry(VALID)).toEqual({});
  });

  it("names the problem and the fix for a missing name", () => {
    const errors = validateEnquiry({ ...VALID, name: "" });
    expect(errors.name).toMatch(/enter your name/i);
  });

  it("treats whitespace-only fields as missing", () => {
    const errors = validateEnquiry({ ...VALID, name: "   ", message: "  \n " });
    expect(errors.name).toBeDefined();
    expect(errors.message).toBeDefined();
  });

  it("names the problem and the fix for a missing email", () => {
    const errors = validateEnquiry({ ...VALID, email: "" });
    expect(errors.email).toMatch(/enter your email/i);
  });

  it("flags an email with no @ or no domain", () => {
    expect(validateEnquiry({ ...VALID, email: "not-an-email" }).email).toMatch(
      /name@example\.com/,
    );
    expect(validateEnquiry({ ...VALID, email: "garuka@" }).email).toBeDefined();
    expect(
      validateEnquiry({ ...VALID, email: "garuka@example" }).email,
    ).toBeDefined();
  });

  it("accepts an ordinary email address", () => {
    expect(
      validateEnquiry({ ...VALID, email: "g.ranasinghe@hku.hk" }).email,
    ).toBeUndefined();
  });

  it("names the problem and the fix for a missing message", () => {
    const errors = validateEnquiry({ ...VALID, message: "" });
    expect(errors.message).toMatch(/write a line/i);
  });

  it("reports every field wrong at once, not just the first", () => {
    const errors = validateEnquiry({ name: "", email: "", message: "" });
    expect(Object.keys(errors).sort()).toEqual(["email", "message", "name"]);
  });
});
