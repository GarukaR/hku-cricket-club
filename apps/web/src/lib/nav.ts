// The contents line, as a type rather than as a list of strings — the same split
// CONTEXT.md's vocabulary gets in lib/match.ts, with the club's actual items in
// content/club.ts beside its other standing facts.

export type NavItem = { label: string; href: string };

/** An item whose page is not built yet. Public pages are build order step 4
 *  (docs/PLAN.md); until then the label is set, and set as plain text, rather
 *  than linked to a route that would 404. */
export const PENDING = "#";

/** Whether the item leads anywhere yet. The nav sets the rest as plain text. */
export function isBuilt(item: NavItem): boolean {
  return item.href !== PENDING;
}

/** The items a visitor can actually be sent to.
 *
 *  The 404 page needs exactly this and so does anything else offering a way
 *  back: a list of somewhere-to-go must never quietly include a nowhere. */
export function builtSections(items: NavItem[]): NavItem[] {
  return items.filter(isBuilt);
}
