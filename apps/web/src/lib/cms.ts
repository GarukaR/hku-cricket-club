// Talking to Payload over HTTP — reading the record, and the one write the
// site makes.
//
// Reading is a *build-time* dependency. A visitor never comes through `query`:
// pages are prerendered and cached, so the CMS being asleep — which on
// Render's free tier is its normal state — cannot affect anybody reading the
// site (docs/PLAN.md, "the CMS is off the request path"). What it can affect
// is a deploy, which is what the retry below is for.
//
// `create` is the one exception, and a deliberate one (issue #16): an Enquiry
// has nowhere else to be written, and there is no version of "someone wants to
// join" that can wait for the next deploy. A visitor submitting the form *can*
// wake a sleeping container, the one place in the whole site that is true —
// see the enquiry form's own handling of what that costs in the meantime.
//
// Read access on the record is public (apps/cms/src/collections/access.ts), so
// nothing here carries a credential for `query`. `create` is equally
// credential-free for the same reason `submittableByAnyone` exists: the club
// has no login to hand a stranger before it will hear from them.

/** Long enough to sit through a cold start.
 *
 *  A spun-down Render instance takes roughly fifty seconds to answer its first
 *  request. A conventional ten-second timeout would turn the free tier's normal
 *  resting state into a failed deploy every morning. */
const TIMEOUT_MS = 60_000;

/** One retry, because the first request is the one that does the waking.
 *
 *  A second attempt costs a minute in the worst case and nothing in the common
 *  one, and it is the difference between "Render was asleep" and a red build. */
const ATTEMPTS = 2;

function baseUrl(): string {
  const url = process.env.CMS_URL;

  if (!url) {
    throw new Error(
      "CMS_URL is not set, so the record cannot be read.\n" +
        "Locally: `docker compose up` and set CMS_URL=http://localhost:3001.\n" +
        "See docs/deploy.md.",
    );
  }

  return url.replace(/\/$/, "");
}

/** What Payload's REST API returns from a collection query. */
type Page<T> = { docs: T[] };

/**
 * One collection query against Payload.
 *
 * Failure is loud, always. The tempting alternative — treat an unreachable CMS
 * as an empty record — would ship a site whose season table is simply blank,
 * and a successful deploy of a broken page is far worse than a failed deploy of
 * a working one. If this throws, Vercel keeps the previous deployment serving.
 */
export async function query<T>(
  collection: string,
  params: Record<string, string>,
): Promise<T[]> {
  const url = new URL(`${baseUrl()}/api/${collection}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let last: unknown;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        // The caching is done by `use cache` in ./matches, against tags the
        // publish webhook can name. Letting fetch keep its own copy underneath
        // that would put a second, untagged cache in the path that nothing can
        // invalidate.
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return ((await response.json()) as Page<T>).docs;
    } catch (cause) {
      last = cause;
    }
  }

  throw new Error(
    `Could not read ${collection} from the CMS at ${baseUrl()} after ${ATTEMPTS} attempts.\n` +
      "If Render is asleep this should have woken it; if it is down, the site " +
      "cannot be rebuilt until it is back. The deployment already live is " +
      "unaffected. See docs/deploy.md.",
    { cause: last },
  );
}

/** Payload's own shape for a rejected create — the message a collection's
 *  `beforeValidate` hook throws (see Enquiries' `rejectSpam`) arrives here,
 *  and is deliberately not surfaced to whoever gets this back: a bot told
 *  precisely why it was caught is a bot that adjusts. */
export class CreateRejected extends Error {}

/**
 * One document, written to Payload.
 *
 * The same tolerance for a sleeping container as `query`, because a visitor
 * submitting the form is exactly the request that would otherwise wake it —
 * there is no build in front of this one to sit through the wait instead. A
 * rejected submission (validation, or the spam check) is distinguished from
 * an unreachable CMS: the first is the visitor's to fix, the second is the
 * club's, and the enquiry form treats them differently.
 */
export async function create(
  collection: string,
  data: Record<string, unknown>,
): Promise<void> {
  const url = `${baseUrl()}/api/${collection}`;
  let last: unknown;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.status >= 400 && response.status < 500) {
        const body = await response.json().catch(() => undefined);
        throw new CreateRejected(
          body?.errors?.[0]?.message ?? `${response.status} ${response.statusText}`,
        );
      }

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return;
    } catch (cause) {
      if (cause instanceof CreateRejected) throw cause;
      last = cause;
    }
  }

  throw new Error(
    `Could not write to ${collection} on the CMS at ${baseUrl()} after ${ATTEMPTS} attempts.`,
    { cause: last },
  );
}
