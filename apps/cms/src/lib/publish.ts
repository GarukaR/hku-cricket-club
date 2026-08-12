// Telling the site that the record changed.
//
// The site reads Matches when it builds and then caches what it rendered, so
// without this a published Match would not appear until the next deploy. The
// request carries no data — only "the record changed" — and the site re-reads
// it for itself. A webhook that carried the Match would be a second way into
// the record, unvalidated and able to disagree with the first.
//
// **This can never fail a save.** An editor entering Saturday's result must not
// be stopped because Vercel is unreachable, so every failure here is logged and
// swallowed. The cost of a missed announcement is bounded: the site's cached
// copy expires on its own within a day, and the next deploy re-reads everything.

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { readEnvUnchecked } from "./env";

/** Long enough for a cold serverless function, short enough that a save does
 *  not visibly hang on it. */
const TIMEOUT_MS = 10_000;

async function announce(log: {
  info: (message: string) => void;
  warn: (message: string) => void;
}): Promise<void> {
  const { publish } = readEnvUnchecked(process.env);

  if (!publish) {
    // Normal locally, and worth saying: a container with no site to tell is a
    // working CMS, not a broken one.
    log.info("Record changed. No SITE_REVALIDATE_URL set, so nothing to tell.");
    return;
  }

  try {
    const response = await fetch(publish.url, {
      method: "POST",
      headers: { authorization: `Bearer ${publish.secret}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      log.warn(
        `The site refused the publish notice: ${response.status} ${response.statusText}. ` +
          "The record is saved; the site will show it when its cache next expires or it is rebuilt.",
      );
      return;
    }

    log.info("Record changed, and the site has been told.");
  } catch (cause) {
    log.warn(
      `Could not reach the site to announce the publish: ${cause instanceof Error ? cause.message : String(cause)}. ` +
        "The record is saved regardless.",
    );
  }
}

/**
 * Announce on save.
 *
 * Deliberately not awaited by the response: the editor's save completes as soon
 * as the record is written, and the notice goes out behind it.
 */
export const announceOnChange: CollectionAfterChangeHook = ({ req }) => {
  void announce(req.payload.logger);
};

/** The same, for a deletion — a match removed from the record changes the pages
 *  derived from it exactly as much as one added. */
export const announceOnDelete: CollectionAfterDeleteHook = ({ req }) => {
  void announce(req.payload.logger);
};
