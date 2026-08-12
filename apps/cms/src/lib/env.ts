// Everything the CMS needs from outside itself, read in one place.
//
// The container is stateless by design (docs/PLAN.md): Neon holds the data, R2
// holds the media, and nothing durable is written to the box. That invariant is
// only as good as the configuration behind it, and every way it breaks is quiet.
// A missing R2 key does not fail until somebody uploads a photograph. A short
// PAYLOAD_SECRET never fails at all. So nothing here is defaulted — there is no
// local-filesystem fallback to quietly fall back to — and a container with a
// hole in its environment refuses to start, which on Render is a failed health
// check on the deploy that caused it rather than a surprise weeks later.

/**
 * Payload derives its encryption key from `PAYLOAD_SECRET`. 32 bytes as hex is
 * what `openssl rand -hex 32` gives and what Payload's own docs use.
 */
export const MINIMUM_SECRET_LENGTH = 64;

export type CmsEnv = {
  /** Neon connection string. */
  databaseUrl: string;
  payloadSecret: string;
  /** Where the admin panel is reachable, without a trailing slash. */
  serverUrl: string;
  media: {
    bucket: string;
    /** The S3 API origin, e.g. `https://<account>.r2.cloudflarestorage.com`. */
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    /**
     * The origin media is *read* from, without a trailing slash. A different
     * host from `endpoint`, which is only where it is written — see
     * "Reading the site never wakes the CMS" in docs/cms.md for why.
     */
    publicUrl: string;
  };
  /**
   * Where to announce a publish, if anywhere.
   *
   * Optional, and the only optional thing here. A container brought up locally
   * has no deployed site to tell, and the CMS being fully usable without one is
   * the point rather than a gap — the public site is a reader of this record,
   * not a participant in it. Absence means publishing simply does not invalidate
   * anything, which start-up says out loud.
   */
  publish?: {
    /** The site's revalidate endpoint, e.g. `https://…/api/revalidate`. */
    url: string;
    /** Shared with the site as `REVALIDATE_SECRET`. */
    secret: string;
  };
};

export class InvalidEnvironment extends Error {
  constructor(readonly problems: string[]) {
    super(
      [
        `The CMS cannot start — ${problems.length} problem${problems.length === 1 ? "" : "s"} with its environment:`,
        ...problems.map((problem) => `  - ${problem}`),
        "",
        "See .env.example for what each one is, and docs/cms.md for where to get it.",
      ].join("\n"),
    );
    this.name = "InvalidEnvironment";
  }
}

/** Normalise, and collect every complaint rather than stopping at the first. */
function parse(source: Record<string, string | undefined>): {
  env: CmsEnv;
  problems: string[];
} {
  const problems: string[] = [];

  /** Present and non-blank. Yields "" once it has complained. */
  const required = (name: string): string => {
    const value = source[name]?.trim();
    if (!value) {
      problems.push(`${name} is not set`);
      return "";
    }
    return value;
  };

  const requiredUrl = (name: string): string => {
    const value = required(name);
    if (!value) return "";
    if (!URL.canParse(value)) {
      problems.push(`${name} is not a URL (got "${value}")`);
      return "";
    }
    // These get joined to a filename. A trailing slash would produce `//name`,
    // which an object store treats as a different key rather than the same one.
    return value.replace(/\/+$/, "");
  };

  const databaseUrl = required("DATABASE_URL");

  const payloadSecret = required("PAYLOAD_SECRET");
  if (payloadSecret && payloadSecret.length < MINIMUM_SECRET_LENGTH) {
    problems.push(
      `PAYLOAD_SECRET is ${payloadSecret.length} characters; it must be at least ${MINIMUM_SECRET_LENGTH}. Generate one with: openssl rand -hex 32`,
    );
  }

  const serverUrl = requiredUrl("PAYLOAD_PUBLIC_SERVER_URL");

  const media = {
    bucket: required("R2_BUCKET"),
    endpoint: requiredUrl("R2_ENDPOINT"),
    accessKeyId: required("R2_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    publicUrl: requiredUrl("R2_PUBLIC_URL"),
  };

  // Both or neither. A URL with no secret would be rejected by the site on
  // every publish, and a secret with no URL is a webhook that silently never
  // fires — each of which looks like working software until somebody publishes
  // and the site does not change.
  const publishUrl = source.SITE_REVALIDATE_URL?.trim();
  const publishSecret = source.REVALIDATE_SECRET?.trim();
  let publish: CmsEnv["publish"];

  if (publishUrl && publishSecret) {
    if (URL.canParse(publishUrl)) {
      publish = { url: publishUrl, secret: publishSecret };
    } else {
      problems.push(`SITE_REVALIDATE_URL is not a URL (got "${publishUrl}")`);
    }
  } else if (publishUrl || publishSecret) {
    problems.push(
      "SITE_REVALIDATE_URL and REVALIDATE_SECRET go together — set both to announce a publish to the site, or neither to leave it reading the record only when it builds",
    );
  }

  return {
    env: { databaseUrl, payloadSecret, serverUrl, media, publish },
    problems,
  };
}

/**
 * The environment, checked. Every problem is reported at once, because finding
 * them one at a time turns filling in a fresh deployment into a sequence of
 * redeploys, each revealing the next blank.
 *
 * Called from `instrumentation.ts`, which Next runs once as the server starts.
 *
 * @throws {InvalidEnvironment} if anything is absent, blank or malformed.
 */
export function readEnv(source: Record<string, string | undefined>): CmsEnv {
  const { env, problems } = parse(source);
  if (problems.length > 0) throw new InvalidEnvironment(problems);
  return env;
}

/**
 * The same values, with the complaints dropped.
 *
 * `payload.config.ts` has to use this one. The Docker image is built once and
 * run against whatever environment it lands in, so no secret is present at build
 * time — and `next build` imports the config in order to compile the admin
 * panel. Checking there would mean either baking a database URL into the image
 * or shipping a placeholder that the real deployment might silently keep using.
 * The check belongs at start-up, where the real values are, and that is where
 * {@link readEnv} runs.
 */
export function readEnvUnchecked(
  source: Record<string, string | undefined>,
): CmsEnv {
  return parse(source).env;
}
