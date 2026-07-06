import { NextRequest } from "next/server";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { getCanonicalAccountProfile } from "@/server/services/canonicalApi";

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["account:read"],
    routeId: "account:profile",
    fallbackMessage: "Failed to load account profile.",
    handler: async (actor) => ({
      body: await getCanonicalAccountProfile(actor.userId),
    }),
  });
}
