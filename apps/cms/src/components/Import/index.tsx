import { DefaultTemplate } from "@payloadcms/next/templates";
import { redirect } from "next/navigation";
import type { AdminViewServerProps } from "payload";

import { adminPath, loginUrl, queryString } from "@/lib/login";

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

  // Payload guards its own screens and not this one — see lib/login for why a
  // custom root view arrives unauthenticated, and why redirecting is the cure
  // rather than a workaround. Without this the screen renders for anybody who
  // knows the address, and renders signed-out for an editor who is signed in.
  //
  // The question is `canAccessAdmin` rather than "is anybody signed in", because
  // they are not the same question and Payload asks this one on every screen it
  // guards itself. Everyone with an account here is a committee member today, so
  // the two agree — but that is a fact about the club's access rules, and a
  // screen should not quietly depend on one staying true.
  if (!permissions?.canAccessAdmin) {
    const adminRoute = req.payload.config.routes.admin;
    const segments = Array.isArray(params?.segments) ? params.segments : [];
    const here = adminPath(adminRoute, segments) + queryString(searchParams);

    redirect(loginUrl(adminRoute, here));
  }

  // Two lists, both small and both read here rather than in the browser: the
  // screen has to be able to say what it knows before a file is chosen, and a
  // fetch on mount would leave it briefly claiming to know nothing.
  const [teams, players] = await Promise.all([
    req.payload.find({
      collection: "teams",
      depth: 0,
      pagination: false,
      req,
      sort: "name",
    }),
    req.payload.find({
      collection: "players",
      depth: 0,
      pagination: false,
      req,
      sort: "name",
    }),
  ]);

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
          id: team.id,
          name: team.name,
          cricclubsNames: team.cricclubsNames ?? [],
          // What the side is *for*, which is what the eligibility rule turns
          // on when the screen offers to register the players who appeared.
          role: team.role,
        }))}
        players={players.docs.map((player) => ({
          id: player.id,
          name: player.name,
          aliases: player.aliases ?? [],
        }))}
        // Answering a name writes through Payload's own REST API rather than a
        // route of ours, so that the collection's validation is on the path —
        // including the rule that no two Players may claim one spelling. The
        // route is read from the config rather than written out, because a
        // config that moved it would otherwise break this screen silently.
        api={req.payload.config.routes.api}
        // Only so a saved match can be linked to. Read from the config for the
        // same reason as the API route: a panel mounted somewhere else should
        // move this link with it rather than break it.
        adminRoute={req.payload.config.routes.admin}
      />
    </DefaultTemplate>
  );
}

export default ImportView;
