// Which CricClubs entity belongs to which of our Teams.
//
// The club fields several entries under different names — HKU CC, HKU Belchers
// CC, HKU Students (UCL) — and nothing in an export says which of our four sides
// an entry is (CONTEXT.md). The mapping only exists because somebody records it
// here, so the only thing that can make it useless is two Teams claiming the
// same entity: the importer would then file a season of matches against
// whichever side it happened to read first, silently and plausibly.

/** One Team's claim, as it is already recorded. */
export type EntityClaim = {
  /** How the Team is named to an editor reading the complaint. */
  team: string;
  names: string[];
};

/**
 * The name with everything a scorer varies freely taken out of it: case, run-on
 * spaces, and the brackets that turn "HKU Students (UCL)" into "HKU Students
 * UCL" — a pair CONTEXT.md itself writes both ways.
 */
function canonical(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Whether two spellings name the same CricClubs entity. */
export function sameEntity(one: string, other: string): boolean {
  return canonical(one) === canonical(other);
}

/**
 * What is wrong with the entity names a Team is claiming, if anything.
 *
 * Undefined for a Team that maps to nothing: the sunday social side's matches
 * are scored nowhere, and that absence is the record being honest rather than a
 * field somebody has yet to fill in.
 */
export function entityNameProblem(
  names: string[] | undefined,
  otherTeams: EntityClaim[],
): string | undefined {
  const claiming = (names ?? []).map((name) => name.trim()).filter(Boolean);

  const seen = new Set<string>();
  for (const name of claiming) {
    const key = canonical(name);

    if (seen.has(key)) {
      return `${name} is listed twice. One entity, one row.`;
    }
    seen.add(key);

    const holder = otherTeams.find((other) =>
      other.names.some((held) => sameEntity(held, name)),
    );
    if (holder) {
      return `${name} is already recorded against the ${holder.team} side. Nothing in a CricClubs export says which of our sides an entry belongs to, so two sides cannot claim one.`;
    }
  }

  return undefined;
}
