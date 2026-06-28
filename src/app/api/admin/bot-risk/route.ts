import { NextResponse } from "next/server";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { runReferenceRiskMonitorOnce } from "@/server/services/referenceRiskMonitor";

export async function GET() {
  try {
    await assertReferenceBotAdmin();
    const result = await runReferenceRiskMonitorOnce({ pauseOnRisk: false, logEvents: false });

    return NextResponse.json(result);
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
