import type { AccountBalance, AccountNavigation, AccountProfile, EventDetail, EventSummary, Market, MarketChart, MarketChartRange, OrderbookBook, PortfolioCanceledOrderItem, PortfolioHistoryItem, PortfolioRecentTradeItem, PortfolioSnapshot, PortfolioValueHistory, PortfolioValueHistoryRange, ProfilePreferences, Quote } from "./types";

export type CancelOrderResponse = {
  order?: {
    id?: string;
    status?: string;
  };
  balance?: unknown;
  position?: unknown;
};

const trimSlash = (value: string) => value.replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 3500;

export class PolyApi {
  baseUrl: string;
  apiKey: string;

  constructor(baseUrl: string, apiKey = "") {
    this.baseUrl = trimSlash(baseUrl || "http://127.0.0.1:3000");
    this.apiKey = apiKey.trim();
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    headers.set("Accept", "application/json");
    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          payload?.error?.message ?? payload?.error ?? `Request failed with ${response.status}`;
        throw new Error(String(message));
      }
      return payload as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  listWorldCupEvents(input: string | { search?: string; limit?: number; cursor?: string | null; statusGroup?: "live" | "today" | "upcoming" | null; eventIds?: string[]; sortBy?: "popular" | "live"; marketType?: "future" } = "") {
    const search = typeof input === "string" ? input : input.search ?? "";
    const params = new URLSearchParams({
      sportKey: "soccer",
      leagueKey: "world_cup",
    });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    if (typeof input === "object") {
      if (input.limit) params.set("limit", String(input.limit));
      if (input.cursor) params.set("cursor", input.cursor);
      if (input.statusGroup) params.set("statusGroup", input.statusGroup);
      if (input.eventIds?.length) params.set("eventIds", input.eventIds.join(","));
      if (input.sortBy) params.set("sortBy", input.sortBy);
      if (input.marketType) params.set("marketType", input.marketType);
    }
    params.set("includeMobileMarkets", "1");
    return this.request<{
      events: EventSummary[];
      nextCursor?: string | null;
      page?: { limit: number; nextCursor: string | null; hasMore: boolean; sortBy?: "popular" | "live" | null };
    }>(`/api/events?${params.toString()}`);
  }

  async getEvent(slug: string) {
    const encodedSlug = encodeURIComponent(slug);
    try {
      return await this.request<EventDetail>(`/api/mobile/events/${encodedSlug}/live-detail`);
    } catch {
      return this.request<EventDetail>(`/api/events/${encodedSlug}`);
    }
  }

  getMarket(id: string) {
    return this.request<{ market: Market }>(`/api/markets/${encodeURIComponent(id)}`);
  }

  getMarketQuote(marketId: string, outcomeId?: string) {
    const params = new URLSearchParams();
    if (outcomeId) params.set("outcomeId", outcomeId);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ marketId: string; quotes: Quote[] }>(
      `/api/markets/${encodeURIComponent(marketId)}/quote${suffix}`,
    );
  }

  getMarketChart(marketId: string, range: MarketChartRange = "1W") {
    const params = new URLSearchParams({ range });
    return this.request<MarketChart>(
      `/api/markets/${encodeURIComponent(marketId)}/chart?${params.toString()}`,
    );
  }

  getOrderbook(marketId: string, input: { outcomeId?: string; maxLevels?: number } = {}) {
    const params = new URLSearchParams();
    if (input.outcomeId) params.set("outcomeId", input.outcomeId);
    if (input.maxLevels) params.set("maxLevels", String(input.maxLevels));
    params.set("_ts", String(Date.now()));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return this.request<OrderbookBook>(`/api/orderbook/${encodeURIComponent(marketId)}/book${suffix}`);
  }

  getPortfolioHistory() {
    return this.request<{
      history: PortfolioHistoryItem[];
      canceledOrders?: PortfolioCanceledOrderItem[];
      recentTrades?: PortfolioRecentTradeItem[];
    }>(`/api/portfolio/history`);
  }

  getPortfolio() {
    return this.request<PortfolioSnapshot>(`/api/portfolio`);
  }

  getPortfolioValueHistory(range: PortfolioValueHistoryRange = "1D") {
    const params = new URLSearchParams({ range });
    return this.request<PortfolioValueHistory>(`/api/portfolio/value-history?${params.toString()}`);
  }

  getAccountBalance() {
    return this.request<AccountBalance>(`/api/account/balance`);
  }

  getAccountProfile() {
    return this.request<AccountProfile>(`/api/account/profile`);
  }

  getAccountNavigation() {
    return this.request<AccountNavigation>(`/api/account/navigation`);
  }

  placeLimitOrder(input: {
    marketId: string;
    outcomeId: string;
    side: "BUY" | "SELL";
    contractSide?: "YES" | "NO";
    price: string;
    size: string;
    selection?: unknown;
  }) {
    const clientOrderId = `mobile-${Date.now()}`;
    return this.request(`/api/orders`, {
      method: "POST",
      headers: {
        "Idempotency-Key": clientOrderId,
      },
      body: JSON.stringify({
        ...input,
        type: "LIMIT",
        clientOrderId,
      }),
    });
  }

  cancelOrder(orderId: string) {
    return this.request<CancelOrderResponse>(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "DELETE",
    });
  }

  getProfilePreferences() {
    return this.request<{ preferences: ProfilePreferences }>(`/api/profile/preferences`);
  }

  saveProfilePreferences(input: ProfilePreferences) {
    return this.request<{ preferences: ProfilePreferences }>(`/api/profile/preferences`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }
}
