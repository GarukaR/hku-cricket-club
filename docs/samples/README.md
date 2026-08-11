# Scorecard export samples

Real CricClubs exports, downloaded from the scorecard page's own export button.
They are the importer's regression suite: every parsing rule in
[../PLAN.md](../PLAN.md) was derived from these three files, so a change that
breaks one of them is a change that breaks a real match.

The data is already public on CricClubs. Player names are left intact because
the importer's hardest problem is name resolution, and anonymising them would
destroy the only evidence of it.

| File | Competition | What it is for |
|---|---|---|
| `saturday-2026-03-21-v-irc-charlie-bears.csv` | Saturday Championship Div 2 | The baseline. Eleven batters listed, a completed all-out innings, clean reconciliation both ways. |
| `saturday-2026-01-03-v-scc-lancers.csv` | Saturday Championship Div 2 | Run-outs and `ctw`. Proves wickets fallen exceeds the bowlers' wickets, and that the bowler named on a run-out may not have bowled at all. |
| `ucl-2025-03-18-v-combined-unis.csv` | University Cricket League | A different competition and scorer. Proves the format generalises — and it is the one that does **not** reconcile. |

## What each file proves

**Reconciliation holds — until it doesn't.** Batting runs plus extras equal the
stated total in five of the six innings here. In the sixth, HKU Students' batters
sum to 114 against a stated 115, and **115 is correct**: the winning margin
(194 − 115 = 79) and the opposition's bowling figures (113 = 115 − 2 leg byes)
both confirm it. This single innings is why the total is stored rather than
summed, and why a mismatch warns instead of blocking.

**Bowlers' runs equal the total minus byes and leg byes.** Never the total
itself. `saturday-2026-01-03` has byes of 5, which is what makes the rule
visible rather than a coincidence of zeroes.

**Run-outs are credited to no bowler.** In `saturday-2026-01-03`, SCC lost 7
wickets while HKU's bowlers took 5. The gap is exactly the two run-outs. A check
asserting those are equal rejects a valid match.

**The roster is not reliably eleven.** The Saturday files list 11 batters; the
UCL file lists 9 and 8. A squad member who neither batted nor bowled can be
absent entirely, so matches played is a floor.

**Names vary within a single file.** `Jaya Ramesh Chaliki` in the bowling table,
`Jaya Ramesh C` in a dismissal, `Ashutosh` in the fall of wickets. Fall-of-wicket
names truncate to 8 characters and collide — `Mohammad` matches two different
players across one file — so only the batting table's full names can resolve a
Player.

**The header format varies.** `Saturday Championship - Div 2 - 2025-26:` in two
files, a bare `University Cricket League:` in the third. Division and season
cannot be required, and the season must be derived from the match date — note
that the UCL file is 2024/25, not 2025/26. In all three, the word `League` is
glued to the result with no separator.

**Overs are balls notation.** `28.3` is 171 deliveries. `Dot Balls` is zero
throughout the UCL file, so treat it as optional.

## Still wanted

An export containing **retired**, **hit wicket** or **caught and bowled**, so
those dismissal codes are known rather than guessed, and one from the
**challenge league** if that side turns out to be scored anywhere.
