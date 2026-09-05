// What an import can offer to register, and what it must ask about instead.
//
// A Registration is a Player's binding to one Team for one Season (CONTEXT.md),
// and it is the record that makes the eligibility rule enforceable *before*
// somebody takes the field. It cannot be replaced by reading scorecards, and
// this module is not an attempt to: a scorecard says who played, after the
// fact, and says nothing at all about a squad member who neither batted nor
// bowled.
//
// What it can do is stop the typing. Everybody in the export played for the
// side that day, so proposing them is a good guess made out loud, with a person
// clicking once. Three things are deliberately *not* automatic:
//
//   1. A Registration the exclusivity rule refuses is never proposed. It is a
//      real decision about a real player — the club may have meant it, and the
//      answer is not this screen's to give (lib/eligibility).
//   2. Nothing is registered without a click. The proposal is the work; the
//      consent is the point.
//   3. Nothing here writes a Playing role. The suggestion comes from
//      lib/suggestedRole and is offered next to the name, never applied.
//
// Kept away from Payload so the rule can be tested as a rule, the way
// lib/eligibility is. The caller supplies the counts; this decides what they
// mean.

import { registrationProblem, type TeamRole } from "./eligibility";

/**
 * One Player who appeared for our side in this match, and everything the
 * decision needs to know about them.
 *
 * `registeredElsewhere` is their *other* registrations in this same Season —
 * the caller does the Season filtering, because it is the caller that can
 * query.
 */
export type Appeared = {
  playerId: number | string;
  name: string;
  /** Already registered to *this* Team for this Season. */
  registeredHere: boolean;
  /** Team roles this Player is registered to in this Season, excluding ours. */
  registeredElsewhere: readonly TeamRole[];
  /** Positive keeping evidence this Season — a stumping, or a catch taken
   *  standing up (CONTEXT.md — Caught behind). Never inferred from its own
   *  absence. */
  kept: boolean;
  /** Whether they have bowled at all this Season. */
  bowled: boolean;
};

export type Blocked = {
  player: Appeared;
  /** The club's own words for why, from lib/eligibility. */
  problem: string;
};

export type Proposal = {
  /** Safe to offer, and the whole point of the screen. */
  register: Appeared[];
  /** The eligibility rule refuses these. A question, never a write. */
  blocked: Blocked[];
  /** Nothing to do — already bound to this Team for this Season. */
  already: Appeared[];
  /**
   * Whom to offer when the Season's scorecards name no keeper.
   *
   * Empty when somebody has kept — the record has answered, and asking would be
   * noise — and empty when everybody has bowled, because then there is nobody
   * left to sensibly offer and a guess is worse than the question going
   * unasked. A keeper who has taken neither a stumping nor a catch behind is
   * invisible in an export, which is a gap in the evidence rather than a gap in
   * the squad.
   */
  keeperCandidates: Appeared[];
};

/**
 * What this import can offer to register for one Team and one Season.
 *
 * `sideRole` is what the side is *for* (lib/eligibility's TeamRole), not what
 * it is called: the exclusivity rule is about the league and challenge league
 * sides specifically, and resting it on a name would let a rename switch it
 * off.
 */
export function proposeRegistrations(
  appeared: readonly Appeared[],
  sideRole: TeamRole,
): Proposal {
  const register: Appeared[] = [];
  const blocked: Blocked[] = [];
  const already: Appeared[] = [];

  for (const player of appeared) {
    if (player.registeredHere) {
      already.push(player);
      continue;
    }

    const problem = registrationProblem(sideRole, player.registeredElsewhere);
    if (problem) blocked.push({ player, problem });
    else register.push(player);
  }

  return {
    register,
    blocked,
    already,
    keeperCandidates: keeperCandidates(appeared),
  };
}

/** Nobody kept, so far as the record can see — offer the ones who never bowled.
 *
 *  A bowler is not the keeper, and that is the one thing a scorecard says
 *  plainly enough to narrow the list with. Everybody having bowled leaves
 *  nobody to offer, which is an honest empty rather than a shrug: the club
 *  fields keepers, so the answer is that this Season's exports do not show one
 *  yet. */
function keeperCandidates(appeared: readonly Appeared[]): Appeared[] {
  if (appeared.some((player) => player.kept)) return [];
  return appeared.filter((player) => !player.bowled);
}

/** Whether this proposal has anything at all for a person to do. A screen with
 *  nothing to offer should say so once, not render an empty form. */
export function needsAttention(proposal: Proposal): boolean {
  return (
    proposal.register.length > 0 ||
    proposal.blocked.length > 0 ||
    proposal.keeperCandidates.length > 0
  );
}
