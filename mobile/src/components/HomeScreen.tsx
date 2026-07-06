import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { FeaturedFuture } from "./FeaturedFuture";
import { FutureList, MarketList } from "./MarketLists";
import { SportNav } from "./SportNav";
import { WorldCupSegmented, WorldCupTab } from "./WorldCupSegmented";

type HomeFilter = "all" | "live" | "today" | "saved";

type HomeScreenCopy = {
  games: string;
  futures: string;
  trending: string;
  marketSearch: string;
  clearSearch: string;
  noResults: string;
  searchAll: string;
  searchLive: string;
  today: string;
  saved: string;
  volume: string;
  liquidity: string;
  noSavedMarkets: string;
};

export function HomeScreen({
  locale,
  t,
  worldCupTab,
  setWorldCupTab,
  events,
  query,
  setQuery,
  openEvent,
  openTicket,
  canLoadMoreEvents,
  isLoadingMoreEvents = false,
  loadMoreEvents,
  futures,
  savedEventIds,
  toggleSavedEvent,
  homeFilter,
  setHomeFilter,
  routeFiltered = false,
}: {
  locale: Locale;
  t: HomeScreenCopy;
  worldCupTab: WorldCupTab;
  setWorldCupTab: (tab: WorldCupTab) => void;
  events: Event[];
  query: string;
  setQuery: (query: string) => void;
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
  canLoadMoreEvents?: boolean;
  isLoadingMoreEvents?: boolean;
  loadMoreEvents?: () => void;
  futures: Market[];
  savedEventIds: Set<string>;
  toggleSavedEvent: (event: Event) => void;
  homeFilter?: HomeFilter;
  setHomeFilter?: (filter: HomeFilter) => void;
  routeFiltered?: boolean;
}) {
  const [localHomeFilter, setLocalHomeFilter] = useState<HomeFilter>("all");
  const activeHomeFilter = homeFilter ?? localHomeFilter;
  const updateHomeFilter = (filter: HomeFilter) => {
    setHomeFilter?.(filter);
    if (!setHomeFilter) setLocalHomeFilter(filter);
  };
  const homeFilters: Array<[HomeFilter, string]> = [
    ["all", t.searchAll],
    ["live", t.searchLive],
    ["today", t.today],
    ["saved", t.saved],
  ];
  const visibleEvents = useMemo(
    () =>
      routeFiltered && (activeHomeFilter === "live" || activeHomeFilter === "today" || activeHomeFilter === "saved")
        ? events
        : activeHomeFilter === "live"
        ? events.filter((event) => event.status === "live")
        : activeHomeFilter === "today"
          ? events.filter((event) => event.status === "today")
          : activeHomeFilter === "saved"
            ? events.filter((event) => savedEventIds.has(event.id))
          : events,
    [events, activeHomeFilter, routeFiltered, savedEventIds],
  );
  const emptyCopy = activeHomeFilter === "saved" ? t.noSavedMarkets : t.noResults;
  const canLoadMore = Boolean(canLoadMoreEvents && loadMoreEvents);
  const loadMoreMatches = () => {
    if (!canLoadMore || isLoadingMoreEvents) return;
    loadMoreEvents?.();
  };

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
      <SportNav locale={locale} />
      <FeaturedFuture locale={locale} futures={futures} openTicket={openTicket} />
      <Text style={styles.sectionTitle}>{t.trending}</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" color="#94a3b8" size={20} />
        <TextInput
          onChangeText={setQuery}
          placeholder={t.marketSearch}
          placeholderTextColor="#64748b"
          style={styles.searchInput}
          value={query}
        />
        {query.trim().length > 0 && (
          <Pressable accessibilityLabel={t.clearSearch} testID="home-clear-search" onPress={() => setQuery("")} style={styles.clearButton}>
            <Ionicons name="close-circle" color="#bfdbfe" size={18} />
          </Pressable>
        )}
      </View>
      <View style={styles.filterRow}>
        {homeFilters.map(([value, text]) => (
          <Pressable
            key={value}
            accessibilityLabel={`home-filter-${value}`}
            testID={`home-filter-${value}`}
            style={[styles.filterChip, activeHomeFilter === value && styles.filterChipActive]}
            onPress={() => updateHomeFilter(value)}
          >
            <Text style={[styles.filterText, activeHomeFilter === value && styles.filterTextActive]}>{text}</Text>
          </Pressable>
        ))}
      </View>
      {activeHomeFilter === "saved" && visibleEvents.length === 0 && (
        <Text accessibilityLabel="home-saved-empty" testID="home-saved-empty" style={styles.savedEmptyText}>
          {t.noSavedMarkets}
        </Text>
      )}
      <WorldCupSegmented left={t.games} right={t.futures} value={worldCupTab} setValue={setWorldCupTab} />
      {worldCupTab === "games" ? (
        activeHomeFilter === "saved" && visibleEvents.length === 0 ? null : (
          <MarketList
            locale={locale}
            events={visibleEvents}
            empty={emptyCopy}
            openEvent={openEvent}
            openTicket={openTicket}
            savedEventIds={savedEventIds}
            toggleSavedEvent={toggleSavedEvent}
            statsCopy={{ volume: t.volume, liquidity: t.liquidity }}
          />
        )
      ) : (
        <FutureList locale={locale} futures={futures} openTicket={openTicket} statsCopy={{ volume: t.volume, liquidity: t.liquidity }} />
      )}
      {worldCupTab === "games" && canLoadMore && (
        <Pressable
          accessibilityLabel={`home-load-more-matches visible-${visibleEvents.length}-next-10`}
          onPress={loadMoreMatches}
          style={styles.loadMoreButton}
          testID="home-load-more-matches"
        >
          <Text style={styles.loadMoreText}>
            {isLoadingMoreEvents ? (locale === "zh" ? "\u52a0\u8f7d\u4e2d" : "Loading") : (locale === "zh" ? "\u52a0\u8f7d\u66f4\u591a\u6bd4\u8d5b" : "Load 10 more")}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  sectionTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 14 },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  clearButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#1f2937" },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  filterChipActive: { backgroundColor: "#1d6dff", borderColor: "#1d6dff" },
  filterText: { color: "#8ea0b8", fontWeight: "900" },
  filterTextActive: { color: "#ffffff" },
  loadMoreButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 12, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  loadMoreText: { color: "#dbeafe", fontSize: 15, fontWeight: "900" },
  savedEmptyText: { color: "#94a3b8", fontWeight: "900", textAlign: "center", marginTop: 2, marginBottom: 14 },
});
