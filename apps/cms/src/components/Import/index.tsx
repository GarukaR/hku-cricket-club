import { DefaultTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps } from "payload";

import { ImportPreview } from "./ImportPreview";

// Both halves of the screen are named from here, so the config points at one
// module rather than two paths into the same folder.
export { ImportLink } from "./ImportLink";

/**
 * The import screen — a scorecard export, read and shown before anything is
 * saved.
 *
 * A screen of its own rather than a tab on a Match, because an import has no
 * Match yet: the file is the first the record hears of the game. The Scorecard
 * tab is the other half of the same job, for the matches nobody exports —
 * the sunday social side is scored nowhere at all.
 *
 * This half runs on the server and fetches one thing: which CricClubs entries
 * the club's four sides have claimed. Nothing in an export says which of our
 * sides an entry belongs to, so that mapping is the only thing that can place a
 * match, and it is worth saying on screen when it is missing rather than at the
 * point somebody presses save.
 *
 * The reading itself happens in the browser. A preview of a file that has
 * already been uploaded is not a preview of anything.
 */
export async function ImportView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const { locale, permissions, req, visibleEntities } = initPageResult;

  const teams = await req.payload.find({
    collection: "teams",
    depth: 0,
    pagination: false,
    req,
    sort: "name",
  });

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <ImportPreview
        sides={teams.docs.map((team) => ({
          name: team.name,
          cricclubsNames: team.cricclubsNames ?? [],
        }))}
      />
    </DefaultTemplate>
  );
}

export default ImportView;
