import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackHandler, Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PolyApi } from "./src/api";
import { normalizeEventDetail, normalizeEventSummary } from "./src/adapters/worldCupAdapter";
import { AccountScreen } from "./src/components/AccountScreen";
import { BottomTabs } from "./src/components/BottomTabs";
import { EventDetail } from "./src/components/EventDetail";
import { Header } from "./src/components/Header";
import { HomeScreen } from "./src/components/HomeScreen";
import { LiveScreen } from "./src/components/LiveScreen";
import {
  OpenOrder,
  OrderConfirmation,
  Portfolio,
  PortfolioActivity,
  portfolioPositionValue,
  PortfolioSyncStatus,
  Position,
} from "./src/components/Portfolio";
import { SearchScreen } from "./src/components/SearchScreen";
import { Ticket, TicketSelection, TradeTicket } from "./src/components/TradeTicket";
import { WorldCupTab } from "./src/components/WorldCupSegmented";
import { appCopy } from "./src/localization/appCopy";
import {
  Event,
  Locale,
  Market,
  Outcome,
  worldCupEvents,
  worldCupFutures,
} from "./src/mocks/worldCup";
import { OrderMode, submitTicketOrder } from "./src/services/orderService";
import { appendUniqueActivity, cancelOpenOrderOnServer, openOrderCanceledActivity } from "./src/services/openOrderService";
import { closePositionOnServer } from "./src/services/positionCloseService";
import { loadAccountBalance } from "./src/services/accountBalanceService";
import { loadAccountProfile } from "./src/services/accountProfileService";
import { serverBackendOnlyPortfolioFixture, serverClosedPortfolioFixture, serverHydratedPortfolioFixture } from "./src/services/portfolioFixtureService";
import { applyServerPortfolioState } from "./src/services/portfolioStateApplyService";
import { loadServerPortfolioState } from "./src/services/portfolioSyncService";
import { resolvePositionTradeTarget } from "./src/services/positionTradeTargetService";
import { loadProfilePreferences, saveProfilePreferences } from "./src/services/profilePreferencesService";
import { applyChartErrorToEvent, applyChartLoadingToEvent, applyChartStateToEvent, loadMarketChartState } from "./src/services/marketChartService";
import { applyMarketDepthErrorToEvent, applyMarketDepthLoadingToEvent, applyDepthStateToEvent, loadMarketDepthState } from "./src/services/marketDepthService";
import {
  applyTicketQuoteToOutcome,
  applyTicketQuotesToEvent,
  applyTicketQuotesToMarket,
  applyTicketQuotesToMarkets,
  loadMarketQuotesById,
  loadTicketQuotes,
} from "./src/services/quoteService";

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:3000";
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_API_KEY || "";
const ORDER_MODE: OrderMode = process.env.EXPO_PUBLIC_ORDER_MODE === "server" ? "server" : "mock";
const MARKET_DATA_MODE: "mock" | "server" =
  ORDER_MODE === "server" || process.env.EXPO_PUBLIC_MARKET_DATA_MODE === "server" ? "server" : "mock";
const SMOKE_OPEN_SERVER_ORDER_PRICE = 1;
const SMOKE_OPEN_SERVER_ORDER_AMOUNT = "1";
const HOME_EVENT_PAGE_SIZE = 10;
const SEARCH_EVENT_PAGE_SIZE = 10;
const SAVED_EVENTS_STORAGE_KEY = "holiwyn.savedEventIds.v1";
const LANGUAGE_STORAGE_KEY = "holiwyn.language.v1";
const PORTFOLIO_STORAGE_KEY = "holiwyn.portfolio.v1";
const TICKET_DEFAULTS_STORAGE_KEY = "holiwyn.ticketDefaults.v1";
const SMOKE_OPEN_ORDER: OpenOrder = {
  id: "smoke-open-order",
  title: "Mexico vs. Ecuador winner",
  outcome: "Mexico",
  side: "buy",
  status: "OPEN",
  price: 0.47,
  remaining: 250,
};
const SMOKE_OPEN_SELL_ORDER: OpenOrder = {
  id: "smoke-open-sell-order",
  title: "Mexico vs. Ecuador winner",
  outcome: "Mexico",
  side: "sell",
  status: "OPEN",
  price: 0.52,
  remaining: 100,
  orderValue: 52,
};
const SMOKE_LINE_OPEN_ORDER: OpenOrder = {
  id: "smoke-line-open-order",
  title: "Mexico vs. Ecuador",
  outcome: "YES",
  selection: {
    marketType: "spread",
    line: "2.5",
    period: "1st Half",
    displayLabel: "MEX -2.5 1H",
  },
  side: "buy",
  status: "OPEN",
  price: 0.03,
  remaining: 833.33,
  originalShares: 833.33,
  remainingShares: 833.33,
  orderValue: 25,
  placedAt: "Just now",
};

const bookSnapshotDurabilitySelection: TicketSelection = {
  marketType: "spread",
  marketId: "mexico-ecuador-spread",
  outcomeId: "yes",
  marketGroupId: "mexico-ecuador-game-lines",
  line: "1.5",
  period: "regulation",
  side: "yes",
  displayLabel: "Mexico -1.5 spread",
  contractSide: "yes",
  referenceSource: "polymarket-fixture",
  externalSlug: "world-cup-2026-mexico-vs-ecuador-spread-15",
  externalMarketId: "gamma-mexico-ecuador-spread-15",
  conditionId: "condition-mexico-ecuador-spread-15",
  referenceTokenId: "token-spread-yes-15",
  referenceOutcomeLabel: "Yes",
};

const metadataDriftedWorldCupEvents = (): Event[] =>
  worldCupEvents.map((event) =>
    event.id !== "mexico-ecuador"
      ? event
      : {
          ...event,
          markets: event.markets.map((market) =>
            market.id !== "mexico-ecuador-spread"
              ? market
              : {
                  ...market,
                  title: "Metadata drifted spread label",
                  zhTitle: "Metadata drifted spread label",
                  line: "2.5",
                  externalSlug: "world-cup-2026-mexico-vs-ecuador-spread-drifted",
                  externalMarketId: "gamma-drifted-mexico-ecuador-spread",
                  conditionId: "condition-drifted-mexico-ecuador-spread",
                  outcomes: market.outcomes.map((outcome) =>
                    outcome.id !== "yes"
                      ? outcome
                      : {
                          ...outcome,
                          label: "Metadata drifted Yes",
                          zhLabel: "Metadata drifted Yes",
                          referenceTokenId: "token-drifted-spread-yes",
                          referenceOutcomeLabel: "Drifted Yes",
                        },
                  ),
                },
          ),
        },
  );

const bookSnapshotDurabilityPortfolio = (timestamp: string): StoredPortfolio => {
  const openOrder: OpenOrder = {
    id: "cycle-ef-b-book-open-order",
    title: "Mexico vs. Ecuador",
    outcome: "Yes",
    selection: bookSnapshotDurabilitySelection,
    contractSide: "yes",
    side: "buy",
    status: "OPEN",
    price: 0.36,
    remaining: 69.44,
    originalShares: 69.44,
    remainingShares: 69.44,
    orderValue: 25,
    placedAt: timestamp,
  };
  const position: Position = {
    id: "cycle-ef-b-book-filled-position",
    mode: "mock",
    marketId: "mexico-ecuador-spread",
    outcomeId: "yes",
    title: "Mexico vs. Ecuador",
    outcome: "Yes",
    selection: bookSnapshotDurabilitySelection,
    contractSide: "yes",
    side: "buy",
    amount: 25,
    probability: 36,
    shares: 69.44,
    currentPrice: 0.38,
    currentValue: 26.39,
    pnl: 1.39,
  };
  const latestOrder: OrderConfirmation = {
    id: "cycle-ef-b-book-latest-order",
    mode: "mock",
    title: "Mexico vs. Ecuador",
    outcome: "Yes",
    selection: bookSnapshotDurabilitySelection,
    contractSide: "yes",
    side: "buy",
    amount: 25,
    probability: 36,
    status: "OPEN",
    size: 69.44,
    filledSize: 0,
    remainingSize: 69.44,
  };
  const activities: PortfolioActivity[] = [
    {
      id: "cycle-ef-b-book-canceled-activity",
      action: "canceled",
      title: "Mexico vs. Ecuador",
      outcome: "Yes",
      selection: bookSnapshotDurabilitySelection,
      contractSide: "yes",
      amount: 25,
      shares: 69.44,
      side: "buy",
      probability: 36,
      timestamp,
    },
    {
      id: "cycle-ef-b-book-filled-activity",
      action: "opened",
      title: "Mexico vs. Ecuador",
      outcome: "Yes",
      selection: bookSnapshotDurabilitySelection,
      contractSide: "yes",
      amount: 25,
      shares: 69.44,
      side: "buy",
      probability: 36,
      timestamp,
    },
  ];

  return {
    balance: 9975,
    positions: [position],
    latestOrder,
    openOrders: [openOrder],
    activities,
  };
};

const isBookSpreadLifecycleSelection = (selection?: TicketSelection) =>
  selection?.marketType === "spread" &&
  selection.line === "1.5" &&
  (selection.period === "regulation" || selection.period === "full-game") &&
  typeof selection.limitPrice === "number" &&
  selection.limitPrice > 0;

const appendUniqueEvents = (current: Event[], next: Event[]) => {
  const seen = new Set(current.map((event) => event.id));
  const merged = [...current];
  for (const event of next) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    merged.push(event);
  }
  return merged;
};

const mexicoEcuadorGamePositionFixture = (): Position | undefined => {
  const event = worldCupEvents.find((item) => item.id === "mexico-ecuador");
  const market = event?.markets.find((item) => item.id === "mexico-ecuador-winner");
  const outcome = market?.outcomes.find((item) => item.id === "mexico");
  if (!market || !outcome) return undefined;

  return {
    id: "smoke-mexico-ecuador-game-position",
    mode: "mock",
    marketId: market.id,
    outcomeId: outcome.id,
    title: market.title,
    outcome: outcome.label,
    side: "buy",
    amount: 50,
    shares: 78.13,
    probability: outcome.probability,
    currentPrice: 0.68,
    currentValue: 48.38,
    pnl: -1.62,
    bestBid: 0.66,
    bestAsk: 0.69,
    bestBidSize: 1280,
    bestAskSize: 900,
  };
};

const openOrderRemainingShares = (order: OpenOrder) => order.remainingShares ?? order.remaining;
const openOrderValue = (order: OpenOrder) => order.orderValue ?? openOrderRemainingShares(order) * order.price;

type MainTab = "home" | "live" | "portfolio" | "search" | "account";
type HomeFilter = "all" | "live" | "today" | "saved";
type StoredPortfolio = {
  balance?: number;
  positions?: Position[];
  latestOrder?: OrderConfirmation | null;
  openOrders?: OpenOrder[];
  activities?: PortfolioActivity[];
};
type TicketDefaults = {
  amount: string;
  side: "buy" | "sell";
  slippage: string;
};
type ProfilePreferencesSyncStatus = "hidden" | "syncing" | "synced" | "error";

export default function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const [localeHydrated, setLocaleHydrated] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("home");
  const [worldCupTab, setWorldCupTab] = useState<WorldCupTab>("games");
  const [homeFilter, setHomeFilter] = useState<HomeFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDepthMarketId, setSelectedDepthMarketId] = useState<string | null>(null);
  const [eventDetailForcedSide, setEventDetailForcedSide] = useState<"buy" | "sell" | null>(null);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketOrderError, setTicketOrderError] = useState<string | null>(null);
  const [ticketOrderErrorDetail, setTicketOrderErrorDetail] = useState<string | null>(null);
  const [forceOrderFailure, setForceOrderFailure] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [accountProfileName, setAccountProfileName] = useState("Holiwyn Demo");
  const [positions, setPositions] = useState<Position[]>([]);
  const [latestOrder, setLatestOrder] = useState<OrderConfirmation | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [activities, setActivities] = useState<PortfolioActivity[]>([]);
  const [portfolioHydrated, setPortfolioHydrated] = useState(false);
  const [ticketDefaults, setTicketDefaults] = useState<TicketDefaults>({ amount: "100", side: "buy", slippage: "1%" });
  const [ticketDefaultsHydrated, setTicketDefaultsHydrated] = useState(false);
  const [portfolioSyncStatus, setPortfolioSyncStatus] = useState<PortfolioSyncStatus>(ORDER_MODE === "server" ? "syncing" : "hidden");
  const [profilePreferencesSyncStatus, setProfilePreferencesSyncStatus] = useState<ProfilePreferencesSyncStatus>(
    ORDER_MODE === "server" && DEFAULT_API_KEY.length > 0 ? "syncing" : "hidden"
  );
  const [events, setEvents] = useState<Event[]>(worldCupEvents);
  const [eventNextCursor, setEventNextCursor] = useState<string | null>(null);
  const [isLoadingMoreEvents, setIsLoadingMoreEvents] = useState(false);
  const [searchEvents, setSearchEvents] = useState<Event[]>([]);
  const [searchNextCursor, setSearchNextCursor] = useState<string | null>(null);
  const [isLoadingSearchEvents, setIsLoadingSearchEvents] = useState(false);
  const [searchEventError, setSearchEventError] = useState<string | null>(null);
  const [searchStatusGroup, setSearchStatusGroup] = useState<"live" | "upcoming" | null>(null);
  const [searchSavedOnly, setSearchSavedOnly] = useState(false);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(() => new Set());
  const [savedEventIdsHydrated, setSavedEventIdsHydrated] = useState(false);
  const [forceAccountSignedIn, setForceAccountSignedIn] = useState(false);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);
  const [liveRefreshTick, setLiveRefreshTick] = useState(0);
  const [launchUrlVersion, setLaunchUrlVersion] = useState(0);
  const [futures, setFutures] = useState<Market[]>(worldCupFutures);
  const [runtimeApiKey, setRuntimeApiKey] = useState(DEFAULT_API_KEY);
  const [apiKeyDiagnosticEnabled, setApiKeyDiagnosticEnabled] = useState(false);
  const [apiKeyDiagnostic, setApiKeyDiagnostic] = useState<string | null>(null);
  const [forcedRuntimePortfolioSyncNonce, setForcedRuntimePortfolioSyncNonce] = useState(0);
  const t = appCopy[locale];
  const api = useMemo(() => new PolyApi(DEFAULT_API_BASE, runtimeApiKey), [runtimeApiKey]);
  const mounted = useRef(true);
  const profilePreferencesReady = useRef(false);
  const skipPortfolioHydration = useRef(false);
  const forceServerCloseFixture = useRef(false);
  const forceServerOrderProof = useRef(false);
  const forceServerOpenOrderProof = useRef(false);
  const forceServerOrderSide = useRef<"buy" | "sell">("buy");
  const shouldSyncProfilePreferences = ORDER_MODE === "server" && runtimeApiKey.length > 0;
  const accountPortfolioValue = useMemo(
    () => balance + positions.reduce((total, position) => total + portfolioPositionValue(position), 0),
    [balance, positions],
  );
  const accountOpenOrderValue = useMemo(
    () => openOrders.reduce((total, order) => total + openOrderValue(order), 0),
    [openOrders],
  );
  const homeStatusGroup: "live" | "today" | null =
    homeFilter === "live" || homeFilter === "today" ? homeFilter : null;
  const homeSavedEventIds = useMemo(
    () => homeFilter === "saved" ? [...savedEventIds] : undefined,
    [homeFilter, savedEventIds],
  );
  const searchSavedEventIds = useMemo(
    () => searchSavedOnly ? [...savedEventIds] : undefined,
    [savedEventIds, searchSavedOnly],
  );

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_EVENTS_STORAGE_KEY)
      .then((stored) => {
        if (!mounted.current || !stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedEventIds(new Set(parsed.filter((id): id is string => typeof id === "string")));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setSavedEventIdsHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!savedEventIdsHydrated) return;
    AsyncStorage.setItem(SAVED_EVENTS_STORAGE_KEY, JSON.stringify([...savedEventIds])).catch(() => undefined);
  }, [savedEventIds, savedEventIdsHydrated]);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((stored) => {
        if (mounted.current && (stored === "en" || stored === "zh")) {
          setLocale(stored);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setLocaleHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!localeHydrated) return;
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, locale).catch(() => undefined);
  }, [locale, localeHydrated]);

  useEffect(() => {
    AsyncStorage.getItem(PORTFOLIO_STORAGE_KEY)
      .then((stored) => {
        if (skipPortfolioHydration.current) return;
        if (!mounted.current || !stored) return;
        const parsed = JSON.parse(stored) as StoredPortfolio;
        if (typeof parsed.balance === "number") setBalance(parsed.balance);
        if (Array.isArray(parsed.positions)) setPositions(parsed.positions);
        if (parsed.latestOrder && typeof parsed.latestOrder === "object") setLatestOrder(parsed.latestOrder);
        if (Array.isArray(parsed.openOrders)) setOpenOrders(parsed.openOrders);
        if (Array.isArray(parsed.activities)) setActivities(parsed.activities);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setPortfolioHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!portfolioHydrated) return;
    const snapshot: StoredPortfolio = { balance, positions, latestOrder, openOrders, activities };
    AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
  }, [activities, balance, latestOrder, openOrders, portfolioHydrated, positions]);

  useEffect(() => {
    AsyncStorage.getItem(TICKET_DEFAULTS_STORAGE_KEY)
      .then((stored) => {
        if (!mounted.current || !stored) return;
        const parsed = JSON.parse(stored) as Partial<TicketDefaults>;
        if (typeof parsed.amount === "string" && (parsed.side === "buy" || parsed.side === "sell")) {
          setTicketDefaults({ amount: parsed.amount, side: parsed.side, slippage: typeof parsed.slippage === "string" ? parsed.slippage : "1%" });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setTicketDefaultsHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!ticketDefaultsHydrated) return;
    AsyncStorage.setItem(TICKET_DEFAULTS_STORAGE_KEY, JSON.stringify(ticketDefaults)).catch(() => undefined);
  }, [ticketDefaults, ticketDefaultsHydrated]);

  useEffect(() => {
    if (!shouldSyncProfilePreferences) {
      setProfilePreferencesSyncStatus("hidden");
      return;
    }
    if (!localeHydrated || !savedEventIdsHydrated || !ticketDefaultsHydrated) {
      setProfilePreferencesSyncStatus("syncing");
      return;
    }
    let cancelled = false;
    setProfilePreferencesSyncStatus("syncing");
    loadProfilePreferences(api)
      .then((preferences) => {
        if (cancelled || !mounted.current) return;
        setLocale(preferences.locale);
        setTicketDefaults({
          amount: preferences.ticketDefaultAmount,
          side: preferences.ticketDefaultSide,
          slippage: preferences.ticketDefaultSlippage,
        });
        setSavedEventIds(new Set(preferences.savedEventIds));
        setProfilePreferencesSyncStatus("synced");
      })
      .catch(() => {
        if (!cancelled && mounted.current) setProfilePreferencesSyncStatus("error");
      })
      .finally(() => {
        if (!cancelled && mounted.current) profilePreferencesReady.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [api, localeHydrated, savedEventIdsHydrated, shouldSyncProfilePreferences, ticketDefaultsHydrated]);

  useEffect(() => {
    if (
      !shouldSyncProfilePreferences ||
      !profilePreferencesReady.current ||
      !localeHydrated ||
      !savedEventIdsHydrated ||
      !ticketDefaultsHydrated
    ) {
      return;
    }
    saveProfilePreferences(api, {
      locale,
      ticketDefaultAmount: ticketDefaults.amount,
      ticketDefaultSide: ticketDefaults.side,
      ticketDefaultSlippage: ticketDefaults.slippage,
      savedEventIds: [...savedEventIds],
    })
      .then(() => {
        if (mounted.current) setProfilePreferencesSyncStatus("synced");
      })
      .catch(() => {
        if (mounted.current) setProfilePreferencesSyncStatus("error");
      });
  }, [api, locale, localeHydrated, savedEventIds, savedEventIdsHydrated, shouldSyncProfilePreferences, ticketDefaults, ticketDefaultsHydrated]);

  const handleLaunchUrl = useCallback((url: string | null) => {
    if (!mounted.current || !url) return;
    const shouldForceWorldCupWinnerFranceTicket = url.includes("forceWorldCupWinnerFranceTicket=1");
    const shouldForceClosedWorldCupWinnerFrance = url.includes("forceClosedWorldCupWinnerFrance=1");
    const shouldForceServerPortfolioFixture = url.includes("forceServerPortfolioFixture=1");
    const shouldForceServerPortfolioFallbackFixture = url.includes("forceServerPortfolioFallbackFixture=1");
    const shouldForceMexicoEcuadorGamePosition = url.includes("forceMexicoEcuadorGamePosition=1");
    const shouldForcePortfolio = url.includes("forcePortfolio=1");
    const shouldForceOpenOrder = url.includes("forceOpenOrder=1");
    const shouldForceLineOpenOrder = url.includes("forceLineOpenOrder=1");
    const shouldForceBookSnapshotDriftPortfolio = url.includes("forceBookSnapshotDriftPortfolio=1");
    const shouldForceNoLive = url.includes("forceNoLive=1");
    const shouldForcePortfolioSyncing = url.includes("forcePortfolioSyncing=1");
    const shouldForcePortfolioSyncError = url.includes("forcePortfolioSyncError=1");
    const shouldForceAccountProfileSyncError = url.includes("forceAccountProfileSyncError=1");
    const shouldForceMexicoEcuadorDetail = url.includes("forceMexicoEcuadorDetail=1");
    const forceBackendEventSlugMatch = url.match(/[?&,]forceBackendEventSlug=([^&,]+)/);
    const forcedOpenOrder = url.includes("forceOpenOrderSide=sell") ? SMOKE_OPEN_SELL_ORDER : SMOKE_OPEN_ORDER;
    const apiKeyMatch = url.match(/[?&,]apiKey=([^&,]+)/);
    const shouldForceRuntimePortfolioSync =
      url.includes("forceRuntimePortfolioSync=1") || (shouldForcePortfolio && Boolean(apiKeyMatch?.[1]));
    forceServerOrderProof.current = url.includes("forceServerOrderProof=1");
    forceServerOpenOrderProof.current = url.includes("forceServerOpenOrderProof=1");
    forceServerOrderSide.current = url.includes("forceServerOrderSide=sell") ? "sell" : "buy";
    forceServerCloseFixture.current = url.includes("forceServerCloseFixture=1");
    if (apiKeyMatch?.[1]) {
      setRuntimeApiKey(decodeURIComponent(apiKeyMatch[1]));
    }
    if (shouldForceRuntimePortfolioSync) {
      setForcedRuntimePortfolioSyncNonce((value) => value + 1);
    }
    if (url.includes("forceApiKeyDiagnostic=1")) {
      setApiKeyDiagnosticEnabled(true);
      setMainTab("portfolio");
    }
    setLaunchUrlVersion((value) => value + 1);
    const shouldForceLive = url.includes("forceLive=1");
    const shouldForceLiveDetail = url.includes("forceLiveDetail=1");
    setForceOrderFailure(url.includes("forceOrderFailure=1"));
    if (url.includes("forceResetState=1")) {
      skipPortfolioHydration.current = true;
      const resetRuntimeState = () => {
        if (!mounted.current) return;
        setBalance(10000);
        setPositions([]);
        setLatestOrder(null);
        setOpenOrders([]);
        setActivities([]);
        setTicket(null);
        setTicketOrderError(null);
        setTicketOrderErrorDetail(null);
        setSelectedEvent(null);
        setSelectedDepthMarketId(null);
        setQuery("");
        setMainTab("home");
        setWorldCupTab("games");
        setHomeFilter("all");
        setTicketDefaults({ amount: "100", side: "buy", slippage: "1%" });
        setSavedEventIds(new Set());
        setAccountProfileName("Holiwyn Demo");
        setForceAccountSignedIn(false);
        setPortfolioSyncStatus(ORDER_MODE === "server" ? "syncing" : "hidden");
        setProfilePreferencesSyncStatus(ORDER_MODE === "server" ? "syncing" : "hidden");
      };
      resetRuntimeState();
      if (
        !shouldForceWorldCupWinnerFranceTicket &&
        !shouldForceClosedWorldCupWinnerFrance &&
        !shouldForceServerPortfolioFixture &&
        !shouldForceServerPortfolioFallbackFixture &&
        !shouldForcePortfolio &&
        !shouldForceOpenOrder &&
        !shouldForceLineOpenOrder &&
        !shouldForceBookSnapshotDriftPortfolio &&
        !shouldForceNoLive &&
        !shouldForcePortfolioSyncing &&
        !shouldForcePortfolioSyncError &&
        !shouldForceAccountProfileSyncError &&
        !shouldForceMexicoEcuadorDetail &&
        !forceBackendEventSlugMatch?.[1] &&
        !forceServerOrderProof.current &&
        !shouldForceLive &&
        !shouldForceLiveDetail &&
        !shouldForceMexicoEcuadorGamePosition
      ) {
        setTimeout(resetRuntimeState, 750);
      }
      AsyncStorage.multiRemove([
        SAVED_EVENTS_STORAGE_KEY,
        PORTFOLIO_STORAGE_KEY,
        TICKET_DEFAULTS_STORAGE_KEY,
      ]).catch(() => undefined);
    }
    if (shouldForcePortfolio) {
      setMainTab("portfolio");
    }
    if (shouldForceLive) {
      setMainTab("live");
    }
    if (shouldForceLiveDetail) {
      const liveEvent = worldCupEvents.find((item) => item.status === "live");
      if (liveEvent) {
        setSelectedEvent(liveEvent);
      }
      setMainTab("live");
    }
    if (forceBackendEventSlugMatch?.[1]) {
      const slug = decodeURIComponent(forceBackendEventSlugMatch[1]);
      setMainTab("live");
      api.getEvent(slug)
        .then((detail) => normalizeEventDetail(detail))
        .then((event) => {
          if (!event || !mounted.current) return;
          setSelectedEvent(event);
        })
        .catch(() => undefined);
    }
    if (shouldForceNoLive) {
      setEvents(worldCupEvents.filter((item) => item.status !== "live"));
      setMainTab("live");
    }
    if (shouldForcePortfolioSyncing) {
      setBalance(10000);
      setPositions([]);
      setLatestOrder(null);
      setOpenOrders([]);
      setActivities([]);
      setPortfolioSyncStatus("syncing");
      setMainTab("portfolio");
    }
    if (shouldForcePortfolioSyncError) {
      setBalance(10000);
      setPositions([]);
      setLatestOrder(null);
      setOpenOrders([]);
      setActivities([]);
      setPortfolioSyncStatus("error");
      setMainTab("portfolio");
    }
    if (shouldForceWorldCupWinnerFranceTicket) {
      const market = worldCupFutures[0];
      const outcome = market.outcomes[0];
      setTicket({ market, outcome, side: "buy" });
    }
    if (shouldForceMexicoEcuadorDetail) {
      const event = worldCupEvents.find((item) => item.id === "mexico-ecuador");
      setEventDetailForcedSide(null);
      if (event) setSelectedEvent(event);
    }
    if (shouldForceMexicoEcuadorGamePosition) {
      const event = worldCupEvents.find((item) => item.id === "mexico-ecuador");
      const position = mexicoEcuadorGamePositionFixture();
      setBalance(10000);
      setPositions(position ? [position] : []);
      setLatestOrder(null);
      setOpenOrders([]);
      setActivities([]);
      setTicket(null);
      setEventDetailForcedSide("buy");
      if (event) setSelectedEvent(event);
    }
    if (url.includes("forceMexicoEcuadorDetailSellDefault=1")) {
      const defaults: TicketDefaults = { amount: "100", side: "sell", slippage: "1%" };
      setTicketDefaults(defaults);
      setEventDetailForcedSide("sell");
      AsyncStorage.setItem(TICKET_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults)).catch(() => undefined);
      const event = worldCupEvents.find((item) => item.id === "mexico-ecuador");
      if (event) setSelectedEvent(event);
    }
    if (url.includes("forceTicketDefaults=1")) {
      const defaults: TicketDefaults = { amount: "500", side: "sell", slippage: "1%" };
      setTicketDefaults(defaults);
      AsyncStorage.setItem(TICKET_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults)).catch(() => undefined);
      const market = worldCupFutures[0];
      const outcome = market.outcomes[0];
      setTicket({ market, outcome, side: "buy" });
    }
    if (shouldForceOpenOrder) {
      setBalance(10000);
      setPositions([]);
      setLatestOrder(null);
      setOpenOrders([forcedOpenOrder]);
      setActivities([]);
      setMainTab("portfolio");
      const snapshot: StoredPortfolio = {
        balance: 10000,
        positions: [],
        latestOrder: null,
        openOrders: [forcedOpenOrder],
        activities: [],
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
    }
    if (shouldForceLineOpenOrder) {
      setBalance(10000);
      setPositions([]);
      setLatestOrder(null);
      setOpenOrders([SMOKE_LINE_OPEN_ORDER]);
      setActivities([]);
      setMainTab("portfolio");
      const snapshot: StoredPortfolio = {
        balance: 10000,
        positions: [],
        latestOrder: null,
        openOrders: [SMOKE_LINE_OPEN_ORDER],
        activities: [],
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
    }
    if (shouldForceBookSnapshotDriftPortfolio) {
      const snapshot = bookSnapshotDurabilityPortfolio(t.justNow);
      setEvents(metadataDriftedWorldCupEvents());
      setBalance(snapshot.balance ?? 10000);
      setPositions(snapshot.positions ?? []);
      setLatestOrder(snapshot.latestOrder ?? null);
      setOpenOrders(snapshot.openOrders ?? []);
      setActivities(snapshot.activities ?? []);
      setPortfolioSyncStatus("hidden");
      setMainTab("portfolio");
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
    }
    if (shouldForceServerPortfolioFixture) {
      const fixture = serverHydratedPortfolioFixture();
      setBalance(fixture.balance);
      setPositions(fixture.positions);
      setLatestOrder(fixture.latestOrder);
      setOpenOrders(fixture.openOrders);
      setActivities(fixture.activities);
      setPortfolioSyncStatus("synced");
      setMainTab("portfolio");
      const snapshot: StoredPortfolio = {
        balance: fixture.balance,
        positions: fixture.positions,
        latestOrder: fixture.latestOrder,
        openOrders: fixture.openOrders,
        activities: fixture.activities,
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
    }
    if (shouldForceServerPortfolioFallbackFixture) {
      const fixture = serverBackendOnlyPortfolioFixture();
      setBalance(fixture.balance);
      setPositions(fixture.positions);
      setLatestOrder(fixture.latestOrder);
      setOpenOrders(fixture.openOrders);
      setActivities(fixture.activities);
      setPortfolioSyncStatus("synced");
      setMainTab("portfolio");
      const snapshot: StoredPortfolio = {
        balance: fixture.balance,
        positions: fixture.positions,
        latestOrder: fixture.latestOrder,
        openOrders: fixture.openOrders,
        activities: fixture.activities,
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
    }
    if (shouldForceClosedWorldCupWinnerFrance) {
      const closedActivity: PortfolioActivity = {
        id: "smoke-world-cup-winner-france-closed",
        action: "closed",
        title: "World Cup winner",
        outcome: "France",
        amount: 108.82,
        entryAmount: 100,
        side: "buy",
        probability: 34,
        timestamp: "Today 2:04 PM",
      };
      const boughtActivity: PortfolioActivity = {
        id: "smoke-world-cup-winner-france-opened",
        action: "opened",
        title: "World Cup winner",
        outcome: "France",
        amount: 100,
        side: "buy",
        probability: 34,
        timestamp: "Today 1:56 PM",
      };
      setBalance(10008.82);
      setPositions([]);
      setLatestOrder(null);
      setOpenOrders([]);
      setActivities([closedActivity, boughtActivity]);
      setMainTab("portfolio");
      const snapshot: StoredPortfolio = {
        balance: 10008.82,
        positions: [],
        latestOrder: null,
        openOrders: [],
        activities: [closedActivity, boughtActivity],
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
    }
    const forcedSearchQuery = url.match(/[?&]forceSearchQuery=([^&]+)/)?.[1];
    if (forcedSearchQuery) {
      setQuery(decodeURIComponent(forcedSearchQuery));
      setMainTab("search");
    }
    const forcedHomeQuery = url.match(/[?&]forceHomeQuery=([^&]+)/)?.[1];
    if (forcedHomeQuery) {
      setQuery(decodeURIComponent(forcedHomeQuery));
      setMainTab("home");
    }
    if (url.includes("forceAccount=1")) {
      setMainTab("account");
    }
    if (shouldForceAccountProfileSyncError) {
      setForceAccountSignedIn(false);
      setProfilePreferencesSyncStatus("error");
      setMainTab("account");
    }
    if (url.includes("forceAccountPreferences=1")) {
      const defaults: TicketDefaults = { amount: "500", side: "sell", slippage: "1%" };
      setTicketDefaults(defaults);
      AsyncStorage.setItem(TICKET_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults)).catch(() => undefined);
      setMainTab("account");
    }
    if (url.includes("forceAccountSignIn=1")) {
      setForceAccountSignedIn(true);
      setMainTab("account");
    }
    if (url.includes("forceChinese=1")) {
      setLocale("zh");
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "zh").catch(() => undefined);
    }
    if (url.includes("forceEnglish=1")) {
      setLocale("en");
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "en").catch(() => undefined);
    }
    if (url.includes("forceSearch=1")) {
      setMainTab("search");
    }
    const shouldForceSaveMexico = url.includes("forceSaveMexico=1");
    if (url.includes("forceClearSaved=1") && !shouldForceSaveMexico) {
      setSavedEventIds(new Set());
      AsyncStorage.removeItem(SAVED_EVENTS_STORAGE_KEY).catch(() => undefined);
    }
    if (shouldForceSaveMexico) {
      const seededSavedEvents = new Set(["mexico-ecuador"]);
      setSavedEventIds(seededSavedEvents);
      AsyncStorage.setItem(SAVED_EVENTS_STORAGE_KEY, JSON.stringify([...seededSavedEvents])).catch(() => undefined);
    }
    if (url.includes("forceAccountSavedSummary=1")) {
      const seededSavedEvents = new Set(["mexico-ecuador"]);
      setSavedEventIds(seededSavedEvents);
      AsyncStorage.setItem(SAVED_EVENTS_STORAGE_KEY, JSON.stringify([...seededSavedEvents])).catch(() => undefined);
      setMainTab("account");
    }
    if (url.includes("forceAccountPositionSummary=1")) {
      setPositions([
        {
          id: "smoke-account-position",
          mode: "mock",
          title: "World Cup winner",
          outcome: "France",
          side: "buy",
          amount: 250,
          probability: 24,
        },
      ]);
      setOpenOrders([SMOKE_OPEN_ORDER]);
      setMainTab("account");
    }
  }, [api]);

  useEffect(() => {
    if (!forceServerOrderProof.current || ORDER_MODE !== "server") return;
    const event = events.find(
      (item) =>
        !worldCupEvents.some((mockEvent) => mockEvent.id === item.id) &&
        item.markets.some((market) => market.outcomes.length > 0),
    );
    const market = event?.markets.find((item) => item.outcomes.length > 0);
    const outcome = market?.outcomes[0];
    if (!event || !market || !outcome) return;
    forceServerOrderProof.current = false;
    const ticketOutcome = forceServerOpenOrderProof.current
      ? { ...outcome, probability: SMOKE_OPEN_SERVER_ORDER_PRICE }
      : outcome;
    if (forceServerOpenOrderProof.current) {
      setTicketDefaults({ amount: SMOKE_OPEN_SERVER_ORDER_AMOUNT, side: "buy", slippage: "1%" });
    }
    setSelectedEvent(event);
    setTicket({ event, market, outcome: ticketOutcome, side: forceServerOrderSide.current });
  }, [events, launchUrlVersion]);

  useEffect(() => {
    Linking.getInitialURL().then(handleLaunchUrl);
    const subscription = Linking.addEventListener("url", (event) => handleLaunchUrl(event.url));
    return () => subscription.remove();
  }, [handleLaunchUrl]);

  useEffect(() => {
    if (!apiKeyDiagnosticEnabled) return;
    if (!runtimeApiKey) {
      setApiKeyDiagnostic("Launch API key missing");
      return;
    }
    const keyId = runtimeApiKey.split(".")[0] ?? "unknown";
    let cancelled = false;
    setApiKeyDiagnostic(`Launch API key received ${keyId}`);
    new PolyApi(DEFAULT_API_BASE, runtimeApiKey)
      .getPortfolio()
      .then((snapshot) => {
        if (cancelled || !mounted.current) return;
        const firstTitle = snapshot.positions[0]?.market?.title ?? "none";
        setApiKeyDiagnostic(`Runtime PolyApi key ${keyId}; positions ${snapshot.positions.length}; first ${firstTitle}`);
      })
      .catch((error) => {
        if (cancelled || !mounted.current) return;
        const message = error instanceof Error ? error.message : "unknown";
        setApiKeyDiagnostic(`Runtime PolyApi error ${keyId}; ${message}`);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKeyDiagnosticEnabled, runtimeApiKey]);

  const loadBackendWorldCup = useCallback(async (cursor: string | null = null, append = false) => {
    try {
      if (MARKET_DATA_MODE === "server" && homeFilter === "saved" && !homeSavedEventIds?.length) {
        if (mounted.current) {
          setEvents([]);
          setEventNextCursor(null);
        }
        return;
      }
      const payload = await api.listWorldCupEvents({ limit: HOME_EVENT_PAGE_SIZE, cursor, statusGroup: homeStatusGroup, eventIds: homeSavedEventIds });
      const nextCursor = payload.nextCursor ?? payload.page?.nextCursor ?? null;
      const summaryEvents = payload.events
        .map((event) => normalizeEventSummary(event, event.markets ?? []))
        .filter((event) => event.markets.length > 0);
      const details = await Promise.all(
        payload.events
          .filter((event) => !event.markets?.length)
          .slice(0, Math.max(0, 8 - summaryEvents.length))
          .map(async (event) => {
          try {
            return normalizeEventDetail(await api.getEvent(event.slug));
          } catch {
            return null;
          }
        }),
      );
      const normalized = [
        ...summaryEvents,
        ...details.filter((event): event is Event => Boolean(event)),
      ];
      if (mounted.current && normalized.length > 0) {
        if (ORDER_MODE !== "server") {
          setEvents((current) => append ? appendUniqueEvents(current, normalized) : normalized);
          setEventNextCursor(nextCursor);
          return;
        }
        const quotedEvents = await Promise.all(
          normalized.map(async (event) => {
            const quotesByMarketId = await loadMarketQuotesById(api, event.markets.map((market) => market.id));
            return applyTicketQuotesToEvent(event, quotesByMarketId);
          }),
        );
        if (mounted.current) {
          setEvents((current) => append ? appendUniqueEvents(current, quotedEvents) : quotedEvents);
          setEventNextCursor(nextCursor);
        }
      }
    } catch {
      if (mounted.current && !append) {
        setEvents(worldCupEvents);
        setEventNextCursor(null);
      }
    }
  }, [api, homeFilter, homeSavedEventIds, homeStatusGroup]);

  const loadMoreBackendEvents = useCallback(() => {
    if (MARKET_DATA_MODE !== "server" || !eventNextCursor || isLoadingMoreEvents) return;
    setIsLoadingMoreEvents(true);
    loadBackendWorldCup(eventNextCursor, true)
      .finally(() => {
        if (mounted.current) setIsLoadingMoreEvents(false);
      });
  }, [eventNextCursor, isLoadingMoreEvents, loadBackendWorldCup]);

  const loadBackendSearchEvents = useCallback(async (
    search: string,
    cursor: string | null = null,
    append = false,
    statusGroup: "live" | "upcoming" | null = null,
  ) => {
    try {
      if (searchSavedOnly && !searchSavedEventIds?.length) {
        if (mounted.current) {
          setSearchEvents([]);
          setSearchNextCursor(null);
          setSearchEventError(null);
        }
        return;
      }
      const payload = await api.listWorldCupEvents({ limit: SEARCH_EVENT_PAGE_SIZE, cursor, search, statusGroup, eventIds: searchSavedEventIds });
      const nextCursor = payload.nextCursor ?? payload.page?.nextCursor ?? null;
      const summaryEvents = payload.events
        .map((event) => normalizeEventSummary(event, event.markets ?? []))
        .filter((event) => event.markets.length > 0);
      const details = await Promise.all(
        payload.events
          .filter((event) => !event.markets?.length)
          .slice(0, Math.max(0, 8 - summaryEvents.length))
          .map(async (event) => {
          try {
            return normalizeEventDetail(await api.getEvent(event.slug));
          } catch {
            return null;
          }
        }),
      );
      const normalized = [
        ...summaryEvents,
        ...details.filter((event): event is Event => Boolean(event)),
      ];
      if (!mounted.current) return;
      if (ORDER_MODE !== "server") {
        setSearchEvents((current) => append ? appendUniqueEvents(current, normalized) : normalized);
        setSearchNextCursor(nextCursor);
        setSearchEventError(null);
        return;
      }
      const quotedEvents = await Promise.all(
        normalized.map(async (event) => {
          const quotesByMarketId = await loadMarketQuotesById(api, event.markets.map((market) => market.id));
          return applyTicketQuotesToEvent(event, quotesByMarketId);
        }),
      );
      if (!mounted.current) return;
      setSearchEvents((current) => append ? appendUniqueEvents(current, quotedEvents) : quotedEvents);
      setSearchNextCursor(nextCursor);
      setSearchEventError(null);
    } catch {
      if (!mounted.current) return;
      if (!append) {
        setSearchEvents([]);
        setSearchNextCursor(null);
      }
      setSearchEventError("Search is unavailable. Try again.");
    }
  }, [api, searchSavedEventIds, searchSavedOnly]);

  const loadMoreBackendSearchEvents = useCallback(() => {
    if (MARKET_DATA_MODE !== "server" || !searchNextCursor || isLoadingSearchEvents) return;
    setIsLoadingSearchEvents(true);
    loadBackendSearchEvents(query, searchNextCursor, true, searchStatusGroup)
      .finally(() => {
        if (mounted.current) setIsLoadingSearchEvents(false);
      });
  }, [isLoadingSearchEvents, loadBackendSearchEvents, query, searchNextCursor, searchStatusGroup]);

  useEffect(() => {
    loadBackendWorldCup();
  }, [loadBackendWorldCup]);

  useEffect(() => {
    if (MARKET_DATA_MODE !== "server" || mainTab !== "search") return undefined;
    let cancelled = false;
    setIsLoadingSearchEvents(true);
    loadBackendSearchEvents(query, null, false, searchStatusGroup)
      .finally(() => {
        if (!cancelled && mounted.current) setIsLoadingSearchEvents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadBackendSearchEvents, mainTab, query, searchSavedEventIds, searchStatusGroup]);

  useEffect(() => {
    if (ORDER_MODE !== "server") return undefined;
    let cancelled = false;
    const marketIds = futures.map((market) => market.id);
    loadMarketQuotesById(api, marketIds).then((quotesByMarketId) => {
      if (cancelled || !mounted.current) return;
      if (quotesByMarketId.size === 0) return;
      setFutures((current) => applyTicketQuotesToMarkets(current, quotesByMarketId));
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const applyServerState = useCallback((serverState: Awaited<ReturnType<typeof loadServerPortfolioState>>) => {
    setPortfolioSyncStatus(serverState.syncStatus);
    setBalance((current) =>
      applyServerPortfolioState({ balance: current, positions: [], openOrders: [], activities: [] }, serverState).balance,
    );
    setPositions((current) =>
      applyServerPortfolioState({ balance: 0, positions: current, openOrders: [], activities: [] }, serverState).positions,
    );
    setOpenOrders((current) =>
      applyServerPortfolioState({ balance: 0, positions: [], openOrders: current, activities: [] }, serverState).openOrders,
    );
    setActivities((current) =>
      applyServerPortfolioState({ balance: 0, positions: [], openOrders: [], activities: current }, serverState).activities,
    );
  }, []);

  const refreshServerPortfolio = useCallback(async () => {
    setPortfolioSyncStatus("syncing");
    const serverState = await loadServerPortfolioState(api);
    if (!mounted.current) return;
    applyServerState(serverState);
  }, [api, applyServerState]);

  useEffect(() => {
    if (ORDER_MODE !== "server" || runtimeApiKey.length === 0) return undefined;
    let cancelled = false;
    loadAccountBalance(api).then((accountBalance) => {
      if (!cancelled && mounted.current) setBalance(accountBalance.availableUSDC);
    }).catch(() => undefined);
    loadAccountProfile(api).then((profile) => {
      if (!cancelled && mounted.current) {
        setAccountProfileName(profile.displayName);
        setForceAccountSignedIn(true);
      }
    }).catch(() => undefined);
    setPortfolioSyncStatus("syncing");
    loadServerPortfolioState(api).then((serverState) => {
      if (!cancelled && mounted.current) applyServerState(serverState);
    }).catch(() => {
      if (!cancelled && mounted.current) setPortfolioSyncStatus("error");
    });
    return () => {
      cancelled = true;
    };
  }, [api, applyServerState, runtimeApiKey]);

  useEffect(() => {
    if (forcedRuntimePortfolioSyncNonce === 0 || ORDER_MODE !== "server" || runtimeApiKey.length === 0) return undefined;
    let cancelled = false;
    const runtimeApi = new PolyApi(DEFAULT_API_BASE, runtimeApiKey);
    setPortfolioSyncStatus("syncing");
    loadServerPortfolioState(runtimeApi).then((serverState) => {
      if (cancelled || !mounted.current) return;
      applyServerState(serverState);
    }).catch(() => {
      if (!cancelled && mounted.current) setPortfolioSyncStatus("error");
    });
    return () => {
      cancelled = true;
    };
  }, [applyServerState, forcedRuntimePortfolioSyncNonce, runtimeApiKey]);

  useEffect(() => {
    if (!selectedEvent) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedEvent(null);
      return true;
    });
    return () => subscription.remove();
  }, [selectedEvent]);

  useEffect(() => {
    setSelectedDepthMarketId(null);
  }, [selectedEvent?.id]);

  const refreshLiveMarkets = useCallback(async () => {
    setIsRefreshingLive(true);
    try {
      await loadBackendWorldCup();
      if (mounted.current) setLiveRefreshTick((tick) => tick + 1);
    } finally {
      if (mounted.current) setIsRefreshingLive(false);
    }
  }, [loadBackendWorldCup]);

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return events;
    return events.filter((event) =>
      [
        event.title,
        event.zhTitle,
        event.tag,
        event.zhTag,
        ...event.teams.flatMap((team) => [team.name, team.zhName]),
        ...event.markets.flatMap((market) => [
          market.title,
          market.zhTitle,
          ...market.outcomes.flatMap((outcome) => [outcome.label, outcome.zhLabel]),
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [events, query]);

  const openTicket = (market: Market, outcome: Outcome, event?: Event, side?: "buy" | "sell", selection?: TicketSelection) => {
    setTicketOrderError(null);
    setTicketOrderErrorDetail(null);
    setTicket({ market, outcome, event, side: side ?? ticketDefaults.side, contractSide: selection?.contractSide, selection });
  };

  useEffect(() => {
    if (ORDER_MODE !== "server" || !ticket) return undefined;
    if (forceServerOpenOrderProof.current) return undefined;
    if (typeof ticket.selection?.limitPrice === "number") return undefined;
    let cancelled = false;
    const marketId = ticket.market.id;
    const outcomeId = ticket.outcome.id;
    loadTicketQuotes(api, marketId, outcomeId)
      .then((quotes) => {
        if (cancelled || !mounted.current) return;
        setTicket((current) => {
          if (!current || current.market.id !== marketId || current.outcome.id !== outcomeId) return current;
          const quotedOutcome = applyTicketQuoteToOutcome(current.outcome, quotes);
          if (quotedOutcome === current.outcome) return current;
          return {
            ...current,
            outcome: quotedOutcome,
            market: {
              ...current.market,
              outcomes: current.market.outcomes.map((outcome) =>
                outcome.id === quotedOutcome.id ? quotedOutcome : outcome,
              ),
            },
          };
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, ticket?.market.id, ticket?.outcome.id]);

  useEffect(() => {
    if (MARKET_DATA_MODE !== "server" || !selectedEvent) return undefined;
    let cancelled = false;
    const eventId = selectedEvent.id;
    const marketIds = selectedEvent.markets.map((market) => market.id);
    loadMarketQuotesById(api, marketIds)
      .then((quotesByMarketId) => {
        if (cancelled || !mounted.current) return;
        setSelectedEvent((current) => {
          if (!current || current.id !== eventId) return current;
          let changed = false;
          const markets = current.markets.map((market) => {
            const quotes = quotesByMarketId.get(market.id);
            if (!quotes) return market;
            const quotedMarket = applyTicketQuotesToMarket(market, quotes);
            if (quotedMarket !== market) changed = true;
            return quotedMarket;
          });
          if (!changed) return current;
          return {
            ...current,
            markets,
          };
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, selectedEvent?.id]);

  useEffect(() => {
    if (MARKET_DATA_MODE !== "server" || !selectedEvent) return undefined;
    let cancelled = false;
    const eventId = selectedEvent.id;
    setSelectedEvent((current) => {
      if (!current || current.id !== eventId) return current;
      return applyMarketDepthLoadingToEvent(current, selectedDepthMarketId);
    });
    loadMarketDepthState(api, selectedEvent, selectedDepthMarketId)
      .then((depthState) => {
        if (cancelled || !mounted.current) return;
        setSelectedEvent((current) => {
          if (!current || current.id !== eventId) return current;
          return applyDepthStateToEvent(current, depthState);
        });
      })
      .catch(() => {
        if (cancelled || !mounted.current) return;
        setSelectedEvent((current) => {
          if (!current || current.id !== eventId) return current;
          return applyMarketDepthErrorToEvent(current, selectedDepthMarketId);
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, selectedEvent?.id, selectedDepthMarketId]);

  useEffect(() => {
    if (MARKET_DATA_MODE !== "server" || !selectedEvent) return undefined;
    let cancelled = false;
    const eventId = selectedEvent.id;
    setSelectedEvent((current) => {
      if (!current || current.id !== eventId) return current;
      return applyChartLoadingToEvent(current);
    });
    loadMarketChartState(api, selectedEvent)
      .then((chartState) => {
        if (cancelled || !mounted.current) return;
        setSelectedEvent((current) => {
          if (!current || current.id !== eventId) return current;
          return applyChartStateToEvent(current, chartState);
        });
      })
      .catch(() => {
        if (cancelled || !mounted.current) return;
        setSelectedEvent((current) => {
          if (!current || current.id !== eventId) return current;
          return applyChartErrorToEvent(current);
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, selectedEvent?.id]);

  const toggleSavedEvent = (event: Event) => {
    setSavedEventIds((current) => {
      const next = new Set(current);
      if (next.has(event.id)) {
        next.delete(event.id);
      } else {
        next.add(event.id);
      }
      return next;
    });
  };

  const placeOrder = async (amount: number, side: "buy" | "sell", contractSide?: Ticket["contractSide"]) => {
    if (!ticket || amount <= 0) return;
    const cost = Math.min(amount, balance);
    setTicketOrderError(null);
    setTicketOrderErrorDetail(null);
    let result;
    try {
      if (forceOrderFailure) {
        throw new Error("Forced order failure for mobile harness.");
      }
      result = await submitTicketOrder({
        mode: ORDER_MODE,
        api,
        event: ticket.event,
        market: ticket.market,
        outcome: ticket.outcome,
        selection: ticket.selection,
        contractSide: contractSide ?? ticket.contractSide,
        side,
        amount: cost,
      });
    } catch (error) {
      setTicketOrderError(t.orderFailed);
      const detail = error instanceof Error ? error.message.trim() : "";
      setTicketOrderErrorDetail(detail && detail !== t.orderFailed ? detail : null);
      return;
    }
    const isLiveOrder = ticket.event?.status === "live";
    const liveClock = isLiveOrder
      ? ticket.event?.startsAt.replace(/[^\x00-\x7F]+/g, "-").replace(/\s+-\s+/g, " - ")
      : undefined;
    const isBookSpreadLifecycle = isBookSpreadLifecycleSelection(result.selection);
    const orderShares = result.probability > 0 ? result.amount / (result.probability / 100) : result.amount;
    const bookOpenOrder: OpenOrder | null = isBookSpreadLifecycle
      ? {
          id: `${result.id}-book-open`,
          title: result.title,
          outcome: result.outcome,
          selection: result.selection,
          contractSide: result.contractSide,
          side: result.side,
          status: "OPEN",
          price: result.probability / 100,
          remaining: orderShares,
          originalShares: orderShares,
          remainingShares: orderShares,
          orderValue: result.amount,
          placedAt: t.justNow,
        }
      : null;
    if (ORDER_MODE !== "server") {
      setBalance((current) => current - cost);
      setPositions((current) => [
        {
          id: result.id,
          mode: result.mode,
          marketId: result.selection?.marketId ?? ticket.market.id,
          outcomeId: result.selection?.outcomeId ?? ticket.outcome.id,
          title: result.title,
          outcome: result.outcome,
          selection: result.selection,
          contractSide: result.contractSide,
          side: result.side,
          amount: result.amount,
          probability: result.probability,
          isLive: isLiveOrder,
          liveClock,
          timestamp: t.justNow,
        },
        ...current,
      ]);
    }
    setLatestOrder({
      id: result.id,
      mode: result.mode,
      title: result.title,
      outcome: result.outcome,
      selection: result.selection,
      contractSide: result.contractSide,
      side: result.side,
      amount: result.amount,
      probability: result.probability,
      status: isBookSpreadLifecycle ? "OPEN" : result.status,
      size: isBookSpreadLifecycle ? orderShares : result.size,
      filledSize: isBookSpreadLifecycle ? 0 : result.filledSize,
      remainingSize: isBookSpreadLifecycle ? orderShares : result.remainingSize,
      isLive: isLiveOrder,
      liveClock,
    });
    if (bookOpenOrder) {
      setOpenOrders((current) => [bookOpenOrder, ...current.filter((order) => order.id !== bookOpenOrder.id)]);
    }
    setActivities((current) => [
      {
        id: `${result.id}-opened`,
        action: result.side === "sell" ? "sold" : "opened",
        title: result.title,
        outcome: result.outcome,
        selection: result.selection,
        contractSide: result.contractSide,
        amount: result.amount,
        shares: result.filledSize ?? result.size,
        side: result.side,
        probability: result.probability,
        isLive: isLiveOrder,
        liveClock,
      },
      ...current,
    ]);
    setTicket(null);
    setTicketOrderError(null);
    setTicketOrderErrorDetail(null);
    setSelectedEvent(null);
    setMainTab("portfolio");
    if (ORDER_MODE === "server") {
      refreshServerPortfolio().catch(() => {
        if (mounted.current) setPortfolioSyncStatus("error");
      });
    }
  };

  const closePosition = async (position: Position) => {
    if (ORDER_MODE === "server" && forceServerCloseFixture.current) {
      const fixture = serverClosedPortfolioFixture(position);
      setBalance(fixture.balance);
      setPositions(fixture.positions);
      setLatestOrder(fixture.latestOrder);
      setOpenOrders(fixture.openOrders);
      setActivities(fixture.activities);
      setPortfolioSyncStatus("synced");
      const snapshot: StoredPortfolio = {
        balance: fixture.balance,
        positions: fixture.positions,
        latestOrder: fixture.latestOrder,
        openOrders: fixture.openOrders,
        activities: fixture.activities,
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
      return;
    }
    try {
      await closePositionOnServer({ mode: ORDER_MODE, api, position });
    } catch {
      if (mounted.current) setPortfolioSyncStatus("error");
      return;
    }
    if (ORDER_MODE === "server") {
      await refreshServerPortfolio().catch(() => {
        if (mounted.current) setPortfolioSyncStatus("error");
      });
      return;
    }
    const value = portfolioPositionValue(position);
    setBalance((current) => current + value);
    setPositions((current) => current.filter((item) => item.id !== position.id));
    setActivities((current) => [
      {
        id: `${position.id}-closed`,
        action: "closed",
        title: position.title,
        outcome: position.outcome,
        amount: value,
        entryAmount: position.amount,
        side: position.side,
        probability: position.probability,
        isLive: position.isLive,
        liveClock: position.liveClock,
        timestamp: t.justNow,
      },
      ...current,
    ]);
  };

  const openPositionTrade = (position: Position, side: "buy" | "sell") => {
    const target = resolvePositionTradeTarget({ position, futures, events });
    if (!target) {
      setPortfolioSyncStatus("error");
      return;
    }
    setSelectedEvent(target.event ?? null);
    setMainTab("portfolio");
    openTicket(target.market, target.outcome, target.event, side);
  };

  const openEventDetail = useCallback((event: Event) => {
    setEventDetailForcedSide(null);
    setSelectedEvent(event);
    if (MARKET_DATA_MODE !== "server") return;
    api.getEvent(event.id)
      .then((detail) => normalizeEventDetail(detail))
      .then((hydrated) => {
        if (!hydrated || !mounted.current) return;
        setSelectedEvent((current) => current?.id === event.id ? hydrated : current);
      })
      .catch(() => undefined);
  }, [api]);

  const cancelOpenOrder = (order: OpenOrder) => {
    setOpenOrders((current) => current.filter((item) => item.id !== order.id));
    const canceledActivity = openOrderCanceledActivity(order, t.justNow);
    setActivities((current) => appendUniqueActivity(current, canceledActivity));
    cancelOpenOrderOnServer({ mode: ORDER_MODE, api, order })
      .then(() => {
        if (ORDER_MODE === "server") {
          return refreshServerPortfolio().then(() => {
            if (mounted.current) {
              setActivities((current) => appendUniqueActivity(current, canceledActivity));
            }
          });
        }
        return undefined;
      })
      .catch(() => {
        if (mounted.current) setPortfolioSyncStatus("error");
      });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.shell}>
        {!selectedEvent && (
          <Header
            locale={locale}
            promo={t.promo}
            language={t.language}
            toggleLanguage={() => setLocale((current) => (current === "en" ? "zh" : "en"))}
            openAccount={() => setMainTab("account")}
          />
        )}
        {selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            locale={locale}
            t={t}
            openTicket={openTicket}
            defaultSide={eventDetailForcedSide ?? ticketDefaults.side}
            goBack={() => {
              setEventDetailForcedSide(null);
              setSelectedEvent(null);
            }}
            isSaved={savedEventIds.has(selectedEvent.id)}
            toggleSavedEvent={toggleSavedEvent}
            requestMarketDepth={setSelectedDepthMarketId}
            positions={positions}
            closePosition={closePosition}
            openPositionTrade={openPositionTrade}
          />
        ) : (
          <>
            {mainTab === "home" && (
              <HomeScreen
                locale={locale}
                t={t}
                worldCupTab={worldCupTab}
                setWorldCupTab={setWorldCupTab}
                events={filteredEvents}
                query={query}
                setQuery={setQuery}
                openEvent={openEventDetail}
                openTicket={openTicket}
                canLoadMoreEvents={MARKET_DATA_MODE === "server" ? Boolean(eventNextCursor) : undefined}
                isLoadingMoreEvents={isLoadingMoreEvents}
                loadMoreEvents={MARKET_DATA_MODE === "server" ? loadMoreBackendEvents : undefined}
                futures={futures}
                savedEventIds={savedEventIds}
                toggleSavedEvent={toggleSavedEvent}
                homeFilter={homeFilter}
                setHomeFilter={setHomeFilter}
                routeFiltered={MARKET_DATA_MODE === "server"}
              />
            )}
            {mainTab === "live" && (
              <LiveScreen
                locale={locale}
                t={t}
                events={events.filter((event) => event.status === "live")}
                isRefreshing={isRefreshingLive}
                refreshTick={liveRefreshTick}
                onRefresh={refreshLiveMarkets}
                openEvent={openEventDetail}
                openTicket={openTicket}
              />
            )}
            {mainTab === "portfolio" && (
              <>
                {apiKeyDiagnosticEnabled && (
                  <View accessibilityLabel="api-key-diagnostic" testID="api-key-diagnostic" style={styles.diagnosticCard}>
                    <Text style={styles.diagnosticText}>{apiKeyDiagnostic ?? "Launch API key diagnostic pending"}</Text>
                  </View>
                )}
                <Portfolio
                  locale={locale}
                  t={t}
                  balance={balance}
                  positions={positions}
                  latestOrder={latestOrder}
                  openOrders={openOrders}
                  activities={activities}
                  syncStatus={portfolioSyncStatus}
                  closePosition={closePosition}
                  openPositionTrade={openPositionTrade}
                  cancelOpenOrder={cancelOpenOrder}
                />
              </>
            )}
            {mainTab === "search" && (
              <SearchScreen
                locale={locale}
                t={t}
                query={query}
                setQuery={setQuery}
                events={MARKET_DATA_MODE === "server" ? searchEvents : filteredEvents}
                openEvent={openEventDetail}
                openTicket={openTicket}
                canLoadMoreEvents={MARKET_DATA_MODE === "server" ? Boolean(searchNextCursor) : undefined}
                isLoadingEvents={MARKET_DATA_MODE === "server" ? isLoadingSearchEvents : false}
                loadMoreEvents={MARKET_DATA_MODE === "server" ? loadMoreBackendSearchEvents : undefined}
                routeError={MARKET_DATA_MODE === "server" ? searchEventError : null}
                setServerStatusGroup={MARKET_DATA_MODE === "server" ? setSearchStatusGroup : undefined}
                setServerSavedOnly={MARKET_DATA_MODE === "server" ? setSearchSavedOnly : undefined}
                savedEventIds={savedEventIds}
                toggleSavedEvent={toggleSavedEvent}
              />
            )}
            {mainTab === "account" && (
              <AccountScreen
                t={t}
                balance={balance}
                forceSignedIn={forceAccountSignedIn}
                profileName={accountProfileName}
                languagePreferenceValue={locale === "en" ? "English" : "\u4e2d\u6587"}
                ticketDefaultAmount={ticketDefaults.amount}
                ticketDefaultSide={ticketDefaults.side}
                ticketDefaultSlippage={ticketDefaults.slippage}
                profileSyncStatus={profilePreferencesSyncStatus}
                savedMarketCount={savedEventIds.size}
                openPositionCount={positions.length}
                openOrderCount={openOrders.length}
                openOrderValue={accountOpenOrderValue}
                totalExposure={accountPortfolioValue + accountOpenOrderValue}
                portfolioValue={accountPortfolioValue}
                tradingMode={ORDER_MODE}
              />
            )}
          </>
        )}
        {!selectedEvent && <BottomTabs tab={mainTab} setTab={setMainTab} t={t} />}
      </View>
      <TradeTicket
        locale={locale}
        t={t}
        ticket={ticket}
        balance={balance}
        orderError={ticketOrderError}
        orderErrorDetail={ticketOrderErrorDetail}
        tradingMode={ORDER_MODE}
        defaultAmount={ticketDefaults.amount}
        defaultSide={ticketDefaults.side}
        defaultSlippage={ticketDefaults.slippage}
        onPreferencesChange={(next) => setTicketDefaults(next)}
        close={() => {
          setTicketOrderError(null);
          setTicketOrderErrorDetail(null);
          setTicket(null);
        }}
        placeOrder={placeOrder}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#070c14" },
  shell: { flex: 1, backgroundColor: "#070c14" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  logo: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#101827", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#263247" },
  logoMark: { color: "#f8fafc", fontWeight: "900", fontSize: 24 },
  headerMain: { flex: 1 },
  brand: { color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  subBrand: { color: "#8ea0b8", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  langButton: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  langText: { color: "#cbd5e1", fontWeight: "900" },
  promoButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: "#1d6dff" },
  promoText: { color: "#ffffff", fontWeight: "900" },
  bell: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  content: { flex: 1 },
  diagnosticCard: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#0f172a", borderBottomWidth: 1, borderBottomColor: "#263247" },
  diagnosticText: { color: "#93c5fd", fontSize: 13, fontWeight: "800" },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  sportRow: { gap: 16, paddingVertical: 8 },
  sportItem: { alignItems: "center", gap: 6, opacity: 0.66 },
  sportItemActive: { opacity: 1 },
  sportIcon: { fontSize: 34 },
  sportLabel: { color: "#8ea0b8", fontSize: 14, fontWeight: "800" },
  sportLabelActive: { color: "#f8fafc" },
  featureCard: { marginTop: 14, padding: 18, borderRadius: 16, backgroundColor: "#15365f", borderWidth: 1, borderColor: "#2a5f9f" },
  featureHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  featureTitle: { color: "#f8fafc", fontSize: 28, fontWeight: "900", letterSpacing: 0 },
  featureBadge: { fontSize: 38 },
  futureOutcomes: { flexDirection: "row", gap: 10, marginTop: 26 },
  futureOutcome: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.1)" },
  futureName: { color: "#f8fafc", fontWeight: "800" },
  futureProb: { color: "#c7d2fe", fontSize: 20, fontWeight: "900", marginTop: 4 },
  sectionTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 14 },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  segmented: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#263247", marginBottom: 10 },
  segment: { flex: 1, alignItems: "center", paddingVertical: 14 },
  segmentActive: { borderBottomWidth: 3, borderBottomColor: "#f8fafc" },
  segmentText: { color: "#8ea0b8", fontSize: 18, fontWeight: "800" },
  segmentTextActive: { color: "#f8fafc" },
  eventList: { gap: 12 },
  eventCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  eventMetaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  timeText: { color: "#94a3b8", fontWeight: "800" },
  eventTag: { color: "#94a3b8", fontWeight: "800" },
  liveTag: { color: "#ff4d4f" },
  eventTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9 },
  teamName: { flex: 1, color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  oddsText: { color: "#a7b1c2", width: 48, textAlign: "right", fontSize: 17, fontWeight: "800" },
  probButton: { minWidth: 86, alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  empty: { color: "#94a3b8", textAlign: "center", marginTop: 30, fontWeight: "800" },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 8, paddingRight: 12 },
  backText: { color: "#f8fafc", fontWeight: "900" },
  detailHero: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 4 },
  detailMeta: { color: "#94a3b8", fontWeight: "800", marginBottom: 8 },
  detailTitle: { color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  marketBlock: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 12 },
  marketTitle: { color: "#f8fafc", fontSize: 19, fontWeight: "900", marginBottom: 8 },
  detailOutcome: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  balanceCard: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 10 },
  balanceLabel: { color: "#94a3b8", fontWeight: "800" },
  balanceValue: { color: "#f8fafc", fontSize: 34, fontWeight: "900", marginTop: 6 },
  emptyCard: { alignItems: "center", padding: 28, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 16 },
  emptyTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#94a3b8", textAlign: "center", marginTop: 6, fontWeight: "700" },
  positionCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  positionTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  positionMeta: { color: "#94a3b8", marginTop: 5, fontWeight: "800" },
  positionValue: { color: "#22c55e", fontSize: 22, fontWeight: "900", marginTop: 8 },
  tabs: { height: 74, flexDirection: "row", backgroundColor: "#080d16", borderTopWidth: 1, borderTopColor: "#1f2937" },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabText: { color: "#64748b", fontWeight: "800", fontSize: 12 },
  tabTextActive: { color: "#1d6dff" },
  modalShade: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  ticket: { padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  ticketTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  ticketTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900" },
  ticketSub: { color: "#94a3b8", fontWeight: "800", marginTop: 4 },
  closeButton: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937" },
  ticketSideRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  sideButton: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: "#1f2937" },
  sideButtonActive: { backgroundColor: "#1d6dff" },
  sideText: { color: "#94a3b8", fontWeight: "900" },
  sideTextActive: { color: "#ffffff" },
  inputLabel: { color: "#94a3b8", fontWeight: "800", marginTop: 18, marginBottom: 8 },
  amountInput: { height: 54, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#070c14", borderWidth: 1, borderColor: "#263247", color: "#f8fafc", fontSize: 22, fontWeight: "900" },
  estimateLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#263247" },
  estimateLabel: { color: "#94a3b8", fontWeight: "800" },
  estimateValue: { color: "#f8fafc", fontWeight: "900" },
  primaryButton: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#1d6dff", marginTop: 16 },
  primaryText: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
});
