import {
  buildPolymarketImportCandidates,
  parsePolymarketEventCandidate,
  parsePolymarketMarketCandidate,
} from "@/server/services/polymarket/parser";
import {
  PolymarketEventCandidate,
  PolymarketGammaWire,
  PolymarketImportCandidate,
  PolymarketMarketCandidate,
} from "@/server/services/polymarket/types";

const DEFAULT_GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DEFAULT_WORLD_CUP_QUERIES = ["world cup", "fifa world cup", "soccer world cup"];

export class PolymarketDiscoveryClient {
  constructor(
    private readonly baseUrl = DEFAULT_GAMMA_BASE_URL,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async discoverWorldCupMarkets(options: {
    queries?: string[];
    limit?: number;
  } = {}): Promise<PolymarketMarketCandidate[]> {
    const seen = new Map<string, PolymarketMarketCandidate>();
    const queries = options.queries?.length ? options.queries : DEFAULT_WORLD_CUP_QUERIES;
    const limit = options.limit && options.limit > 0 ? options.limit : 50;

    for (const query of queries) {
      const page = await this.fetchMarkets({ search: query, limit });
      for (const market of page) {
        const key = market.conditionId ?? market.externalMarketId ?? market.slug ?? market.title;
        if (!seen.has(key)) {
          seen.set(key, market);
        }
      }
    }

    return Array.from(seen.values()).slice(0, limit);
  }

  async discoverWorldCupImportCandidates(options: {
    queries?: string[];
    limit?: number;
    existingDuplicateKeys?: Set<string>;
  } = {}): Promise<PolymarketImportCandidate[]> {
    const markets = await this.discoverWorldCupMarkets(options);
    return buildPolymarketImportCandidates({
      event: null,
      markets,
      existingDuplicateKeys: options.existingDuplicateKeys,
    });
  }

  async fetchEventBySlug(slug: string): Promise<PolymarketEventCandidate | null> {
    const url = new URL("/events", this.baseUrl);
    url.searchParams.set("slug", slug);
    const payload = await this.getJsonArray(url);
    const first = payload.find((item) => item && typeof item === "object") as PolymarketGammaWire | undefined;
    return first ? parsePolymarketEventCandidate(first) : null;
  }

  private async fetchMarkets(params: { search: string; limit: number }): Promise<PolymarketMarketCandidate[]> {
    const url = new URL("/markets", this.baseUrl);
    url.searchParams.set("search", params.search);
    url.searchParams.set("limit", String(params.limit));
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("archived", "false");
    url.searchParams.set("order", "volume");
    url.searchParams.set("ascending", "false");

    const payload = await this.getJsonArray(url);
    return payload
      .filter((item): item is PolymarketGammaWire => Boolean(item && typeof item === "object"))
      .map(parsePolymarketMarketCandidate)
      .filter((item): item is PolymarketMarketCandidate => item != null);
  }

  private async getJsonArray(url: URL): Promise<unknown[]> {
    const response = await this.fetchImpl(url.toString(), { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Polymarket Gamma request failed: ${response.status} ${response.statusText}`);
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error("Polymarket Gamma returned unexpected payload.");
    }
    return payload;
  }
}
