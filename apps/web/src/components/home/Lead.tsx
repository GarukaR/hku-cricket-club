import type { Match, ScoredMatch } from "@/lib/match";
import { LatestResult } from "./LatestResult";
import { NextMatch } from "./NextMatch";
import styles from "./Lead.module.css";

/** What the club did, and what it does next — the two facts a visitor came for,
 *  in the order a printed record would set them. */
export function Lead({
  latest,
  next,
}: {
  latest: ScoredMatch;
  next: Match;
}) {
  return (
    <div className={styles.lead}>
      <LatestResult match={latest} />
      <NextMatch match={next} />
    </div>
  );
}
