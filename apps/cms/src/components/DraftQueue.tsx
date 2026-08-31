import Link from "next/link";
import type { ServerProps } from "payload";

import { panel, quiet } from "./Import/styles";

/**
 * Held matches, on the one screen every editor sees on signing in.
 *
 * A held match is a real record with a real question against it (lib/saving),
 * and a held match nobody notices is worse than one that never imported — the
 * club believes the record is up to date and it is not (#45). Payload's own
 * list gives a filter on `_status`, but a filter is something somebody has to
 * think to reach for; this is the dashboard, which nobody has to be told to
 * visit.
 *
 * Reads `heldReasons` rather than only the count, because the acceptance bar
 * here is not "a draft exists" — the panel that already told the editor that,
 * at import time — but "opening it says what it's waiting on" even after that
 * screen is long closed.
 */
export async function DraftQueue({ payload }: Partial<ServerProps>) {
  if (!payload) return null;

  const admin = payload.config?.routes?.admin ?? "/admin";

  // No `req` reaches this component (see ImportLink, the same shape), so
  // there is no signed-in user for access control to check against. That is
  // fine here and only here: this widget renders on the dashboard, which
  // Payload does not serve to anyone who is not already signed in.
  const held = await payload.find({
    collection: "matches",
    depth: 0,
    draft: true,
    limit: 50,
    overrideAccess: true,
    sort: "-date",
    where: { _status: { equals: "draft" } },
  });

  if (held.totalDocs === 0) return null;

  return (
    <div style={{ ...panel, marginLeft: 32, marginRight: 32 }}>
      <strong>
        {held.totalDocs} held {held.totalDocs === 1 ? "match" : "matches"} —
        not on the live site until published
      </strong>
      <ul style={{ marginBottom: 0 }}>
        {held.docs.map((match) => (
          <li key={match.id} style={{ marginTop: 6 }}>
            <Link href={`${admin}/collections/matches/${match.id}`}>
              {match.summary ?? `${match.opponent}`}
            </Link>
            {Array.isArray(match.heldReasons) && match.heldReasons.length > 0 && (
              <span style={quiet}>
                {" "}
                — {match.heldReasons.length}{" "}
                {match.heldReasons.length === 1 ? "thing" : "things"} to settle
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DraftQueue;
