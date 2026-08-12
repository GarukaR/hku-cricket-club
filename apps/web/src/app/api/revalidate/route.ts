// The one door the CMS may knock on.
//
// Everywhere else the arrow points from the site to the CMS, at build time. This
// is the return path, and it carries no data: Payload says only "the record
// changed", and the site drops the cached pages derived from it and re-reads
// them itself. That is deliberate — a webhook that carried the new Match would
// be a second, unvalidated way into the record.
//
// It is what makes publishing feel immediate without a redeploy, and it is also
// why the CMS being down is harmless: no webhook fires, nothing is invalidated,
// and the site keeps serving the record as it last stood.

import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

import { RECORD } from "@/lib/matches";

/** Constant-time, and safe to call with a wrong-length or absent value.
 *
 *  `timingSafeEqual` throws unless both buffers are the same length, and the
 *  length of what was sent is itself a thing not worth leaking. */
function matches(offered: string | null, expected: string): boolean {
  if (!offered) return false;

  const a = Buffer.from(offered);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;

  // No secret configured means no authenticated caller is possible, so the
  // endpoint refuses rather than defaulting open. A deployment that has not
  // been given one simply never invalidates, which is visibly stale rather
  // than quietly writable by anybody who finds the URL.
  if (!secret) {
    return Response.json(
      { revalidated: false, reason: "REVALIDATE_SECRET is not set" },
      { status: 503 },
    );
  }

  const offered = request.headers.get("authorization")?.replace(/^Bearer /, "");

  if (!matches(offered ?? null, secret)) {
    return Response.json({ revalidated: false }, { status: 401 });
  }

  // `expire: 0` rather than a profile: the point of a publish notice is that the
  // editor sees their change, and a window in which the old copy may still be
  // served is exactly what this exists to remove.
  revalidateTag(RECORD, { expire: 0 });

  return Response.json({ revalidated: true, tag: RECORD });
}
