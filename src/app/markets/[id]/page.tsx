import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import MarketView from "@/components/market/MarketView";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const market = await prisma.market.findUnique({
    where: { id },
    select: {
      id: true,
      mechanism: true,
      visibility: true,
      status: true,
      ownerId: true,
      title: true,
      description: true,
      referenceSource: true,
      externalSlug: true,
      externalMarketId: true,
      conditionId: true,
      event: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  if (!market) {
    notFound();
  }

  try {
    await assertMarketVisibleToUser({ market, userId: await getUserId() });
  } catch {
    notFound();
  }

  return <MarketView market={market} />;
}
