import { NextResponse } from "next/server";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { getClosedBetaRuntimeStatus } from "@/server/services/closedBetaRuntimeStatus";

export async function GET() {
  try {
    await assertReferenceBotAdmin();
    const status = await getClosedBetaRuntimeStatus();
    return NextResponse.json(status);
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

