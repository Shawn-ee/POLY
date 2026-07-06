import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { activityPnl, activityShares, decimalOdds } from "../domain/portfolioActivityMetrics";
import {
  estimatedPositionPnl,
  portfolioPositionValue,
} from "../domain/portfolioPositionMetrics";
import type { Locale } from "../mocks/worldCup";
import { money } from "../presentation/formatters";
import {
  openOrderPotentialCopyKey,
  openOrderPotentialValue,
  openOrderRemainingShares,
  openOrderValue,
} from "../services/openOrderEconomicsService";
import type { OrderMode } from "../services/orderService";
import { canCashOutPosition, cashOutEstimate } from "../services/positionCloseService";
import type { BinaryContractSide, TicketSelection } from "./TradeTicket";
import type { PortfolioValueHistory } from "../types";

export type Position = {
  id: string;
  mode: OrderMode;
  marketId?: string;
  outcomeId?: string;
  title: string;
  outcome: string;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  side: "buy" | "sell";
  amount: number;
  probability: number;
  shares?: number;
  currentPrice?: number;
  bestBid?: number | null;
  bestAsk?: number | null;
  bestBidSize?: number | null;
  bestAskSize?: number | null;
  currentValue?: number;
  pnl?: number;
  isLive?: boolean;
  liveClock?: string;
};

export type PortfolioActivity = {
  id: string;
  action: "opened" | "sold" | "closed" | "canceled";
  title: string;
  outcome: string;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  amount: number;
  entryAmount?: number;
  shares?: number;
  side?: "buy" | "sell";
  probability?: number;
  isLive?: boolean;
  liveClock?: string;
  timestamp?: string;
};

export type OpenOrder = {
  id: string;
  title: string;
  outcome: string;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  side: "buy" | "sell";
  status: string;
  price: number;
  remaining: number;
  originalShares?: number;
  remainingShares?: number;
  orderValue?: number;
  placedAt?: string;
};

export type OrderConfirmation = {
  id: string;
  mode: OrderMode;
  title: string;
  outcome: string;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  side: "buy" | "sell";
  amount: number;
  probability?: number;
  status?: string;
  size?: number;
  filledSize?: number;
  remainingSize?: number;
  isLive?: boolean;
  liveClock?: string;
};

export type PortfolioSyncStatus = "hidden" | "syncing" | "synced" | "error";

type PortfolioCopy = {
  balance: string;
  noPositions: string;
  noPositionsBody: string;
  buy: string;
  sell: string;
  invested: string;
  entry: string;
  currentValue: string;
  currentPrice: string;
  estimatedPnl: string;
  closePosition: string;
  recentActivity: string;
  openedPosition: string;
  soldPosition: string;
  closedPosition: string;
  canceledOrder: string;
  openOrders: string;
  remaining: string;
  remainingValue: string;
  limitPrice: string;
  orderValue: string;
  potentialPayout: string;
  potentialProceeds: string;
  placed: string;
  size: string;
  filled: string;
  shares: string;
  impliedOdds: string;
  filledShares: string;
  executionPrice: string;
  cancelOrder: string;
  portfolioSyncing: string;
  portfolioSynced: string;
  portfolioSyncError: string;
  portfolioSyncFallback: string;
  orderPlaced: string;
  openPositions: string;
  activityCount: string;
  closedTrades: string;
  liveNow: string;
  justNow: string;
};

export { portfolioPositionValue };

const estimatedPnl = estimatedPositionPnl;

const displayOutcome = (item: { outcome: string; selection?: TicketSelection; contractSide?: BinaryContractSide }) => {
  const contractSide = item.contractSide ?? item.selection?.contractSide;
  const display = item.selection?.displayLabel ?? item.outcome;
  return contractSide === "no" ? `No - ${display}` : display;
};

const limitIdentityLabel = (selection?: TicketSelection) =>
  selection?.limitPrice
    ? `portfolio-limit-side-${selection.limitSide ?? "none"} portfolio-limit-price-${Math.round(selection.limitPrice * 100)} portfolio-limit-decimal-${selection.limitPrice.toFixed(2)} portfolio-limit-shares-${selection.limitShares ?? "none"}`
    : "portfolio-limit-side-none portfolio-limit-price-none portfolio-limit-shares-none";

const selectionIdentityLabel = (item: { outcome: string; side?: "buy" | "sell"; selection?: TicketSelection; contractSide?: BinaryContractSide }) => {
  const selection = item.selection;
  const contractSide = item.contractSide ?? selection?.contractSide ?? "yes";
  return selection
    ? `portfolio-snapshot-source-order-time portfolio-market-family-${selection.marketType} portfolio-market-type-${selection.marketType} portfolio-market-id-${selection.marketId ?? "none"} portfolio-outcome-id-${selection.outcomeId ?? "none"} portfolio-market-group-${selection.marketGroupId ?? "none"} portfolio-line-${selection.line ?? "none"} portfolio-period-${selection.period ?? "none"} portfolio-side-${item.side ?? selection.side ?? "none"} portfolio-outcome-${displayOutcome(item)} portfolio-display-label-${selection.displayLabel} portfolio-contract-side-${contractSide} portfolio-provider-source-${selection.referenceSource ?? "none"} portfolio-provider-market-${selection.externalMarketId ?? "none"} portfolio-provider-condition-${selection.conditionId ?? "none"} portfolio-provider-token-${selection.referenceTokenId ?? "none"} portfolio-provider-outcome-${selection.referenceOutcomeLabel ?? "none"} ${limitIdentityLabel(selection)}`
    : `portfolio-market-family-none portfolio-line-none portfolio-period-none portfolio-side-${item.side ?? "none"} portfolio-outcome-${displayOutcome(item)} portfolio-contract-side-${contractSide} portfolio-limit-side-none portfolio-limit-price-none portfolio-limit-shares-none`;
};

const snapshotSourceLabel = (id: string, selection?: TicketSelection) =>
  selection
    ? `snapshot-source-order-time snapshot-display-label-${selection.displayLabel} snapshot-provider-market-${selection.externalMarketId ?? "none"} snapshot-provider-token-${selection.referenceTokenId ?? "none"} snapshot-market-id-${selection.marketId ?? "none"} snapshot-outcome-id-${selection.outcomeId ?? "none"} ${limitIdentityLabel(selection)}`
    : `snapshot-source-current-state snapshot-row-${id} portfolio-limit-side-none portfolio-limit-price-none portfolio-limit-shares-none`;

const portfolioDetailCopy = {
  en: {
    details: "Details",
    hideDetails: "Hide details",
    actionHint: "Tap row for details",
  },
  zh: {
    details: "\u8be6\u60c5",
    hideDetails: "\u6536\u8d77\u8be6\u60c5",
    actionHint: "\u70b9\u51fb\u67e5\u770b\u8be6\u60c5",
  },
};

const openOrderFilledShares = (order: OpenOrder) =>
  typeof order.originalShares === "number" ? Math.max(order.originalShares - openOrderRemainingShares(order), 0) : undefined;

const openOrderFilledPercent = (order: OpenOrder) => {
  if (typeof order.originalShares !== "number" || order.originalShares <= 0) return undefined;
  return Math.round(((openOrderFilledShares(order) ?? 0) / order.originalShares) * 100);
};

const openOrderFilledText = (order: OpenOrder, t: PortfolioCopy) => {
  const filledShares = openOrderFilledShares(order);
  const filledPercent = openOrderFilledPercent(order);
  if (typeof filledShares !== "number" || typeof filledPercent !== "number") return undefined;
  return `${t.filled}: ${filledShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${t.shares} (${filledPercent}%)`;
};

const investedTotal = (positions: Position[]) => positions.reduce((total, position) => total + position.amount, 0);

const currentValueTotal = (positions: Position[]) =>
  positions.reduce((total, position) => total + portfolioPositionValue(position), 0);

const pnlTotal = (positions: Position[]) =>
  positions.reduce((total, position) => total + estimatedPnl(position), 0);

const activityActionLabel = (activity: PortfolioActivity, t: PortfolioCopy) =>
  activity.action === "opened"
    ? t.openedPosition
    : activity.action === "sold"
      ? t.soldPosition
      : activity.action === "canceled"
        ? t.canceledOrder
        : t.closedPosition;

const activitySidePrefix = (activity: PortfolioActivity, t: PortfolioCopy) =>
  activity.side ? `${activity.side === "sell" ? t.sell : t.buy} - ` : "";

const activityExecutionText = (activity: PortfolioActivity, t: PortfolioCopy) =>
  activity.action === "closed"
    ? `${t.entry} ${typeof activity.probability === "number" ? `${activity.probability}%` : money(activity.entryAmount ?? activity.amount)} - ${t.currentValue} ${money(activity.amount)} - ${t.estimatedPnl} ${
        activityPnl(activity) >= 0 ? "+" : ""
      }${money(activityPnl(activity))}`
    : activity.action === "canceled"
      ? `${activitySidePrefix(activity, t)}${t.canceledOrder} ${(activity.shares ?? activityShares(activity)).toFixed(2)} ${t.shares} - ${t.limitPrice} ${activity.probability ?? 0}%`
    : `${activitySidePrefix(activity, t)}${t.filledShares} ${activityShares(activity).toFixed(2)} - ${t.executionPrice} ${activity.probability ?? 0}% - ${
        t.impliedOdds
      } ${decimalOdds((activity.probability ?? 0) / 100)}`;

const hasActivityExecutionDetails = (activity: PortfolioActivity) =>
  typeof activity.probability === "number" ||
  (activity.action === "closed" && typeof activity.entryAmount === "number") ||
  (activity.action === "canceled" && typeof activity.shares === "number");

const lifecycleStatusLabel = (status?: string) => (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "Filled");

const activityStatusLabel = (activity: PortfolioActivity) =>
  activity.action === "canceled" ? "Canceled" : activity.action === "opened" || activity.action === "sold" ? "Filled" : "Closed";

export function Portfolio({
  locale,
  t,
  balance,
  positions,
  latestOrder,
  openOrders,
  activities,
  valueHistory,
  syncStatus,
  closePosition,
  openPositionTrade,
  cancelOpenOrder,
}: {
  locale: Locale;
  t: PortfolioCopy;
  balance: number;
  positions: Position[];
  latestOrder: OrderConfirmation | null;
  openOrders: OpenOrder[];
  activities: PortfolioActivity[];
  valueHistory?: PortfolioValueHistory | null;
  syncStatus: PortfolioSyncStatus;
  closePosition: (position: Position) => void;
  openPositionTrade: (position: Position, side: "buy" | "sell") => void;
  cancelOpenOrder: (order: OpenOrder) => void;
}) {
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const closedActivityCount = activities.filter((activity) => activity.action === "closed").length;
  const latestActivity = activities[0];
  const latestValuePoint = valueHistory?.points.at(-1);
  const detailCopy = portfolioDetailCopy[locale];
  const syncTitle =
    syncStatus === "syncing"
      ? t.portfolioSyncing
      : syncStatus === "synced"
        ? t.portfolioSynced
        : syncStatus === "error"
          ? t.portfolioSyncError
          : "";
  const openOrdersSection =
    openOrders.length > 0 ? (
      <View style={styles.openOrdersBlock}>
        <Text style={styles.openOrdersTitle}>{t.openOrders}</Text>
        {openOrders.slice(0, 5).map((order) => (
          <Pressable
            accessibilityLabel={`open-order-row-${order.id} ${selectionIdentityLabel(order)}`}
            key={order.id}
            onPress={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
            style={[styles.openOrderItem, expandedOrderId === order.id && styles.rowExpanded]}
            testID={`open-order-row-${order.id}`}
          >
            <View style={styles.openOrderHeader}>
              <View style={styles.openOrderMain}>
                <Text style={styles.openOrderTitle}>{order.title}</Text>
                <Text style={styles.openOrderMeta}>
                  {order.side === "buy" ? t.buy : t.sell} - {displayOutcome(order)} - {order.status}
                </Text>
                <View
                  accessibilityLabel={`open-order-status-${order.id} fake-token-test order-status-${order.status.toLowerCase()}`}
                  style={styles.statusPillRow}
                  testID={`open-order-status-${order.id}`}
                >
                  <Text style={styles.statusPill}>Fake-token test</Text>
                  <Text style={styles.statusPill}>{lifecycleStatusLabel(order.status)}</Text>
                  {order.selection && <Text accessibilityLabel={`open-order-snapshot-${order.id} ${snapshotSourceLabel(order.id, order.selection)}`} style={styles.statusPill}>Order-time snapshot</Text>}
                </View>
              </View>
              <Pressable
                accessibilityLabel={`cancel-open-order-${order.id}`}
                onPress={() => cancelOpenOrder(order)}
                style={styles.cancelOrderButton}
                testID={`cancel-open-order-${order.id}`}
              >
                <Text style={styles.cancelOrderText}>{t.cancelOrder}</Text>
              </Pressable>
            </View>
            <View style={styles.rowHint}>
              <Ionicons name={expandedOrderId === order.id ? "chevron-up" : "chevron-down"} color="#93c5fd" size={16} />
              <Text style={styles.rowHintText}>{expandedOrderId === order.id ? detailCopy.hideDetails : detailCopy.actionHint}</Text>
            </View>
            <View style={styles.openOrderMetricGrid}>
              <View style={styles.openOrderMetricBox}>
                <Text style={styles.openOrderMetricLabel}>{t.limitPrice}</Text>
                <Text style={styles.openOrderPrice}>{Math.round(order.price * 100)}%</Text>
              </View>
              <View style={styles.openOrderMetricBox}>
                <Text style={styles.openOrderMetricLabel}>{t.impliedOdds}</Text>
                <Text style={styles.openOrderMetricValue}>{decimalOdds(order.price)}</Text>
              </View>
              <View style={styles.openOrderMetricBox}>
                <Text style={styles.openOrderMetricLabel}>{t.orderValue}</Text>
                <Text style={styles.openOrderMetricValue}>{money(openOrderValue(order))}</Text>
              </View>
            </View>
            <Text accessibilityLabel={`open-order-remaining-value-${order.id}`} style={styles.openOrderRemaining}>
              {t.remaining}: {openOrderRemainingShares(order).toLocaleString(undefined, { maximumFractionDigits: 2 })} {t.shares} ({t.remainingValue}: {money(openOrderValue(order))})
            </Text>
            <Text accessibilityLabel={`open-order-potential-payout-${order.id}`} style={styles.openOrderRemaining}>
              {t[openOrderPotentialCopyKey(order)]}: {money(openOrderPotentialValue(order))}
            </Text>
            {typeof order.originalShares === "number" && (
              <Text accessibilityLabel={`open-order-size-${order.id}`} style={styles.openOrderPlaced}>
                {t.size}: {order.originalShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} {t.shares}
              </Text>
            )}
            {openOrderFilledText(order, t) && (
              <Text accessibilityLabel={`open-order-filled-${order.id}`} style={styles.openOrderPlaced}>
                {openOrderFilledText(order, t)}
              </Text>
            )}
            {order.placedAt && (
              <Text accessibilityLabel={`open-order-placed-${order.id}`} style={styles.openOrderPlaced}>
                {t.placed}: {order.placedAt}
              </Text>
            )}
            {expandedOrderId === order.id && (
              <View accessibilityLabel={`open-order-detail-${order.id}`} testID={`open-order-detail-${order.id}`} style={styles.detailPanel}>
                <Text style={styles.detailPanelTitle}>{detailCopy.details}</Text>
                <Text style={styles.detailPanelText}>{order.side === "buy" ? t.potentialPayout : t.potentialProceeds}: {money(openOrderPotentialValue(order))}</Text>
                <Text style={styles.detailPanelText}>{t.remaining}: {openOrderRemainingShares(order).toLocaleString(undefined, { maximumFractionDigits: 2 })} {t.shares}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    ) : null;

  return (
    <ScrollView accessibilityLabel="portfolio-screen" testID="portfolio-screen" style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View accessibilityLabel="fake-balance-card" testID="fake-balance-card" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t.balance}</Text>
        <Text style={styles.balanceValue}>{money(balance)}</Text>
      </View>
      {syncStatus !== "hidden" && (
        <View accessibilityLabel="portfolio-sync-status" testID="portfolio-sync-status" style={styles.syncCard}>
          <Ionicons
            name={syncStatus === "error" ? "cloud-offline-outline" : "cloud-done-outline"}
            size={20}
            color={syncStatus === "error" ? "#fbbf24" : "#93c5fd"}
          />
          <View style={styles.syncTextBlock}>
            <Text style={styles.syncTitle}>{syncTitle}</Text>
            {syncStatus === "error" && <Text style={styles.syncBody}>{t.portfolioSyncFallback}</Text>}
          </View>
        </View>
      )}
      {valueHistory && (
        <View
          accessibilityLabel={`portfolio-value-history portfolio-value-history-source-${valueHistory.source} portfolio-value-history-status-${valueHistory.status} portfolio-value-history-range-${valueHistory.range} portfolio-value-history-points-${valueHistory.points.length}`}
          style={styles.valueHistoryCard}
          testID="portfolio-value-history"
        >
          <View>
            <Text style={styles.valueHistoryLabel}>Value history</Text>
            <Text style={styles.valueHistoryMeta}>{valueHistory.range} - {valueHistory.status}</Text>
          </View>
          <View style={styles.valueHistoryRight}>
            <Text style={styles.valueHistoryValue}>{latestValuePoint ? money(latestValuePoint.value) : "--"}</Text>
            <Text style={styles.valueHistoryMeta}>{valueHistory.points.length} points</Text>
          </View>
        </View>
      )}
      <View style={styles.countGrid}>
        <View accessibilityLabel="portfolio-position-count" testID="portfolio-position-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.openPositions}</Text>
          <Text style={styles.positionCountValue}>{positions.length}</Text>
        </View>
        <View accessibilityLabel="portfolio-open-order-count" testID="portfolio-open-order-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.openOrders}</Text>
          <Text style={styles.positionCountValue}>{openOrders.length}</Text>
        </View>
        <View accessibilityLabel="portfolio-activity-count" testID="portfolio-activity-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.activityCount}</Text>
          <Text style={styles.positionCountValue}>{activities.length}</Text>
        </View>
        <View accessibilityLabel="portfolio-closed-count" testID="portfolio-closed-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.closedTrades}</Text>
          <Text style={styles.positionCountValue}>{closedActivityCount}</Text>
        </View>
      </View>
      {latestActivity && (
        <View accessibilityLabel={`latest-activity-card ${selectionIdentityLabel(latestActivity)}`} testID="latest-activity-card" style={styles.latestActivityCard}>
          <View style={styles.latestActivityTop}>
            <Text style={styles.latestActivityLabel}>{t.recentActivity}</Text>
            <Text style={styles.latestActivityAmount}>{money(latestActivity.amount)}</Text>
          </View>
          <Text style={styles.latestActivityAction}>{activityActionLabel(latestActivity, t)}</Text>
          <View
            accessibilityLabel={`latest-activity-status-${latestActivity.id} fake-token-test activity-${latestActivity.action} status-${activityStatusLabel(latestActivity).toLowerCase()}`}
            style={styles.statusPillRow}
            testID={`latest-activity-status-${latestActivity.id}`}
          >
            <Text style={styles.statusPill}>Fake-token test</Text>
            <Text style={styles.statusPill}>{activityStatusLabel(latestActivity)}</Text>
            {latestActivity.selection && <Text accessibilityLabel={`latest-activity-snapshot-${latestActivity.id} ${snapshotSourceLabel(latestActivity.id, latestActivity.selection)}`} style={styles.statusPill}>Order-time snapshot</Text>}
          </View>
          {latestActivity.timestamp && (
            <Text accessibilityLabel={`latest-activity-time-${latestActivity.id}`} style={styles.activityTime}>
              {latestActivity.timestamp}
            </Text>
          )}
          <Text style={styles.latestActivityMeta}>
            {latestActivity.title} - {displayOutcome(latestActivity)}
          </Text>
          {hasActivityExecutionDetails(latestActivity) && (
              <Text accessibilityLabel={`latest-activity-execution-${latestActivity.id}`} style={styles.activityExecution}>
                {activityExecutionText(latestActivity, t)}
              </Text>
            )}
        </View>
      )}
      {openOrdersSection}
      {latestOrder && (
        <View accessibilityLabel={`latest-order-card ${selectionIdentityLabel(latestOrder)}`} testID="latest-order-card" style={styles.confirmationCard}>
          {latestOrder.isLive && (
            <View accessibilityLabel="latest-order-live-badge" testID="latest-order-live-badge" style={styles.liveBadge}>
              <Ionicons name="radio" color="#fecaca" size={13} />
              <Text style={styles.liveBadgeText}>{t.liveNow}</Text>
            </View>
          )}
          {latestOrder.liveClock && (
            <Text accessibilityLabel="latest-order-live-clock" testID="latest-order-live-clock" style={styles.liveClock}>
              {latestOrder.liveClock}
            </Text>
          )}
          <View style={styles.confirmationTop}>
            <Text style={styles.confirmationTitle}>{t.orderPlaced}</Text>
            <Text style={styles.confirmationAmount}>{money(latestOrder.amount)}</Text>
          </View>
          <Text style={styles.confirmationMeta}>
            {latestOrder.mode.toUpperCase()} - {latestOrder.side === "buy" ? t.buy : t.sell} - {displayOutcome(latestOrder)}
            {latestOrder.status ? ` - ${latestOrder.status}` : ""}
          </Text>
          <View
            accessibilityLabel={`latest-order-status fake-token-test order-status-${(latestOrder.status ?? "filled").toLowerCase()}`}
            style={styles.statusPillRow}
            testID="latest-order-status"
          >
            <Text style={styles.statusPill}>Fake-token test</Text>
            <Text style={styles.statusPill}>{lifecycleStatusLabel(latestOrder.status)}</Text>
            {latestOrder.selection && <Text accessibilityLabel={`latest-order-snapshot ${snapshotSourceLabel(latestOrder.id, latestOrder.selection)}`} style={styles.statusPill}>Order-time snapshot</Text>}
          </View>
          <Text style={styles.confirmationMarket}>{latestOrder.title}</Text>
          {typeof latestOrder.probability === "number" && (
            <View accessibilityLabel="latest-order-execution-details" testID="latest-order-execution-details" style={styles.confirmationDetailGrid}>
              <View style={styles.confirmationDetailItem}>
                <Text style={styles.confirmationDetailLabel}>{t.filledShares}</Text>
                <Text style={styles.confirmationDetailValue}>
                  {(latestOrder.filledSize ?? activityShares(latestOrder)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.confirmationDetailItem}>
                <Text style={styles.confirmationDetailLabel}>{t.executionPrice}</Text>
                <Text style={styles.confirmationDetailValue}>{latestOrder.probability}%</Text>
              </View>
              <View style={styles.confirmationDetailItem}>
                <Text style={styles.confirmationDetailLabel}>
                  {typeof latestOrder.remainingSize === "number" ? t.remaining : t.impliedOdds}
                </Text>
                <Text style={styles.confirmationDetailValue}>
                  {typeof latestOrder.remainingSize === "number"
                    ? latestOrder.remainingSize.toFixed(2)
                    : decimalOdds(latestOrder.probability / 100)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
      {positions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="wallet-outline" size={34} color="#64748b" />
          <Text style={styles.emptyTitle}>{t.noPositions}</Text>
          <Text style={styles.emptyText}>{t.noPositionsBody}</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t.invested}</Text>
              <Text style={styles.summaryValue}>{money(investedTotal(positions))}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t.currentValue}</Text>
              <Text style={styles.summaryValue}>{money(currentValueTotal(positions))}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t.estimatedPnl}</Text>
              <Text style={[styles.summaryValue, pnlTotal(positions) >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
                {pnlTotal(positions) >= 0 ? "+" : ""}
                {money(pnlTotal(positions))}
              </Text>
            </View>
          </View>
          {positions.map((position) => {
            const canCashOut = canCashOutPosition(position);
            return (
              <View accessibilityLabel={`position-card-${position.id} ${selectionIdentityLabel(position)} cashout-${canCashOut ? "available" : "unavailable"}`} key={position.id} style={styles.positionCard}>
                {position.isLive && (
                  <View accessibilityLabel="portfolio-position-live-badge" testID="portfolio-position-live-badge" style={styles.liveBadge}>
                    <Ionicons name="radio" color="#fecaca" size={13} />
                    <Text style={styles.liveBadgeText}>{t.liveNow}</Text>
                  </View>
                )}
                {position.liveClock && (
                  <Text accessibilityLabel="portfolio-position-live-clock" testID="portfolio-position-live-clock" style={styles.liveClock}>
                    {position.liveClock}
                  </Text>
                )}
                <Text style={styles.positionTitle}>{position.title}</Text>
                <Text style={styles.positionMeta}>
                  {position.mode.toUpperCase()} - {position.side === "buy" ? t.buy : t.sell} - {displayOutcome(position)} - {position.probability}%
                </Text>
                {position.selection && (
                  <Text accessibilityLabel={`position-snapshot-${position.id} ${snapshotSourceLabel(position.id, position.selection)}`} style={styles.snapshotText}>
                    Order-time snapshot
                  </Text>
                )}
                <Pressable
                  accessibilityLabel={`position-detail-toggle-${position.id}`}
                  onPress={() => setExpandedPositionId((current) => (current === position.id ? null : position.id))}
                  style={styles.detailToggle}
                  testID={`position-detail-toggle-${position.id}`}
                >
                  <Ionicons name={expandedPositionId === position.id ? "chevron-up" : "chevron-down"} color="#93c5fd" size={16} />
                  <Text style={styles.detailToggleText}>{expandedPositionId === position.id ? detailCopy.hideDetails : detailCopy.actionHint}</Text>
                </Pressable>
                <Text style={styles.positionValue}>{money(position.amount)}</Text>
                <View style={styles.positionDetailGrid}>
                  <View style={styles.positionDetailItem}>
                    <Text style={styles.positionDetailLabel}>{t.entry}</Text>
                    <Text style={styles.positionDetailValue}>{position.probability}%</Text>
                  </View>
                  <View style={styles.positionDetailItem}>
                    <Text style={styles.positionDetailLabel}>{t.currentValue}</Text>
                    <Text style={styles.positionDetailValue}>{money(portfolioPositionValue(position))}</Text>
                  </View>
                  <View style={styles.positionDetailItem}>
                    <Text style={styles.positionDetailLabel}>{t.estimatedPnl}</Text>
                    <Text style={[styles.positionDetailValue, estimatedPnl(position) >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
                      {estimatedPnl(position) >= 0 ? "+" : ""}
                      {money(estimatedPnl(position))}
                    </Text>
                  </View>
                </View>
                {typeof position.shares === "number" && (
                  <Text accessibilityLabel={`position-shares-${position.id}`} style={styles.positionServerMeta}>
                    {t.filledShares}: {position.shares.toFixed(2)}
                    {typeof position.currentPrice === "number" ? ` - ${t.currentPrice} ${Math.round(position.currentPrice * 100)}%` : ""}
                  </Text>
                )}
                {(typeof position.shares === "number" || typeof position.currentPrice === "number") && (
                  <View style={styles.positionServerDetailGrid}>
                    {typeof position.shares === "number" && (
                      <View
                        accessibilityLabel={`position-filled-shares-${position.id}`}
                        style={styles.positionServerDetailItem}
                        testID={`position-filled-shares-${position.id}`}
                      >
                        <Text style={styles.positionServerDetailLabel}>{t.filledShares}</Text>
                        <Text style={styles.positionServerDetailValue}>{position.shares.toFixed(2)}</Text>
                      </View>
                    )}
                    {typeof position.currentPrice === "number" && (
                      <View
                        accessibilityLabel={`position-current-price-${position.id}`}
                        style={styles.positionServerDetailItem}
                        testID={`position-current-price-${position.id}`}
                      >
                        <Text style={styles.positionServerDetailLabel}>{t.currentPrice}</Text>
                        <Text style={styles.positionServerDetailValue}>{Math.round(position.currentPrice * 100)}%</Text>
                      </View>
                    )}
                  </View>
                )}
                {expandedPositionId === position.id && (
                  <View accessibilityLabel={`position-detail-${position.id}`} testID={`position-detail-${position.id}`} style={styles.detailPanel}>
                    <Text style={styles.detailPanelTitle}>{detailCopy.details}</Text>
                    <Text style={styles.detailPanelText}>{t.currentValue}: {money(portfolioPositionValue(position))}</Text>
                    <Text style={styles.detailPanelText}>{t.estimatedPnl}: {estimatedPnl(position) >= 0 ? "+" : ""}{money(estimatedPnl(position))}</Text>
                    <Text style={styles.detailPanelText}>{t.currentPrice}: {typeof position.currentPrice === "number" ? `${Math.round(position.currentPrice * 100)}%` : `${position.probability}%`}</Text>
                  </View>
                )}
                <View style={styles.positionActionRow}>
                  <Pressable
                    accessibilityLabel={`position-trade-buy-${position.id}`}
                    onPress={() => openPositionTrade(position, "buy")}
                    style={styles.positionTradeButton}
                    testID={`position-trade-buy-${position.id}`}
                  >
                    <Text style={styles.positionTradeButtonText}>{t.buy}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`position-trade-sell-${position.id}`}
                    accessibilityState={{ disabled: !canCashOut }}
                    disabled={!canCashOut}
                    onPress={() => openPositionTrade(position, "sell")}
                    style={[styles.positionTradeButton, !canCashOut && styles.positionTradeButtonDisabled]}
                    testID={`position-trade-sell-${position.id}`}
                  >
                    <Text style={styles.positionTradeButtonText}>{t.sell}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`close-position-${position.id} cashout-${canCashOut ? "available" : "unavailable"} cashout-estimate-${cashOutEstimate(position).toFixed(2)}`}
                    accessibilityState={{ disabled: !canCashOut }}
                    disabled={!canCashOut}
                    onPress={() => closePosition(position)}
                    style={[styles.closeButton, !canCashOut && styles.closeButtonDisabled]}
                    testID={`close-position-${position.id}`}
                  >
                    <Text style={styles.closeButtonText}>{t.closePosition}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </>
      )}
      {activities.length > 0 && (
        <View style={styles.activityBlock}>
          <Text style={styles.activityTitle}>{t.recentActivity}</Text>
          {activities.slice(0, 5).map((activity) => (
            <Pressable
              accessibilityLabel={`activity-row-${activity.id} ${selectionIdentityLabel(activity)}`}
              key={activity.id}
              onPress={() => setExpandedActivityId((current) => (current === activity.id ? null : activity.id))}
              style={[styles.activityItem, expandedActivityId === activity.id && styles.rowExpanded]}
              testID={`activity-row-${activity.id}`}
            >
              <View style={styles.activityIcon}>
                <Ionicons
                  name={activity.action === "opened" ? "arrow-up" : activity.action === "canceled" ? "close" : "checkmark"}
                  size={16}
                  color="#dbeafe"
                />
              </View>
              <View style={styles.activityMain}>
                <Text style={styles.activityAction}>
                  {activityActionLabel(activity, t)}
                </Text>
                <View
                  accessibilityLabel={`activity-status-${activity.id} fake-token-test activity-${activity.action} status-${activityStatusLabel(activity).toLowerCase()}`}
                  style={styles.statusPillRow}
                  testID={`activity-status-${activity.id}`}
                >
                  <Text style={styles.statusPill}>Fake-token test</Text>
                  <Text style={styles.statusPill}>{activityStatusLabel(activity)}</Text>
                  {activity.selection && <Text accessibilityLabel={`activity-snapshot-${activity.id} ${snapshotSourceLabel(activity.id, activity.selection)}`} style={styles.statusPill}>Order-time snapshot</Text>}
                </View>
                {activity.timestamp && (
                  <Text accessibilityLabel={`activity-time-${activity.id}`} style={styles.activityTime}>
                    {activity.timestamp}
                  </Text>
                )}
                {activity.isLive && (
                  <Text accessibilityLabel="portfolio-activity-live-badge" style={styles.activityLiveText}>
                    {t.liveNow}
                  </Text>
                )}
                {activity.liveClock && (
                  <Text accessibilityLabel="portfolio-activity-live-clock" style={styles.activityLiveClock}>
                    {activity.liveClock}
                  </Text>
                )}
                <Text style={styles.activityMeta}>
                  {activity.title} - {displayOutcome(activity)}
                </Text>
                {hasActivityExecutionDetails(activity) && (
                  <Text accessibilityLabel={`activity-execution-${activity.id}`} style={styles.activityExecution}>
                    {activityExecutionText(activity, t)}
                  </Text>
                )}
              </View>
              <Text style={styles.activityAmount}>{money(activity.amount)}</Text>
              {expandedActivityId === activity.id && (
                <View accessibilityLabel={`activity-detail-${activity.id}`} testID={`activity-detail-${activity.id}`} style={styles.activityDetailPanel}>
                  <Text style={styles.detailPanelTitle}>{detailCopy.details}</Text>
                  <Text style={styles.detailPanelText}>{activity.title} - {displayOutcome(activity)}</Text>
                  <Text style={styles.detailPanelText}>{activityExecutionText(activity, t)}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  balanceCard: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 10 },
  balanceLabel: { color: "#94a3b8", fontWeight: "800" },
  balanceValue: { color: "#f8fafc", fontSize: 34, fontWeight: "900", marginTop: 6 },
  syncCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  syncTextBlock: { flex: 1 },
  syncTitle: { color: "#f8fafc", fontWeight: "900" },
  syncBody: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  valueHistoryCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  valueHistoryLabel: { color: "#f8fafc", fontWeight: "900" },
  valueHistoryRight: { alignItems: "flex-end" },
  valueHistoryValue: { color: "#dbeafe", fontWeight: "900" },
  valueHistoryMeta: { color: "#94a3b8", fontSize: 11, fontWeight: "800", marginTop: 3 },
  countGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  countTile: { flexGrow: 1, flexBasis: "48%", minHeight: 72, justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  positionCountLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "900" },
  positionCountValue: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  latestActivityCard: { marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: "#0f1f1d", borderWidth: 1, borderColor: "#155e75" },
  latestActivityTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  latestActivityLabel: { color: "#99f6e4", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  latestActivityAmount: { color: "#dbeafe", fontWeight: "900" },
  latestActivityAction: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginTop: 8 },
  latestActivityMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 4 },
  emptyCard: { alignItems: "center", padding: 28, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 16 },
  emptyTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#94a3b8", textAlign: "center", marginTop: 6, fontWeight: "700" },
  summaryGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  summaryItem: { flex: 1, minHeight: 92, padding: 10, borderRadius: 10, backgroundColor: "#111b2d", borderWidth: 1, borderColor: "#2b3b55" },
  summaryLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  summaryValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 8 },
  positionCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  detailToggle: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  detailToggleText: { color: "#93c5fd", fontSize: 11, fontWeight: "900" },
  rowHint: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  rowHintText: { color: "#93c5fd", fontSize: 11, fontWeight: "900" },
  rowExpanded: { borderColor: "#3b82f6", backgroundColor: "#12213a" },
  detailPanel: { gap: 4, marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#29476d" },
  detailPanelTitle: { color: "#dbeafe", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  detailPanelText: { color: "#94a3b8", fontSize: 12, fontWeight: "800" },
  liveBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "#451a1a", borderWidth: 1, borderColor: "#7f1d1d" },
  liveBadgeText: { color: "#fecaca", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  liveClock: { alignSelf: "flex-start", color: "#fca5a5", fontSize: 12, fontWeight: "900", marginBottom: 8 },
  positionTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  positionMeta: { color: "#94a3b8", marginTop: 5, fontWeight: "800" },
  positionValue: { color: "#22c55e", fontSize: 22, fontWeight: "900", marginTop: 8 },
  positionDetailGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  positionDetailItem: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  positionDetailLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  positionDetailValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 5 },
  positionServerMeta: { color: "#93c5fd", fontSize: 12, fontWeight: "800", marginTop: 10 },
  positionServerDetailGrid: { flexDirection: "row", gap: 8, marginTop: 10 },
  positionServerDetailItem: { flex: 1, minHeight: 58, padding: 10, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1d4ed8" },
  positionServerDetailLabel: { color: "#93c5fd", fontSize: 11, fontWeight: "900" },
  positionServerDetailValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 5 },
  pnlPositive: { color: "#22c55e" },
  pnlNegative: { color: "#ef4444" },
  positionActionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  positionTradeButton: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#0f766e", borderWidth: 1, borderColor: "#14b8a6" },
  positionTradeButtonDisabled: { opacity: 0.45, backgroundColor: "#111827", borderColor: "#263247" },
  positionTradeButtonText: { color: "#ecfeff", fontSize: 14, fontWeight: "900" },
  closeButton: { flex: 1.35, minHeight: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  closeButtonDisabled: { opacity: 0.45, backgroundColor: "#111827", borderColor: "#263247" },
  closeButtonText: { color: "#dbeafe", fontSize: 14, fontWeight: "900" },
  confirmationCard: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#12213a", borderWidth: 1, borderColor: "#2b5ca8" },
  confirmationTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  confirmationTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  confirmationAmount: { color: "#dbeafe", fontWeight: "900" },
  confirmationMeta: { color: "#93c5fd", fontSize: 12, fontWeight: "900", marginTop: 8 },
  confirmationMarket: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 4 },
  confirmationDetailGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  confirmationDetailItem: { flex: 1, minHeight: 54, padding: 8, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#2b5ca8" },
  confirmationDetailLabel: { color: "#93c5fd", fontSize: 10, fontWeight: "900" },
  confirmationDetailValue: { color: "#f8fafc", fontSize: 12, fontWeight: "900", marginTop: 5 },
  openOrdersBlock: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  openOrdersTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  openOrderItem: { gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#1f2937" },
  openOrderHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  openOrderMain: { flex: 1 },
  openOrderTitle: { color: "#f8fafc", fontWeight: "900" },
  openOrderMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  statusPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: "hidden", backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#29476d", color: "#bfdbfe", fontSize: 10, fontWeight: "900" },
  snapshotText: { alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: "hidden", backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#29476d", color: "#bfdbfe", fontSize: 10, fontWeight: "900" },
  openOrderPrice: { color: "#dbeafe", fontWeight: "900" },
  openOrderMetricGrid: { flexDirection: "row", gap: 6 },
  openOrderMetricBox: { flex: 1, minHeight: 50, padding: 8, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  openOrderMetricLabel: { color: "#64748b", fontSize: 10, fontWeight: "900" },
  openOrderMetricValue: { color: "#dbeafe", fontSize: 11, fontWeight: "900", marginTop: 5 },
  openOrderRemaining: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  openOrderPlaced: { color: "#64748b", fontSize: 11, fontWeight: "800" },
  cancelOrderButton: { minHeight: 36, minWidth: 92, paddingHorizontal: 10, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  cancelOrderText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  activityBlock: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  activityTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  activityItem: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
  activityIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937" },
  activityMain: { flex: 1 },
  activityAction: { color: "#f8fafc", fontWeight: "900" },
  activityTime: { color: "#64748b", fontSize: 11, fontWeight: "800", marginTop: 2 },
  activityLiveText: { alignSelf: "flex-start", color: "#fecaca", fontSize: 11, fontWeight: "900", marginTop: 3, textTransform: "uppercase" },
  activityLiveClock: { alignSelf: "flex-start", color: "#fca5a5", fontSize: 11, fontWeight: "900", marginTop: 2 },
  activityMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  activityExecution: { color: "#93c5fd", fontSize: 11, fontWeight: "900", marginTop: 4 },
  activityAmount: { color: "#dbeafe", fontWeight: "900" },
  activityDetailPanel: { width: "100%", gap: 4, marginTop: 2, marginLeft: 38, padding: 10, borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#29476d" },
});
