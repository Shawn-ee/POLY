import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { money } from "../presentation/formatters";
import type { AccountNavigationItemResult } from "../services/accountNavigationService";

const ACCOUNT_SESSION_STORAGE_KEY = "holiwyn.accountSignedIn.v1";

type AccountCopy = {
  account: string;
  accountStatus: string;
  accountId: string;
  accountTier: string;
  signedOut: string;
  signedIn: string;
  signIn: string;
  signOut: string;
  signInBody: string;
  signedInBody: string;
  demoBalance: string;
  demoBalanceBody: string;
  buy: string;
  sell: string;
  loginMethodPhone: string;
  loginMethodEmail: string;
  loginConnected: string;
  loginUnavailable: string;
  preferences: string;
  languagePreference: string;
  ticketDefaultPreference: string;
  slippage: string;
  savedMarketsPreference: string;
  savedMarketsCount: string;
  openPositions: string;
  openOrders: string;
  portfolioValue: string;
  openOrderValue: string;
  totalExposure: string;
  tradingMode: string;
  tradingModeMock: string;
  tradingModeServer: string;
  profileSyncing: string;
  profileSynced: string;
  profileSyncError: string;
  profileSyncFallback: string;
  accountDataSyncing: string;
  accountDataSynced: string;
  accountDataSyncError: string;
  accountDataSyncFallback: string;
  security: string;
  mockOnly: string;
};

type ProfileSyncStatus = "hidden" | "syncing" | "synced" | "error";
type AccountDataStatus = "hidden" | "syncing" | "synced" | "error";

export function AccountScreen({
  t,
  balance,
  forceSignedIn,
  profileName,
  languagePreferenceValue,
  ticketDefaultAmount,
  ticketDefaultSide,
  ticketDefaultSlippage,
  profileSyncStatus,
  savedMarketCount,
  openPositionCount,
  openOrderCount,
  openOrderValue,
  totalExposure,
  portfolioValue,
  tradingMode,
  menuItems,
  menuSource,
  accountDataStatus,
}: {
  t: AccountCopy;
  balance: number;
  forceSignedIn?: boolean;
  profileName?: string;
  languagePreferenceValue: string;
  ticketDefaultAmount: string;
  ticketDefaultSide: "buy" | "sell";
  ticketDefaultSlippage: string;
  profileSyncStatus: ProfileSyncStatus;
  savedMarketCount: number;
  openPositionCount: number;
  openOrderCount: number;
  openOrderValue: number;
  totalExposure: number;
  portfolioValue: number;
  tradingMode: "mock" | "server";
  menuItems: AccountNavigationItemResult[];
  menuSource: string;
  accountDataStatus: AccountDataStatus;
}) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY)
      .then((stored) => {
        if (mounted && stored !== null) setSignedIn(stored === "true");
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (forceSignedIn) updateSignedIn(true);
  }, [forceSignedIn]);

  const updateSignedIn = (nextSignedIn: boolean) => {
    setSignedIn(nextSignedIn);
    AsyncStorage.setItem(ACCOUNT_SESSION_STORAGE_KEY, nextSignedIn ? "true" : "false").catch(() => undefined);
  };

  const profileSyncCopy =
    profileSyncStatus === "syncing"
      ? t.profileSyncing
      : profileSyncStatus === "synced"
        ? t.profileSynced
        : profileSyncStatus === "error"
          ? t.profileSyncError
          : "";
  const accountDataCopy =
    accountDataStatus === "syncing"
      ? t.accountDataSyncing
      : accountDataStatus === "synced"
        ? t.accountDataSynced
        : accountDataStatus === "error"
          ? t.accountDataSyncError
          : "";
  const iconColors: Record<string, string> = {
    leaderboard: "#fbbf24",
    rewards: "#22c55e",
    apis: "#ec4899",
    accuracy: "#93c5fd",
    status: "#93c5fd",
    documentation: "#93c5fd",
    "help-center": "#93c5fd",
    terms: "#93c5fd",
  };

  return (
    <ScrollView accessibilityLabel="account-screen" testID="account-screen" style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name={signedIn ? "checkmark" : "person-outline"} size={30} color="#dbeafe" />
        </View>
        <View style={styles.heroMain}>
          <Text style={styles.eyebrow}>{t.accountStatus}</Text>
          <Text style={styles.title}>{signedIn ? t.signedIn : t.signedOut}</Text>
          <Text style={styles.body}>{signedIn ? t.signedInBody : t.signInBody}</Text>
        </View>
      </View>

      {signedIn && (
        <View accessibilityLabel="account-profile-card" testID="account-profile-card" style={styles.profileCard}>
          <View>
            <Text style={styles.cardLabel}>{t.accountId}</Text>
            <Text style={styles.profileName}>{profileName ?? "Holiwyn Demo"}</Text>
          </View>
          <Text style={styles.tier}>{t.accountTier}</Text>
        </View>
      )}

      <View accessibilityLabel="account-more-menu" testID="account-more-menu" style={styles.moreMenu}>
        {menuItems.map((item) => (
          <Pressable
            accessibilityLabel={`account-menu-${item.id} status-${item.status} ${item.enabled ? "enabled" : "disabled"} source-${menuSource}`}
            disabled={!item.enabled}
            key={item.id}
            style={[styles.menuRow, !item.enabled && styles.menuRowDisabled]}
            testID={`account-menu-${item.id}`}
          >
            <Ionicons name={item.icon as ComponentProps<typeof Ionicons>["name"]} size={23} color={iconColors[item.id] ?? "#93c5fd"} />
            <Text style={styles.menuText}>{item.label}</Text>
            {!item.enabled && <Text style={styles.menuStatus}>Soon</Text>}
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </Pressable>
        ))}
        <View accessibilityLabel="account-language-row" testID="account-language-row" style={styles.menuRow}>
          <Ionicons name="language-outline" size={23} color="#fbbf24" />
          <Text style={styles.menuText}>{t.languagePreference}</Text>
          <Text style={styles.menuValue}>{languagePreferenceValue}</Text>
        </View>
        <View accessibilityLabel="account-theme-row" testID="account-theme-row" style={styles.menuRow}>
          <Ionicons name="sunny-outline" size={23} color="#f8fafc" />
          <Text style={styles.menuText}>Theme</Text>
          <Text style={styles.menuValue}>Dark</Text>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.cardLabel}>{t.demoBalance}</Text>
          <Text style={styles.balanceValue}>{money(balance)}</Text>
        </View>
        <Ionicons name="wallet-outline" size={28} color="#93c5fd" />
      </View>
      <Text style={styles.helper}>{t.demoBalanceBody}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.preferences}</Text>
        {accountDataStatus !== "hidden" && (
          <View accessibilityLabel={`account-data-sync status-${accountDataStatus} source-${menuSource}`} testID="account-data-sync" style={styles.row}>
            <Ionicons name={accountDataStatus === "error" ? "cloud-offline-outline" : "cloud-done-outline"} size={20} color={accountDataStatus === "error" ? "#fbbf24" : "#93c5fd"} />
            <Text style={styles.rowText}>{accountDataCopy}</Text>
          </View>
        )}
        {accountDataStatus === "error" && <Text style={styles.syncFallback}>{t.accountDataSyncFallback}</Text>}
        {profileSyncStatus !== "hidden" && (
          <View accessibilityLabel="account-profile-sync" testID="account-profile-sync" style={styles.row}>
            <Ionicons name={profileSyncStatus === "error" ? "cloud-offline-outline" : "cloud-done-outline"} size={20} color={profileSyncStatus === "error" ? "#fbbf24" : "#93c5fd"} />
            <Text style={styles.rowText}>{profileSyncCopy}</Text>
          </View>
        )}
        {profileSyncStatus === "error" && <Text style={styles.syncFallback}>{t.profileSyncFallback}</Text>}
        <View style={styles.row}>
          <Ionicons name="language-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.languagePreference}: {languagePreferenceValue}
          </Text>
        </View>
        <View accessibilityLabel="account-saved-markets" testID="account-saved-markets" style={styles.row}>
          <Ionicons name="star-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.savedMarketsPreference}: {savedMarketCount} {t.savedMarketsCount}
          </Text>
        </View>
        <View accessibilityLabel="account-portfolio-value" testID="account-portfolio-value" style={styles.row}>
          <Ionicons name="analytics-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.portfolioValue}: {money(portfolioValue)}
          </Text>
        </View>
        <View accessibilityLabel="account-open-positions" testID="account-open-positions" style={styles.row}>
          <Ionicons name="podium-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.openPositions}: {openPositionCount}
          </Text>
        </View>
        <View accessibilityLabel="account-open-orders" testID="account-open-orders" style={styles.row}>
          <Ionicons name="receipt-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.openOrders}: {openOrderCount}
          </Text>
        </View>
        <View accessibilityLabel="account-open-order-value" testID="account-open-order-value" style={styles.row}>
          <Ionicons name="cash-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.openOrderValue}: {money(openOrderValue)}
          </Text>
        </View>
        <View accessibilityLabel="account-total-exposure" testID="account-total-exposure" style={styles.row}>
          <Ionicons name="speedometer-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.totalExposure}: {money(totalExposure)}
          </Text>
        </View>
        <View accessibilityLabel="account-ticket-defaults" testID="account-ticket-defaults" style={styles.row}>
          <Ionicons name="swap-horizontal-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>
            {t.ticketDefaultPreference}: {ticketDefaultSide === "buy" ? t.buy : t.sell} {ticketDefaultAmount} USDT - {t.slippage} {ticketDefaultSlippage}
          </Text>
        </View>
        <View accessibilityLabel="account-trading-mode" testID="account-trading-mode" style={styles.row}>
          <Ionicons name="server-outline" size={20} color={tradingMode === "server" ? "#22c55e" : "#fbbf24"} />
          <Text style={styles.rowText}>
            {t.tradingMode}: {tradingMode === "server" ? t.tradingModeServer : t.tradingModeMock}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#93c5fd" />
          <Text style={styles.rowText}>{t.security}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="flask-outline" size={20} color="#fbbf24" />
          <Text style={styles.rowText}>{t.mockOnly}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {signedIn ? (
          <Pressable accessibilityLabel="account-sign-out" testID="account-sign-out" style={styles.secondaryButton} onPress={() => updateSignedIn(false)}>
            <Ionicons name="log-out-outline" size={20} color="#dbeafe" />
            <Text style={styles.secondaryText}>{t.signOut}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable accessibilityLabel="account-login-phone" testID="account-login-phone" style={styles.secondaryButton} onPress={() => updateSignedIn(true)}>
              <Ionicons name="log-in-outline" size={20} color="#dbeafe" />
              <Text style={styles.secondaryText}>Log In</Text>
            </Pressable>
            <Pressable accessibilityLabel="account-login-email" testID="account-login-email" style={styles.primaryButton} onPress={() => updateSignedIn(true)}>
              <Ionicons name="person-add-outline" size={20} color="#ffffff" />
              <Text style={styles.primaryText}>Sign Up</Text>
            </Pressable>
          </>
        )}
      </View>
      <Text accessibilityLabel="account-login-unavailable" testID="account-login-unavailable" style={styles.notice}>
        {signedIn ? t.loginConnected : t.loginUnavailable}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  hero: { flexDirection: "row", gap: 14, padding: 16, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  avatar: { width: 54, height: 54, borderRadius: 14, backgroundColor: "#1d6dff", alignItems: "center", justifyContent: "center" },
  heroMain: { flex: 1 },
  eyebrow: { color: "#93c5fd", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#f8fafc", fontSize: 25, fontWeight: "900", marginTop: 4 },
  body: { color: "#94a3b8", fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 8 },
  profileCard: { marginTop: 14, padding: 16, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profileName: { color: "#f8fafc", fontSize: 22, fontWeight: "900", marginTop: 5 },
  tier: { color: "#22c55e", fontWeight: "900" },
  moreMenu: { marginTop: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  menuRow: { minHeight: 54, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  menuText: { flex: 1, color: "#e5e7eb", fontSize: 17, fontWeight: "900" },
  menuRowDisabled: { opacity: 0.62 },
  menuStatus: { color: "#64748b", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  menuValue: { color: "#94a3b8", fontSize: 15, fontWeight: "900" },
  balanceCard: { marginTop: 14, padding: 16, borderRadius: 14, backgroundColor: "#0f1f35", borderWidth: 1, borderColor: "#28456b", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabel: { color: "#93c5fd", fontWeight: "900" },
  balanceValue: { color: "#f8fafc", fontSize: 30, fontWeight: "900", marginTop: 5 },
  helper: { color: "#94a3b8", fontWeight: "700", marginTop: 8, lineHeight: 19 },
  actions: { gap: 10, marginTop: 18 },
  primaryButton: { height: 54, borderRadius: 12, backgroundColor: "#1d6dff", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryText: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  secondaryButton: { height: 54, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryText: { color: "#dbeafe", fontSize: 16, fontWeight: "900" },
  notice: { color: "#fbbf24", fontWeight: "800", marginTop: 10, lineHeight: 19 },
  section: { marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  sectionTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginBottom: 10 },
  row: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
  rowText: { flex: 1, color: "#cbd5e1", fontWeight: "800" },
  syncFallback: { color: "#94a3b8", fontWeight: "700", lineHeight: 19, marginTop: -2, marginBottom: 8, paddingLeft: 30 },
});
