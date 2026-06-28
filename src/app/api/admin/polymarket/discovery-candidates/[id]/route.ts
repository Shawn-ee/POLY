import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getDiscoveryCandidate,
  isDiscoveryCandidateStatusAction,
  updateDiscoveryCandidateReviewStatus,
} from "@/server/services/polymarket";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: Params) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const candidate = await getDiscoveryCandidate(id);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, candidate });
}

export async function PATCH(request: NextRequest, context: Params) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";
  if (!isDiscoveryCandidateStatusAction(action)) {
    return NextResponse.json(
      { error: "Invalid action. Use approve, mark_import_ready, ignore, reject, block, or mark_review_required." },
      { status: 400 },
    );
  }

  try {
    const candidate = await updateDiscoveryCandidateReviewStatus({
      id,
      action,
      reason: typeof body?.reason === "string" ? body.reason : null,
      reviewedBy: admin.user.id,
    });
    return NextResponse.json({ ok: true, candidate });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    throw error;
  }
}
