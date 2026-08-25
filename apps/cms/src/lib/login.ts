// Sending somebody to the login screen, and back again afterwards.
//
// Payload does this for its own screens and not for ours. Every collection view
// runs behind an authentication check that redirects when nobody is signed in;
// a **custom root view** — the import screen is the club's only one — is exempt
// from that check by `isCustomAdminView`, whose own comment says it is meant to
// exempt only views marked public and whose implementation exempts every custom
// view with a path. So an unauthenticated request renders the screen instead of
// the login form, and the screen has to send the editor on itself.
//
// The other half of why this is needed is a rule of Payload's that is working
// exactly as intended. A top-level navigation that arrives `Sec-Fetch-Site:
// cross-site` — a link from another site, a pasted address, a restored tab —
// carries the session cookie, but Payload's CSRF check discards it, because a
// cookie is not evidence of intent when the request came from somewhere else.
// The page therefore renders with no user even for an editor who is signed in.
// Redirecting is the cure rather than a workaround: the login screen is
// same-origin, so the journey back through it authenticates normally, and an
// editor who is already signed in is bounced straight through.
//
// Named for the route rather than the act — Payload's screen is `/login`, and
// one word for one thing beats a tidier verb.

/** The trailing slash a configured admin route may or may not carry. Stripped in
 *  one place because `/admin//login` is a different path that serves nothing. */
const bare = (adminRoute: string): string => adminRoute.replace(/\/+$/, "");

/**
 * The login screen, remembering where the editor was trying to get to.
 *
 * `redirect` is only ever a path on this site. An absolute URL there would be an
 * open redirect — a link wearing the club's own login screen that hands the
 * visitor to somewhere else afterwards — so anything that could leave the site
 * is dropped and they simply arrive at the login form. Payload re-checks this on
 * the way out; a URL this function builds should not depend on it doing so.
 */
export function loginUrl(
  adminRoute: string,
  returnTo: string | undefined,
): string {
  const login = `${bare(adminRoute)}/login`;

  const target = returnTo?.trim() ?? "";
  // One leading slash and no scheme: `//example.com` is a protocol-relative URL
  // and leaves the site just as surely as `https://` does.
  const isLocal = target.startsWith("/") && !target.startsWith("//");
  if (!isLocal) return login;

  return `${login}?redirect=${encodeURIComponent(target)}`;
}

/** Where a screen sits, from the configured admin route and its segments. */
export function adminPath(adminRoute: string, segments: string[]): string {
  return [bare(adminRoute), ...segments].join("/");
}

/**
 * The query a screen was asked for, back in the form it arrived in.
 *
 * Carried through the login screen so that an editor deep-linked somewhere
 * specific returns there rather than to the bare screen — which is what Payload
 * does for its own views. A repeated parameter is a list and stays one; a
 * parameter Next parsed as absent is not the same as one that was empty, so it
 * is left out rather than written as `key=`.
 */
export function queryString(
  params: Record<string, string | string[] | undefined> | undefined,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const one of value) query.append(key, one);
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const written = query.toString();
  return written === "" ? "" : `?${written}`;
}
