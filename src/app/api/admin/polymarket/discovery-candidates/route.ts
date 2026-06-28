import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listDiscoveryCandidates } from "@/server/services/polymarket";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "25");
  const result = await listDiscoveryCandidates({
    source: url.searchParams.get("source"),
    status: url.searchParams.get("status"),
    batchId: url.searchParams.get("batchId"),
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 25,
  });

  return NextResponse.json({ ok: true, ...result });
}
