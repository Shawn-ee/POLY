import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { MarketList } from "./MarketLists";

type LiveScreenCopy = {
  liveNow: string;
  liveUpdated: string;
  refreshLive: string;
  noLive: string;
  marketCount: string;
  outcomeCount: string;
};

export function LiveScreen({
  locale,
  t,
  events,
  isRefreshing,
  isLoadingMoreEvents = false,
  refreshTick,
  onRefresh,
  canLoadMoreEvents,
  loadMoreEvents,
  openEvent,
  openTicket,
}: {
  locale: Locale;
  t: LiveScreenCopy;
  events: Event[];
  isRefreshing: boolean;
  isLoadingMoreEvents?: boolean;
  refreshTick: number;
  onRefresh: () => void;
  canLoadMoreEvents?: boolean;
  loadMoreEvents?: () => void;
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
}) {
  const liveMarketCount = events.reduce((total, event) => total + event.markets.length, 0);
  const liveOutcomeCount = events.reduce(
    (total, event) => total + event.markets.reduce((marketTotal, market) => marketTotal + market.outcomes.length, 0),
    0,
  );
  const canLoadMore = Boolean(canLoadMoreEvents && loadMoreEvents);
  const loadMoreLiveEvents = () => {
    if (!canLoadMore || isLoadingMoreEvents) return;
    loadMoreEvents?.();
  };

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View style={styles.liveHeader}>
        <Text style={styles.sectionTitle}>{t.liveNow}</Text>
        <Text style={styles.liveCount}>{events.length}</Text>
      </View>
      <View style={styles.liveStatusRow}>
        <Text style={styles.liveStatusText}>{refreshTick === 0 ? t.liveUpdated : `${t.liveUpdated} - refreshed`}</Text>
        <Pressable
          accessibilityLabel="refresh-live-markets"
          disabled={isRefreshing}
          onPress={onRefresh}
          style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
          testID="refresh-live-markets"
        >
          <Ionicons name="refresh" color="#dbeafe" size={16} />
          <Text style={styles.refreshText}>{t.refreshLive}</Text>
        </Pressable>
      </View>
      <View accessibilityLabel="live-market-summary" style={styles.summaryRow} testID="live-market-summary">
        <View style={styles.summaryPill}>
          <Ionicons name="layers-outline" color="#93c5fd" size={16} />
          <Text style={styles.summaryText}>
            {liveMarketCount} {t.marketCount}
          </Text>
        </View>
        <View style={styles.summaryPill}>
          <Ionicons name="git-branch-outline" color="#93c5fd" size={16} />
          <Text style={styles.summaryText}>
            {liveOutcomeCount} {t.outcomeCount}
          </Text>
        </View>
      </View>
      <MarketList locale={locale} events={events} empty={t.noLive} openEvent={openEvent} openTicket={openTicket} />
      {canLoadMore && (
        <Pressable
          accessibilityLabel="load-more-live-markets"
          disabled={isLoadingMoreEvents}
          onPress={loadMoreLiveEvents}
          style={[styles.loadMoreButton, isLoadingMoreEvents && styles.loadMoreButtonDisabled]}
          testID="load-more-live-markets"
        >
          <Text style={styles.loadMoreText}>
            {isLoadingMoreEvents ? (locale === "zh" ? "加载中" : "Loading") : (locale === "zh" ? "加载更多直播" : "Load 10 more")}
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
  liveHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveCount: { minWidth: 34, textAlign: "center", color: "#ffffff", fontWeight: "900", backgroundColor: "#ef4444", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  liveStatusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  liveStatusText: { color: "#8ea0b8", fontWeight: "800" },
  refreshButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#1f2937" },
  refreshButtonDisabled: { opacity: 0.7 },
  refreshText: { color: "#dbeafe", fontWeight: "900" },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  summaryPill: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  summaryText: { color: "#dbeafe", fontSize: 13, fontWeight: "900" },
  loadMoreButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 12, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  loadMoreButtonDisabled: { opacity: 0.7 },
  loadMoreText: { color: "#dbeafe", fontSize: 15, fontWeight: "900" },
});
