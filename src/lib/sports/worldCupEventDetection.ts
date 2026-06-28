export type WorldCupEventIdentity = {
  category?: string | null;
  sportKey?: string | null;
  leagueKey?: string | null;
  title?: string | null;
  description?: string | null;
  source?: string | null;
  hasGroupedMarkets?: boolean | null;
};

export function isWorldCupSoccerEvent(event: WorldCupEventIdentity) {
  if (event.category === "sports" && event.sportKey === "soccer" && event.leagueKey === "world_cup") {
    return true;
  }

  const haystack = [
    event.category,
    event.sportKey,
    event.leagueKey,
    event.title,
    event.description,
    event.source,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const soccerLike = haystack.includes("soccer") || haystack.includes("fifa") || haystack.includes("world cup");
  const worldCupLike = haystack.includes("world cup") || haystack.includes("fifa") || haystack.includes("fifwc");

  return Boolean(event.hasGroupedMarkets && soccerLike && worldCupLike);
}
