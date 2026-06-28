import { NextRequest, NextResponse } from "next/server";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { generateResolutionProposalsOnce, listResolutionProposals } from "@/server/services/resolutionProposalBot";

export async function GET(request: NextRequest) {
  try {
    await assertReferenceBotAdmin();
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
    const proposals = await listResolutionProposals(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50);
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      proposalCount: proposals.length,
      proposals,
      safety: {
        automaticSettlement: false,
        automaticRealMoneySettlement: false,
      },
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function POST() {
  try {
    await assertReferenceBotAdmin();
    const result = await generateResolutionProposalsOnce({ store: true });
    return NextResponse.json({
      ...result,
      safety: {
        automaticSettlement: false,
        automaticRealMoneySettlement: false,
      },
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
