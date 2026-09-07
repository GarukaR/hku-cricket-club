// The club's standing facts — the things that are true whatever the season did.
//
// These are real. Only the training time is provisional, pending the club
// (docs/PLAN.md, "Still needed from the club").

import type { NavItem } from "@/lib/nav";

/** The masthead nav.
 *
 *  Every item is a real route now (#62) — `lib/nav.ts`'s `PENDING` still
 *  exists for the next section that gets a label before it gets a page. The
 *  Club, Fixtures, Members and Archive are their own routes; Records and
 *  Admission are homepage sections, addressed from the root because this nav
 *  is also set on the 404, which is reached from any address at all, and a
 *  bare "#recent-record" there would scroll nowhere. */
export const navItems: NavItem[] = [
  { label: "The Club", href: "/club" },
  { label: "Fixtures", href: "/fixtures" },
  { label: "Records", href: "/#recent-record" },
  { label: "Members", href: "/teams" },
  { label: "Archive", href: "/archive" },
  { label: "Admission", href: "/#admission" },
];

export const standingFacts: { term: string; detail: string }[] = [
  { term: "Founded", detail: "1913" },
  { term: "Based", detail: "Sandy Bay, Pok Fu Lam" },
  {
    term: "Competitions",
    detail: "Saturday Championship · University Cricket League",
  },
  { term: "Season", detail: "September – May" },
  { term: "Training", detail: "Wednesdays, 18:30" },
  { term: "Motto", detail: "In Ludo Sapientia — wisdom in play" },
];

/** Where the club already is, and where most of the people looking for it will
 *  look first. The footer prints these in the order given.
 *
 *  A footer link is wrong on every page of the site at once, so nothing goes in
 *  here that the club has not confirmed itself — and an empty list is a footer
 *  with no channels section rather than a footer with dead links in it. */
export const channels: { name: "Instagram" | "Facebook" | "X"; href: string }[] =
  [];

/** PLACEHOLDER — captions for plates the club has not sent yet. The frames are
 *  drawn from the crest hues so the page is honest about what is missing rather
 *  than filling the space with stock photography. */
export const plates: string[] = [
  "First XI",
  "v PolyU, April",
  "Nets, Wednesday",
];
