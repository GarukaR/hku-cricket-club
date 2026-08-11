/**
 * Next runs this once as the server starts, and not during the build. It is the
 * first moment at which the real environment exists, so it is where the
 * environment is checked.
 *
 * Checking here rather than at first use is the whole point: a container missing
 * an R2 key would otherwise start, serve the admin panel, and look entirely
 * healthy right up until somebody tried to upload a photograph.
 *
 * Throwing from `register` makes Next refuse to prepare the server: the reason
 * is the first thing in the log, and every route afterwards — `/health`
 * included — answers 500. Render gates a deploy on `/health`, so a container
 * with a hole in its environment fails on the deploy that caused it rather than
 * quietly replacing a working one.
 */
export async function register() {
  // The edge runtime gets its own pass through this file and has neither the
  // secrets nor any use for them.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { readEnv } = await import("./lib/env");

  readEnv(process.env);
}
