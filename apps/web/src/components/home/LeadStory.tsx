import type { Match, ScoredMatch } from "@/lib/match";
import { LatestResult } from "./LatestResult";
import { NextMatch } from "./NextMatch";
import styles from "./LeadStory.module.css";

/** What the club did, and what it does next — the two facts a visitor came for,
 *  in the order a printed record would set them.
 *
 *  "Lead story", not "lede": the lede is the club's opening statement, and it now
 *  sits in the letterhead precisely so that this is the first thing under the
 *  double rule. */
export function LeadStory({ latest, next }: { latest: ScoredMatch; next: Match }) {
  return (
    <div className={styles.lead}>
      <LatestResult match={latest} />
      <NextMatch match={next} />
    </div>
  );
}
