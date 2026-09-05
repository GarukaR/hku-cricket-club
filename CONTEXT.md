# HKU Cricket Club

The public website of the Hong Kong University Cricket Club — its record, its
squads, its history, and the way new players find their way in. The site is the
club's front page, not its scoring system: ball-by-ball detail lives with the
league's own scoring platform and is linked to, never re-entered here.

## Language

### Club structure

**Team**:
One of the four sides the club fields: *sunday social*, *league*, *challenge
league*, and *student*. This is the club's own word for them.
_Avoid_: Squad, side, XI

**Competition**:
An external league or cup that a Team is entered into for a Season, run by
Cricket Hong Kong and carrying its own division. Known ones: *Saturday
Championship Div 2* (the league team), *Challenge League Div 3* (the challenge
league team), *University Cricket League* (the student team). A friendly has no
Competition at all, and that absence is meaningful rather than a special value.
_Avoid_: League, tournament

> **Name collision, on purpose.** *Challenge league* is the name of a **Team**;
> the *Challenge League Div 3* is a **Competition**. They are different things
> that share a word because the club talks that way. Never treat one as the
> other.

> **The club's name on CricClubs is not its name here.** One club fields several
> entries under different names — *HKU CC*, *HKU Belchers CC*, *HKU Students
> UCL*. Each maps to one of our four Teams, and the mapping has to be recorded
> because nothing in the data states it.

**Extras**:
Runs conceded to the batting side that belong to no batter — byes, leg byes,
wides, no balls and penalties. They are why a team total can never be derived by
summing the batters, and why byes and leg byes must be subtracted before a
bowler's runs conceded will agree with the total.

**Season**:
A single playing year, spanning two calendar years and written as the club
writes it — `2025/26`. Runs roughly September to May.

### Selection and eligibility

**Registration**:
A Player's binding to one Team for one Season. Registration to the *league* team
and the *challenge league* team is mutually exclusive: a player registered to
one cannot be registered to the other in the same Season.

**Call-up**:
An appearance by a *challenge league*-registered Player for the *league* team.
Capped at **two per Season**, after which that Player is no longer eligible for
the league team that Season. The rule is one-directional — there is no
corresponding route from the league team down.

### The record

**Match**:
One fixture of one Team, played or still to come. A Match that has not been
played simply has no Result yet; a scheduled fixture and a completed game are
the same Match at different points in its life, never two separate records.
_Avoid_: Fixture, game (as separate concepts from Match)

**Unscored Match**:
A Match with a Result but no Appearances, because nobody produced a scorecard
for it. Saturday Championship and University Cricket League games reach
CricClubs; the sunday social side's do not. This is a normal state, not an error
or an unfinished record. Figures derived from Appearances must therefore say
which matches they cover, since a career total that quietly omits a season of
social cricket is wrong rather than incomplete.

**Result**:
The outcome of a played Match — which side won and by what margin, or that it
was drawn, tied, abandoned or conceded.

**Appearance**:
The record that a Player was selected in a Team's XI for a Match. The atomic
fact of the whole record — every career and season figure is derived from
Appearances and never stored. Carries batting detail if the Player batted,
bowling detail if they bowled, and fielding counts always.
_Avoid_: Performance, cap, selection

> A Scorecard lists only the players a scorer entered, which is not reliably the
> whole XI — some list eleven, some list eight. A squad member who neither batted
> nor bowled can therefore be missing from the record entirely. Matches played is
> a floor, not a certainty, and the Call-up count inherits that.

**Did not bat**:
An Appearance carrying no batting detail — the Player was in the XI but the
innings ended before they were needed. Distinct from *did not play*, which is
the absence of an Appearance entirely. The two must never be conflated: only
the second one means the Player was not there.

**Innings**:
Ambiguous in cricket, so pinned here. A **team innings** is one side's turn to
bat, of which a Match has two or four. A **batting innings** is one Player's
turn within it. Career batting figures count *batting innings*, which is a
different number from Matches played.

**Dismissal**:
How a batting innings ended. Scorers record it as a short code — `b`, `lbw`,
`ct`, `ctw` (caught by the wicketkeeper), `st`, `ro` (run out) — and the list is
open, so an
unrecognised code is a question for a human rather than a value to guess at.
The same column also carries `rt`, which is a Retirement and not a dismissal at
all.
Three rules follow from it and none is optional:

- A **run out is credited to no bowler**, so wickets fallen is routinely greater
  than the sum of the bowlers' wickets. Treating those as equal will reject
  perfectly valid matches.
- A dismissal naming the **bowler as the fielder** is caught and bowled — a
  return catch off his own delivery. He is credited with both, and nothing about
  it is ambiguous.
- The bowler named alongside a run out is merely who was bowling at the time.
  They did not take the wicket, and may not appear in the bowling figures at
  all.
- **Not every code in the column is a dismissal.** `rt` is a Retirement, below.

**Retirement**:
A batting innings that ended because the Player walked off — hurt, or by choice
— rather than because they were dismissed. Scorers write it in the same column
as a Dismissal, as `rt`, and it is none of the things a Dismissal is: **no wicket
fell**, no bowler and no fielder is credited, and the innings is Not out, so it
stays out of the divisor when an average is taken. A scorecard showing five
filled cells against four wickets is that difference, not an error.

_Avoid_: reading it as *retired out*, which is a real and different thing —
a dismissal, with a wicket credited to nobody. The club's scorers do not
currently write one; if they start, it is a new code rather than a second
meaning for `rt`.

**Not out**:
A batting innings that ended without the Player being dismissed — either still
there at the end, or a Retirement. Excluded from the divisor when a batting
average is worked out, which is why it is recorded rather than inferred from the
score.

**Player**:
A person who has been registered to at least one Team in at least one Season.
Distinct from a prospective member who has only made an Enquiry.

**Playing role**:
How a Player is normally selected to contribute — batter, bowler, wicketkeeper,
or all-rounder. Recorded on the Player, not derived: unlike a career figure, it
cannot be worked out from Appearances, since a season with few wickets does not
mean a bowler stopped being one. Optional, since most of the record predates
anyone writing it down.

The panel does *suggest* one from a Player's Appearances, and the distinction is
the whole point: the suggestion is a sentence beside the field, never a value in
it, and a role somebody set by hand is never overwritten. The club's bars, after
three Appearances: three overs a match and a batting average of fifteen make an
all-rounder, either alone makes a bowler or a batter, and neither suggests
whichever they are nearer.

**Wicketkeeper is the exception, and the reason is worth keeping.** The three
Appearances exist because an average and an overs-per-match are read off a
*sample* — one game is a scorecard, not a habit. Keeping is not sampled: a
stumping or a catch taken standing up is direct evidence that this person kept
in that match, so it is suggested from the first one, with the number of
Appearances stated so a stand-in who kept once can be told from a regular
keeper. Its *absence* still concludes nothing, because a keeper only appears in
an export when the opposition happens to get out that way.

**Caught behind**:
A catch taken by the wicketkeeper, which a scorer writes `ctw` rather than `ct`.
Counted inside the fielder's catches and again on its own, the way byes sit
inside extras — because it is the only thing a Scorecard says about who kept,
and a keeper's catches are otherwise indistinguishable from an outfielder's. Its
absence across a run of matches means nobody was dismissed that way, never that
nobody kept.
_Avoid_: Role on its own — the codebase's `TeamRole` (which side a Team is,
for the eligibility rule) is a different thing that happens to share the word,
and the two must never be conflated.

**Scorecard**:
The league's own authoritative record of a Match, kept on CricClubs by whoever
scored the game. The club's site links to a Scorecard and imports figures from
its export, but never reproduces the ball-by-ball detail.

**Alias**:
A spelling of a Player's name as a scorer has entered it — "G. Ranasinghe",
"Garuka R", "Ranasinghe G" are three Aliases of one Player. Aliases exist
because scorers type names freely, and resolving them is what stops one person
becoming three entries in the averages.

### Derived figures

**Career figures**:
Everything a Player's profile shows — matches, innings, runs, average, strike
rate, wickets, economy, best figures — computed from their Appearances and
never stored. They roll up across every Team the Player has turned out for,
with a per-Team split alongside.

**Qualification**:
The minimum a Player must have done before appearing in an averages table:
five completed batting innings, or twenty overs bowled. Always printed on the
page next to the table, because an unexplained omission reads as a bug.

**Undefined average**:
A batting average where every innings was Not out, so the divisor is zero. It
renders as `–`. Neither `0` nor a very large number is true, and both would sit
at one end of a sorted table and look deliberate.

> **Leaderboards belong to a Team, not the club.** The league and challenge
> league sides play different standards, and the Registration rule keeps their
> players apart on purpose. Merging their averages would compare things the club
> itself treats as separate.

### Story

**Post**:
Something the club has published on its own social channels — a Facebook or
Instagram post, or a YouTube video — mirrored onto the site so the committee
never publishes twice. A Post carries the club's narrative; a Match carries its
record. A Post about a match may link to that Match's Scorecard.
_Avoid_: Article, news item, update

### Joining

**Enquiry**:
A message from someone who wants to play, sent through the site. The club's
recruitment funnel begins here; an Enquiry is not yet a Player.
_Avoid_: Application, signup, lead
