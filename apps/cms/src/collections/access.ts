import type { Access } from "payload";

/**
 * Signed in — the club's only distinction that matters here.
 *
 * There are no roles and no per-collection permissions, because there is no
 * question they would answer: everyone with an account is a committee member
 * editing the same record. A collection states this rule once and then names
 * only where it departs from it, which for now is Media's public `read`.
 */
export const signedIn: Access = ({ req: { user } }) => Boolean(user);
