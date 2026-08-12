import { describe, expect, it } from "vitest";

import { readEnv, readEnvUnchecked, MINIMUM_SECRET_LENGTH } from "@/lib/env";

/** A complete, valid environment. Each test spoils exactly one thing in it. */
function validEnv(): Record<string, string | undefined> {
  return {
    DATABASE_URL: "postgres://user:pw@ep-x.eu-central-1.aws.neon.tech/hkucc",
    PAYLOAD_SECRET: "a".repeat(MINIMUM_SECRET_LENGTH),
    PAYLOAD_PUBLIC_SERVER_URL: "https://cms.hkucc.example",
    R2_BUCKET: "hkucc-media",
    R2_ENDPOINT: "https://acct.r2.cloudflarestorage.com",
    R2_ACCESS_KEY_ID: "AKIAEXAMPLE",
    R2_SECRET_ACCESS_KEY: "s3cr3t",
    R2_PUBLIC_URL: "https://media.hkucc.example",
  };
}

describe("readEnv", () => {
  it("reads a complete environment", () => {
    const env = readEnv(validEnv());

    expect(env.databaseUrl).toBe(
      "postgres://user:pw@ep-x.eu-central-1.aws.neon.tech/hkucc",
    );
    expect(env.payloadSecret).toBe("a".repeat(MINIMUM_SECRET_LENGTH));
    expect(env.serverUrl).toBe("https://cms.hkucc.example");
    expect(env.media).toEqual({
      bucket: "hkucc-media",
      endpoint: "https://acct.r2.cloudflarestorage.com",
      accessKeyId: "AKIAEXAMPLE",
      secretAccessKey: "s3cr3t",
      publicUrl: "https://media.hkucc.example",
    });
  });

  it("names every missing variable at once, not just the first", () => {
    const env = validEnv();
    delete env.DATABASE_URL;
    delete env.R2_BUCKET;
    delete env.R2_PUBLIC_URL;

    expect(() => readEnv(env)).toThrow(
      /DATABASE_URL[\s\S]*R2_BUCKET[\s\S]*R2_PUBLIC_URL/,
    );
  });

  // Render and docker compose both hand a declared-but-unset variable through as
  // an empty string, so absence is not the only way for a value to be missing.
  it("treats blank and whitespace-only values as missing", () => {
    const env = validEnv();
    env.R2_ACCESS_KEY_ID = "";
    env.R2_SECRET_ACCESS_KEY = "   ";

    expect(() => readEnv(env)).toThrow(
      /R2_ACCESS_KEY_ID[\s\S]*R2_SECRET_ACCESS_KEY/,
    );
  });

  it("trims surrounding whitespace from values it accepts", () => {
    const env = validEnv();
    env.R2_BUCKET = "  hkucc-media\n";

    expect(readEnv(env).media.bucket).toBe("hkucc-media");
  });

  // Payload derives its encryption key from this. A short one is a weak key, and
  // the failure it causes — decryptable secrets — is invisible from the outside.
  it("rejects a secret shorter than the minimum", () => {
    const env = validEnv();
    env.PAYLOAD_SECRET = "a".repeat(MINIMUM_SECRET_LENGTH - 1);

    expect(() => readEnv(env)).toThrow(/PAYLOAD_SECRET/);
  });

  it("accepts a secret exactly at the minimum", () => {
    const env = validEnv();
    env.PAYLOAD_SECRET = "b".repeat(MINIMUM_SECRET_LENGTH);

    expect(readEnv(env).payloadSecret).toBe("b".repeat(MINIMUM_SECRET_LENGTH));
  });

  // Media URLs are built by joining this to a filename. A trailing slash on the
  // base would produce `//file.jpg`, which R2 serves as a different key.
  it("strips trailing slashes from the URLs", () => {
    const env = validEnv();
    env.R2_PUBLIC_URL = "https://media.hkucc.example/";
    env.PAYLOAD_PUBLIC_SERVER_URL = "https://cms.hkucc.example//";

    const read = readEnv(env);
    expect(read.media.publicUrl).toBe("https://media.hkucc.example");
    expect(read.serverUrl).toBe("https://cms.hkucc.example");
  });

  // The endpoint is handed to the S3 client, which expects an origin. A path on
  // the end of it makes every request 404 in a way that reads as a bad key.
  it("rejects a URL that is not a URL", () => {
    const env = validEnv();
    env.R2_ENDPOINT = "acct.r2.cloudflarestorage.com";

    expect(() => readEnv(env)).toThrow(/R2_ENDPOINT/);
  });

  it("reports a bad value and a missing one together", () => {
    const env = validEnv();
    delete env.DATABASE_URL;
    env.PAYLOAD_SECRET = "short";

    expect(() => readEnv(env)).toThrow(/DATABASE_URL[\s\S]*PAYLOAD_SECRET/);
  });
});

describe("announcing a publish", () => {
  const withPublish = (
    url?: string,
    secret?: string,
  ): Record<string, string | undefined> => ({
    ...validEnv(),
    SITE_REVALIDATE_URL: url,
    REVALIDATE_SECRET: secret,
  });

  it("is optional — a container with no site to tell is a working CMS", () => {
    // The normal local case: `docker compose up` has no deployment to notify,
    // and the CMS must be fully usable without one.
    expect(readEnv(validEnv()).publish).toBeUndefined();
  });

  it("is read when both halves are given", () => {
    expect(
      readEnv(withPublish("https://hkucc.example/api/revalidate", "shared")).publish,
    ).toEqual({ url: "https://hkucc.example/api/revalidate", secret: "shared" });
  });

  it("refuses half of it, because half looks like working software", () => {
    // A URL with no secret is rejected by the site on every publish; a secret
    // with no URL is a webhook that silently never fires. Both look fine until
    // somebody publishes and the site does not change.
    expect(() => readEnv(withPublish("https://hkucc.example/api/revalidate"))).toThrow(
      /go together/,
    );
    expect(() => readEnv(withPublish(undefined, "shared"))).toThrow(/go together/);
  });

  it("complains about a URL that is not one", () => {
    expect(() => readEnv(withPublish("hkucc.example/revalidate", "shared"))).toThrow(
      /SITE_REVALIDATE_URL is not a URL/,
    );
  });
});

describe("readEnvUnchecked", () => {
  // What the Docker build sees: the config is imported to compile the admin
  // panel, long before any secret exists. It must import rather than explode.
  it("returns blanks for an empty environment instead of throwing", () => {
    const env = readEnvUnchecked({});

    expect(env.databaseUrl).toBe("");
    expect(env.media.publicUrl).toBe("");
  });

  it("normalises exactly as the checked read does", () => {
    const source = validEnv();
    source.R2_PUBLIC_URL = "  https://media.hkucc.example/  ";

    expect(readEnvUnchecked(source)).toEqual(readEnv(source));
  });
});
