// Whether an Enquiry looks like a bot's, not a person's.
//
// No account and no paid service (issue #16) rules out reCAPTCHA and
// Turnstile, so the defence is the two classic ones a form can run on its own:
// a honeypot field a person never sees and therefore never fills, and a clock
// a script rarely bothers to respect. Neither proves a human; together they
// stop the submissions that cost nothing to send, which is what a public form
// with no login in front of it actually gets.

/** Below this, a submission is treated as scripted rather than typed. A person
 *  reading three short fields and writing a sentence does not clear them in
 *  two seconds; a script that posts the instant the page loads does. */
export const MIN_ELAPSED_MS = 2_000;

export type SpamSignal = {
  /** The honeypot field's value. Empty for a person, because it is hidden from
   *  them; a script filling every field in a form fills this one too. */
  honeypot: string;
  /** Milliseconds between the form rendering and the submission arriving.
   *  `undefined` when the timing field itself is missing — which never happens
   *  through the site's own form, so its absence is itself a signal. */
  elapsedMs: number | undefined;
};

/** Why a submission is rejected, or `undefined` if it is not. A reason rather
 *  than a boolean, because the collection hook that calls this needs something
 *  to put in the error it raises. */
export function spamReason(signal: SpamSignal): string | undefined {
  if (signal.honeypot.trim() !== "") {
    return "a hidden field was filled in";
  }

  if (signal.elapsedMs === undefined) {
    return "no timing signal was sent";
  }

  if (signal.elapsedMs < 0) {
    return "the timing signal is from the future";
  }

  if (signal.elapsedMs < MIN_ELAPSED_MS) {
    return `submitted ${signal.elapsedMs}ms after the form rendered, too fast for a person`;
  }

  return undefined;
}
