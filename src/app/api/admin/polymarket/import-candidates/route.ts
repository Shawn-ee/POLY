import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { PolymarketDiscoveryClient } from "@/server/services/polymarket";

export async function GET(request: NextRequest) {
  try {
    await assertAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim();
  const limit = Number(url.searchParams.get("limit") ?? "50");

  try {
    const client = new PolymarketDiscoveryClient();
    const candidates = await client.discoverWorldCupImportCandidates({
      queries: query ? [query] : undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 50,
    });
    return NextResponse.json({ ok: true, dryRun: true, candidates });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to discover Polymarket import candidates." },
      { status: 502 },
    );
  }
}
