import { describe, expect, it } from "vitest";

import {
  publiclyReadable,
  publiclyReadableWhenPublished,
} from "@/collections/access";

/**
 * The one rule keeping an unverified match off the public site.
 *
 * Payload does not do this for us — a draft sits in the main table beside the
 * published records, and an anonymous `find` returns it unless something
 * filters it. That was established against a real Payload instance; what is
 * locked here is our half of it, because the failure is silent: the site would
 * simply start printing matches the club has not checked.
 */
const asked = (
  access: { read: (args: never) => unknown },
  user: unknown,
): unknown => access.read({ req: { user } } as never);

describe("who may read a Match", () => {
  it("shows a signed-out reader published matches only", () => {
    expect(asked(publiclyReadableWhenPublished, undefined)).toEqual({
      _status: { equals: "published" },
    });
  });

  it("shows a signed-in editor everything, drafts included", () => {
    // Otherwise the draft queue would be a queue nobody could open.
    expect(asked(publiclyReadableWhenPublished, { id: 1 })).toBe(true);
  });

  it("leaves the collections without drafts wide open", () => {
    // The record is the public site. Only Matches has anything to hold back.
    expect(asked(publiclyReadable, undefined)).toBe(true);
  });

  it("still lets only the committee write", () => {
    expect(publiclyReadableWhenPublished.create({ req: { user: undefined } } as never)).toBe(false);
    expect(publiclyReadableWhenPublished.update({ req: { user: { id: 1 } } } as never)).toBe(true);
  });
});
