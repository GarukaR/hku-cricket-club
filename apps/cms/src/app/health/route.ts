import config from "@payload-config";
import { getPayload } from "payload";

/**
 * What Render gates a deploy on, and what Docker's HEALTHCHECK polls.
 *
 * It is deliberately more than "the process is listening". A Next server will
 * happily serve while pointed at a database that does not exist, so a liveness
 * check that only proved the port was open would pass on exactly the deploy
 * worth catching. Counting users is the cheapest query that proves the whole
 * chain: the config imported, Payload initialised, and Neon answered.
 *
 * The environment itself is not checked here — instrumentation.ts does that at
 * start-up, and a container that failed it never reaches this route.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getPayload({ config });
    await payload.count({ collection: "users" });
    return Response.json({ status: "ok" });
  } catch (error) {
    // The message can carry a connection string. It goes to the container's log,
    // where the person debugging can see it, and never into the response.
    console.error("Health check failed:", error);
    return Response.json({ status: "unhealthy" }, { status: 503 });
  }
}
