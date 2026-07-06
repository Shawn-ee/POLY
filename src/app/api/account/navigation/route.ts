import { NextRequest } from "next/server";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { getCanonicalAccountNavigation } from "@/server/services/canonicalApi";

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["account:read"],
    routeId: "account:navigation",
    fallbackMessage: "Failed to load account navigation.",
    handler: async () => ({
      body: await getCanonicalAccountNavigation(),
    }),
  });
}
