import { NextRequest, NextResponse } from "next/server";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { listAdminReferencePrices } from "@/server/services/polymarket";

export async function GET(request: NextRequest) {
  try {
    await assertReferenceBotAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const url = new URL(request.url);
  const marketId = url.searchParams.get("marketId");
  const source = url.searchParams.get("source");
  const items = await listAdminReferencePrices({ marketId, source });
  return NextResponse.json({ items });
}
