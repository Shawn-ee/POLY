import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { buildVerifiedPolymarketMappingMetadata } from "@/server/services/polymarket";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  let actorUserId = "";
  try {
    const admin = await assertAdmin();
    actorUserId = admin.id;
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { reviewNotes?: unknown } | null;
  const market = await prisma.market.findUnique({ where: { id } });
  if (!market || market.referenceSource !== "polymarket") {
    return NextResponse.json({ error: "Polymarket mapping not found." }, { status: 404 });
  }

  const referenceMetadata = buildVerifiedPolymarketMappingMetadata({
    current: market.referenceMetadata,
    actorUserId,
    reviewNotes: typeof body?.reviewNotes === "string" ? body.reviewNotes : null,
  });
  const updated = await prisma.market.update({
    where: { id },
    data: { referenceMetadata },
  });

  return NextResponse.json({
    ok: true,
    mappingId: updated.id,
    marketId: updated.id,
    status: "verified",
    referenceMetadata: updated.referenceMetadata,
  });
}
