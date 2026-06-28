import { NextRequest } from "next/server";
import { GET as listCandidates } from "@/app/api/admin/polymarket/discovery-candidates/route";
import {
  GET as getCandidate,
  PATCH as patchCandidate,
} from "@/app/api/admin/polymarket/discovery-candidates/[id]/route";

const requireAdmin = jest.fn();
const listDiscoveryCandidates = jest.fn();
const getDiscoveryCandidate = jest.fn();
const updateDiscoveryCandidateReviewStatus = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/server/services/polymarket", () => ({
  listDiscoveryCandidates: (...args: unknown[]) => listDiscoveryCandidates(...args),
  getDiscoveryCandidate: (...args: unknown[]) => getDiscoveryCandidate(...args),
  isDiscoveryCandidateStatusAction: (value: string) =>
    ["approve", "mark_import_ready", "ignore", "reject", "block", "mark_review_required"].includes(value),
  updateDiscoveryCandidateReviewStatus: (...args: unknown[]) => updateDiscoveryCandidateReviewStatus(...args),
}));

describe("admin polymarket discovery candidates routes", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    listDiscoveryCandidates.mockReset();
    getDiscoveryCandidate.mockReset();
    updateDiscoveryCandidateReviewStatus.mockReset();
  });

  test("rejects public list access", async () => {
    requireAdmin.mockResolvedValue({ error: "Unauthorized", status: 401 });

    const res = await listCandidates(new NextRequest("http://localhost/api/admin/polymarket/discovery-candidates"));

    expect(res.status).toBe(401);
    expect(listDiscoveryCandidates).not.toHaveBeenCalled();
  });

  test("lists candidates with review filters for admins", async () => {
    requireAdmin.mockResolvedValue({ user: { id: "admin-1" } });
    listDiscoveryCandidates.mockResolvedValue({
      items: [{ id: "candidate-1", status: "discovered" }],
      page: 2,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });

    const res = await listCandidates(
      new NextRequest(
        "http://localhost/api/admin/polymarket/discovery-candidates?status=discovered&source=polymarket&batchId=batch-1&page=2&pageSize=10",
      ),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, total: 1 });
    expect(listDiscoveryCandidates).toHaveBeenCalledWith({
      status: "discovered",
      source: "polymarket",
      batchId: "batch-1",
      page: 2,
      pageSize: 10,
    });
  });

  test("loads candidate detail for admins", async () => {
    requireAdmin.mockResolvedValue({ user: { id: "admin-1" } });
    getDiscoveryCandidate.mockResolvedValue({ id: "candidate-1", rawMetadata: { public: true } });

    const res = await getCandidate(
      new NextRequest("http://localhost/api/admin/polymarket/discovery-candidates/candidate-1"),
      { params: Promise.resolve({ id: "candidate-1" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, candidate: { id: "candidate-1" } });
    expect(getDiscoveryCandidate).toHaveBeenCalledWith("candidate-1");
  });

  test("updates candidate status with admin reviewer metadata", async () => {
    requireAdmin.mockResolvedValue({ user: { id: "admin-1" } });
    updateDiscoveryCandidateReviewStatus.mockResolvedValue({ id: "candidate-1", status: "draft_import_ready" });

    const res = await patchCandidate(
      new NextRequest("http://localhost/api/admin/polymarket/discovery-candidates/candidate-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "mark_import_ready", reason: "Known teams and token IDs verified." }),
      }),
      { params: Promise.resolve({ id: "candidate-1" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      candidate: { id: "candidate-1", status: "draft_import_ready" },
    });
    expect(updateDiscoveryCandidateReviewStatus).toHaveBeenCalledWith({
      id: "candidate-1",
      action: "mark_import_ready",
      reason: "Known teams and token IDs verified.",
      reviewedBy: "admin-1",
    });
  });

  test("rejects invalid status actions", async () => {
    requireAdmin.mockResolvedValue({ user: { id: "admin-1" } });

    const res = await patchCandidate(
      new NextRequest("http://localhost/api/admin/polymarket/discovery-candidates/candidate-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "promote_now" }),
      }),
      { params: Promise.resolve({ id: "candidate-1" }) },
    );

    expect(res.status).toBe(400);
    expect(updateDiscoveryCandidateReviewStatus).not.toHaveBeenCalled();
  });
});
