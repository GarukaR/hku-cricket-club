import type { Access, CollectionConfig } from "payload";

/**
 * Signed in — the club's only distinction that matters here.
 *
 * There are no roles and no per-collection permissions, because there is no
 * question they would answer: everyone with an account is a committee member
 * editing the same record. A collection states this rule once and then names
 * only where it departs from it, which for now is Media's public `read`.
 */
export const signedIn: Access = ({ req: { user } }) => Boolean(user);

/**
 * The club's record: everyone may read it, only the committee may write it.
 *
 * Read is open because the record *is* the public site. The site is statically
 * generated and fetches these collections while it builds, and there is nothing
 * here that is not printed on a page the moment it is saved — a login in front
 * of it would protect nothing and would have to be handed to the build.
 */
export const publiclyReadable = {
  read: () => true,
  create: signedIn,
  update: signedIn,
  delete: signedIn,
} satisfies CollectionConfig["access"];

/**
 * The same, but a held draft is nobody's business until it is published.
 *
 * For the one collection that has drafts. **Payload does not do this on its
 * own** — a draft lives in the main table beside the published records, and an
 * anonymous `find` returns it like any other row unless something filters it.
 * That was checked rather than assumed, because assuming it would have put
 * matches the club has not verified in front of the league.
 *
 * The filter belongs here rather than in the site's queries: `read` is asked on
 * every route into the record — REST, GraphQL, the local API — so a query that
 * forgot could not leak, and there is nothing for a future query to remember.
 * A signed-in editor sees everything, which is the point of a draft queue.
 */
export const publiclyReadableWhenPublished = {
  ...publiclyReadable,
  read: ({ req: { user } }) =>
    user ? true : { _status: { equals: "published" } },
} satisfies CollectionConfig["access"];

/**
 * The reverse of the record: anyone may write, only the committee may read.
 *
 * For the one collection a stranger creates rather than the club — an
 * Enquiry. The public site has no login and never will (docs/PLAN.md: a
 * committee that will not administer a website will not administer accounts
 * for its prospective members either), so `create` has to be open the same way
 * `publiclyReadable`'s `read` is. What somebody has written about themselves is
 * not the public record, though, so `read` is `signedIn` rather than `true`.
 */
export const submittableByAnyone = {
  read: signedIn,
  create: () => true,
  update: signedIn,
  delete: signedIn,
} satisfies CollectionConfig["access"];
