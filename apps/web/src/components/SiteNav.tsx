import Link from "next/link";

import { navItems } from "@/content/club";
import styles from "./SiteNav.module.css";

/** The contents line, directly under the letterhead.
 *
 *  Items whose page does not exist yet render as plain text rather than as links
 *  that 404 or as links that go nowhere. They are marked `aria-disabled` and kept
 *  out of the tab order, so a keyboard user is never taken to a dead stop. */
export function SiteNav() {
  return (
    <nav className={styles.nav} aria-label="Sections">
      <ul className={styles.list}>
        {navItems.map(({ label, href }) => (
          <li key={label}>
            {href === "#" ? (
              <span className={`${styles.link} ${styles.pending}`} aria-disabled="true">
                {label}
              </span>
            ) : (
              <Link className={styles.link} href={href}>
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
