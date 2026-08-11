import Link from "next/link";

import { navItems } from "@/content/club";
import { isBuilt } from "@/lib/nav";
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
        {navItems.map((item) => (
          <li key={item.label}>
            {isBuilt(item) ? (
              <Link className={styles.link} href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className={`${styles.link} ${styles.pending}`} aria-disabled="true">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
