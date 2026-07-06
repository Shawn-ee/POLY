import { Prisma } from "@prisma/client";

export const marketTypeAliases = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "future" || normalized === "futures" || normalized === "outright") return ["future", "outright"];
  return normalized ? [normalized] : [];
};

export const listedMarketWhere = (marketType: string): Prisma.MarketWhereInput => {
  const aliases = marketTypeAliases(marketType);
  return {
    visibility: "PUBLIC",
    isListed: true,
    ...(aliases.length ? { marketType: { in: aliases } } : {}),
  };
};

export const eventMarketTypeFilter = (marketType: string): Prisma.EventWhereInput => ({
  markets: {
    some: listedMarketWhere(marketType),
  },
});
