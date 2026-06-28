import { NextRequest, NextResponse } from "next/server";
import { MarketStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { marketReadInclude, serializeMarketReadModel } from "@/server/services/marketReadModel";
import { publicEventMarketWhere, worldCupFreshReferenceCutoff } from "@/server/services/worldCupPublicEligibility";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const categorySlug = url.searchParams.get("category");
  const tagsParam = url.searchParams.get("tags");
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");
  const view = url.searchParams.get("view") ?? "";

  const tagSlugs = tagsParam
    ? tagsParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const statusFilter: Prisma.MarketWhereInput = (() => {
    if (status && status !== "ALL") return { status: status as MarketStatus };
    if (view === "resolved") return { status: MarketStatus.RESOLVED };
    if (view === "all") return {};
    return { status: "LIVE" as never };
  })();

  const orderBy: Prisma.MarketOrderByWithRelationInput[] =
    view === "resolved"
      ? [{ resolveTime: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const where: Prisma.MarketWhereInput = {
    visibility: "PUBLIC",
    isListed: true,
    AND: [publicEventMarketWhere(worldCupFreshReferenceCutoff())],
    ...statusFilter,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlugs.length
      ? {
          tags: {
            some: {
              tag: { slug: { in: tagSlugs } },
            },
          },
        }
      : {}),
  };

  const markets = await prisma.market.findMany({
    where,
    orderBy,
    include: marketReadInclude,
  });

  const payload = await Promise.all(
    markets
      .filter((market) => {
        const metadata =
          market.referenceMetadata && typeof market.referenceMetadata === "object" && !Array.isArray(market.referenceMetadata)
            ? (market.referenceMetadata as Record<string, unknown>)
            : {};
        const group =
          metadata.group && typeof metadata.group === "object" && !Array.isArray(metadata.group)
            ? (metadata.group as Record<string, unknown>)
            : null;
        return !group?.slug;
      })
      .map((market) => serializeMarketReadModel(market)),
  );

  return NextResponse.json({ markets: payload });
}
