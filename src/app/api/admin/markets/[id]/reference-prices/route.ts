import { NextResponse } from "next/server";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { listAdminReferencePrices } from "@/server/services/polymarket";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  try {
    await assertReferenceBotAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { id } = await context.params;
  const items = await listAdminReferencePrices({ marketId: id, source: "polymarket" });
  return NextResponse.json({ items });
}
