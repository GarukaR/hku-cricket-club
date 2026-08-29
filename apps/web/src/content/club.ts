// The club's standing facts — the things that are true whatever the season did.
//
// These are real. Only the training time is provisional, pending the club
// (docs/PLAN.md, "Still needed from the club").

import { PENDING, type NavItem } from "@/lib/nav";

/** The masthead nav.
 *
 *  Items whose page has not been built yet are PENDING rather than a route that
 *  would 404 — the public pages are build order step 4. The three that resolve
 *  today are sections of the homepage, and they are addressed from the root:
 *  this nav is also set on the 404, which is reached from any address at all,
 *  and a bare "#the-club" there would scroll nowhere. */
export const navItems: NavItem[] = [
  { label: "The Club", href: "/#the-club" },
  { label: "Fixtures", href: PENDING },
  { label: "Records", href: "/#recent-record" },
  { label: "Members", href: "/teams" },
  { label: "Archive", href: PENDING },
  { label: "Admission", href: "/#admission" },
];

export const standingFacts: { term: string; detail: string }[] = [
  { term: "Founded", detail: "1913" },
  { term: "Ground", detail: "Sandy Bay, Pok Fu Lam" },
  {
    term: "Competitions",
    detail: "Saturday Championship · University Cricket League",
  },
  { term: "Season", detail: "September – May" },
  { term: "Training", detail: "Wednesdays, 18:30" },
];

/** PLACEHOLDER — captions for plates the club has not sent yet. The frames are
 *  drawn from the crest hues so the page is honest about what is missing rather
 *  than filling the space with stock photography. */
export const plates: string[] = [
  "First XI, Sandy Bay",
  "v PolyU, April",
  "Nets, Wednesday",
];
