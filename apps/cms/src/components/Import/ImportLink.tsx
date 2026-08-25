import Link from "next/link";
import type { ServerProps } from "payload";

/**
 * The import screen's place in the nav.
 *
 * Payload lists collections, and importing is not one — so without this the
 * screen exists at a URL nobody would ever type. Guidance for this club lives
 * inside the CMS rather than in a document beside it (docs/PLAN.md), and a
 * feature you have to be told the address of is a feature nobody uses.
 */
export function ImportLink({ payload }: Partial<ServerProps>) {
  const admin = payload?.config?.routes?.admin ?? "/admin";

  return (
    <Link className="nav__link" href={`${admin}/import`} id="nav-import" prefetch={false}>
      <span className="nav__link-label">Import a scorecard</span>
    </Link>
  );
}

export default ImportLink;
