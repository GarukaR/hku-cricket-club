// The one thing every mapping from Payload to a view type needs: the name off
// a populated relationship, shared by ./record (Match) and ./squad
// (Registration).

/** A populated relationship, or just its id.
 *
 *  Payload returns the id alone beyond the requested depth. Every query here
 *  asks for enough depth to populate these, so an id arriving means the query
 *  changed — the name is dropped rather than printed as a number. */
export function named(relation: unknown): string | undefined {
  if (typeof relation !== "object" || relation === null) return undefined;
  const name = (relation as { name?: unknown }).name;
  return typeof name === "string" && name !== "" ? name : undefined;
}
