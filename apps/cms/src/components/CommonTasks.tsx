import Link from "next/link";
import type { ServerProps } from "payload";

import { panel, quiet } from "./Import/styles";

/**
 * What the panel is for, on the one screen every editor sees on signing in.
 *
 * A student committee turns over every year and will not read a manual
 * (docs/PLAN.md, *Handover*), so this is the manual: five things a newcomer is
 * likely to be here to do, importing a match first because it is the one that
 * happens almost every week. Each line names where to go rather than
 * explaining the screen itself — the screens explain themselves once an editor
 * is on them (see SaveImport, ResolveNames, the Scorecard tab, and every
 * collection's own field help text).
 *
 * Static rather than data-driven, unlike DraftQueue: this is orientation for
 * somebody who has never seen the panel, not a queue of things outstanding
 * right now. The two sit side by side on purpose — a newcomer with nothing
 * held sees only this; a returning editor with something held sees both.
 */
export function CommonTasks({ payload }: Partial<ServerProps>) {
  const admin = payload?.config?.routes?.admin ?? "/admin";

  return (
    <div style={{ ...panel, marginLeft: 32, marginRight: 32, marginBottom: 16 }}>
      <strong>Common tasks</strong>
      <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
        <li style={{ marginTop: 6 }}>
          <strong>Import a match.</strong> Open the match on CricClubs, press
          its own export button, and use{" "}
          <Link href={`${admin}/import`}>Import a scorecard</Link> in the
          sidebar. A clean export publishes itself; one with a question
          against it stops and says what the question is.
        </li>
        <li style={{ marginTop: 6 }}>
          <strong>Score a match by hand.</strong> The sunday social side is
          scored nowhere at all, so for its matches — or to fix a mistake in
          one already saved — open the Match itself and use its{" "}
          <em>Scorecard</em> tab.
        </li>
        <li style={{ marginTop: 6 }}>
          <strong>Follow up an enquiry.</strong> Somebody who wants to play
          shows up in{" "}
          <Link href={`${admin}/collections/enquiries`}>Enquiries</Link>,
          newest first. Mark it Actioned once you have.
        </li>
        <li style={{ marginTop: 6 }}>
          <strong>Start a new season.</strong> Add the year to{" "}
          <Link href={`${admin}/collections/seasons`}>Seasons</Link> in
          September, before the first match of it is entered.
        </li>
        <li style={{ marginTop: 6 }}>
          <strong>Add a photograph.</strong> Upload it to{" "}
          <Link href={`${admin}/collections/media`}>Media</Link> with what it
          shows, not the filename.
        </li>
      </ol>
      <p style={{ ...quiet, marginTop: 12, marginBottom: 0, fontSize: 12 }}>
        A short written guide is at <code>docs/editor-guide.md</code> in the
        club&apos;s repository, with a short recording alongside it — neither
        is the primary way to learn this panel, and you should not need
        either.
      </p>
    </div>
  );
}

export default CommonTasks;
