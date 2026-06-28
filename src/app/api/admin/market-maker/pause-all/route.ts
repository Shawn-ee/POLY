import { NextResponse } from "next/server";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { pauseAllReferenceMarketMakerQuotes } from "@/server/services/referenceMarketMaker";

export async function POST() {
  try {
    await assertReferenceBotAdmin();
    const result = await pauseAllReferenceMarketMakerQuotes();
    return NextResponse.json(result);
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
