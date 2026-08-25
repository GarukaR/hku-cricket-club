import type { Match, PlayedMatch } from "@/lib/match";
import { LatestResult } from "./LatestResult";
import { NextMatch } from "./NextMatch";
import styles from "./LeadStory.module.css";

/** What the club did, and what it does next — the two facts a visitor came for,
 *  in the order a printed record would set them.
 *
 *  "Lead story", not "lede": the lede is the club's opening statement, and it now
 *  sits in the letterhead precisely so that this is the first thing under the
 *  double rule.
 *
 *  Either half can be missing and the page still has to read as a page. Between
 *  seasons there is no next fixture; before the club's first entered result
 *  there is no last one. Each absence collapses the lead to a single column
 *  rather than leaving a hole where the other half was. */
export function LeadStory({
  latest,
  next,
}: {
  latest?: PlayedMatch;
  next?: Match;
}) {
  if (!latest && !next) return null;

  const alone = !latest || !next;

  return (
    <div className={alone ? `${styles.lead} ${styles.alone}` : styles.lead}>
      {latest && <LatestResult match={latest} />}
      {next && <NextMatch match={next} />}
    </div>
  );
}
