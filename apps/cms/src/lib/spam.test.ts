import { describe, expect, it } from "vitest";

import { MIN_ELAPSED_MS, spamReason } from "./spam";

describe("spamReason", () => {
  it("passes a submission with an empty honeypot and a plausible delay", () => {
    expect(spamReason({ honeypot: "", elapsedMs: MIN_ELAPSED_MS })).toBeUndefined();
    expect(
      spamReason({ honeypot: "", elapsedMs: MIN_ELAPSED_MS + 30_000 }),
    ).toBeUndefined();
  });

  it("rejects a filled honeypot regardless of timing", () => {
    expect(
      spamReason({ honeypot: "https://spam.example", elapsedMs: 60_000 }),
    ).toMatch(/hidden field/);
  });

  it("does not treat stray whitespace in the honeypot as filled", () => {
    // Browser autofill and password managers occasionally pad a field with
    // whitespace even when a person never touched it — trimming first keeps
    // that from becoming a false positive.
    expect(
      spamReason({ honeypot: "   ", elapsedMs: 60_000 }),
    ).toBeUndefined();
  });

  it("rejects a submission with no timing signal at all", () => {
    expect(spamReason({ honeypot: "", elapsedMs: undefined })).toMatch(
      /timing signal/,
    );
  });

  it("rejects a submission faster than a person could type", () => {
    expect(spamReason({ honeypot: "", elapsedMs: 0 })).toMatch(/too fast/);
    expect(spamReason({ honeypot: "", elapsedMs: MIN_ELAPSED_MS - 1 })).toMatch(
      /too fast/,
    );
  });

  it("rejects a negative elapsed time as a clock that cannot be trusted", () => {
    expect(spamReason({ honeypot: "", elapsedMs: -1 })).toMatch(/future/);
  });

  it("accepts the threshold itself", () => {
    expect(spamReason({ honeypot: "", elapsedMs: MIN_ELAPSED_MS })).toBeUndefined();
  });
});
