export type PolymarketClobBookLevel = {
  price?: string | number;
  size?: string | number;
};

export type PolymarketClobBook = {
  bids?: PolymarketClobBookLevel[];
  asks?: PolymarketClobBookLevel[];
};

export type PolymarketClobReferencePrice = {
  tokenId: string;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  last: number | null;
  liquidity: number | null;
  confidence: "high" | "medium" | "low" | "unavailable";
  updatedAt: string;
  staleAfterSeconds: number;
  raw: {
    book: unknown;
    buyPrice: unknown;
    sellPrice: unknown;
    midpoint: unknown;
  };
};

const DEFAULT_CLOB_BASE_URL = "https://clob.polymarket.com";
const DEFAULT_STALE_AFTER_SECONDS = 15;

export class PolymarketClobClient {
  constructor(
    private readonly baseUrl = DEFAULT_CLOB_BASE_URL,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async getReferencePrice(tokenId: string): Promise<PolymarketClobReferencePrice> {
    const [bookResult, buyResult, sellResult, midpointResult] = await Promise.allSettled([
      this.getJson<PolymarketClobBook>(`/book?token_id=${encodeURIComponent(tokenId)}`),
      this.getJson<{ price?: string | number }>(`/price?token_id=${encodeURIComponent(tokenId)}&side=BUY`),
      this.getJson<{ price?: string | number }>(`/price?token_id=${encodeURIComponent(tokenId)}&side=SELL`),
      this.getJson<{ mid_price?: string | number }>(`/midpoint?token_id=${encodeURIComponent(tokenId)}`),
    ]);

    const book = fulfilledValue(bookResult);
    const bid = bestBookPrice(book?.bids) ?? normalizePrice(fulfilledValue(buyResult)?.price);
    const ask = bestBookPrice(book?.asks) ?? normalizePrice(fulfilledValue(sellResult)?.price);
    const mid =
      normalizePrice(fulfilledValue(midpointResult)?.mid_price) ??
      (bid != null && ask != null ? roundPrice((bid + ask) / 2) : null);

    return {
      tokenId,
      bid,
      ask,
      mid,
      last: null,
      liquidity: sumLiquidity(book),
      confidence: confidenceFor({ bid, ask, mid }),
      updatedAt: new Date().toISOString(),
      staleAfterSeconds: DEFAULT_STALE_AFTER_SECONDS,
      raw: {
        book: bookResult.status === "fulfilled" ? bookResult.value : { error: settledError(bookResult) },
        buyPrice: buyResult.status === "fulfilled" ? buyResult.value : { error: settledError(buyResult) },
        sellPrice: sellResult.status === "fulfilled" ? sellResult.value : { error: settledError(sellResult) },
        midpoint: midpointResult.status === "fulfilled" ? midpointResult.value : { error: settledError(midpointResult) },
      },
    };
  }

  private async getJson<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(new URL(path, this.baseUrl).toString(), {
      headers: { Accept: "application/json" },
    });
    if (response.status === 404) {
      return {} as T;
    }
    if (!response.ok) {
      throw new Error(`Polymarket CLOB request failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  }
}

export function isReferencePriceStale(input: {
  updatedAt: string | Date | null;
  staleAfterSeconds?: number | null;
  now?: number;
}) {
  if (!input.updatedAt) return true;
  const updatedAt = input.updatedAt instanceof Date ? input.updatedAt.getTime() : Date.parse(input.updatedAt);
  if (!Number.isFinite(updatedAt)) return true;
  const staleMs = (input.staleAfterSeconds ?? DEFAULT_STALE_AFTER_SECONDS) * 1000;
  return (input.now ?? Date.now()) - updatedAt > staleMs;
}

function fulfilledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

function settledError(result: PromiseSettledResult<unknown>) {
  return result.status === "rejected" ? (result.reason instanceof Error ? result.reason.message : String(result.reason)) : null;
}

function bestBookPrice(levels: PolymarketClobBookLevel[] | undefined) {
  return normalizePrice(levels?.[0]?.price);
}

function sumLiquidity(book: PolymarketClobBook | null) {
  const levels = [...(book?.bids ?? []), ...(book?.asks ?? [])];
  if (levels.length === 0) return null;
  const total = levels.reduce((sum, level) => sum + (normalizePositiveNumber(level.size) ?? 0), 0);
  return total > 0 ? roundPrice(total) : null;
}

function confidenceFor(input: { bid: number | null; ask: number | null; mid: number | null }): PolymarketClobReferencePrice["confidence"] {
  if (input.bid != null && input.ask != null && input.bid <= input.ask) return "high";
  if (input.mid != null) return "medium";
  if (input.bid != null || input.ask != null) return "low";
  return "unavailable";
}

function normalizePrice(value: unknown) {
  const number = normalizePositiveNumber(value);
  return number != null && number >= 0 && number <= 1 ? roundPrice(number) : null;
}

function normalizePositiveNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function roundPrice(value: number) {
  return Number(value.toFixed(6));
}
