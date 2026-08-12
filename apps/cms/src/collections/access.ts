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
