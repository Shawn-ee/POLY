import { PolyApi } from "../api";
import type { BinaryContractSide, TicketSelection } from "../components/TradeTicket";
import type { Event, Market, Outcome } from "../mocks/worldCup";

export type OrderMode = "mock" | "server";

export type TicketOrderInput = {
  mode: OrderMode;
  api: PolyApi;
  event?: Event;
  market: Market;
  outcome: Outcome;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  side: "buy" | "sell";
  amount: number;
};

export type TicketOrderResult = {
  id: string;
  mode: OrderMode;
  title: string;
  outcome: string;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  side: "buy" | "sell";
  amount: number;
  probability: number;
  status?: string;
  size?: number;
  filledSize?: number;
  remainingSize?: number;
};

type ServerOrderResponse = {
  order?: {
    id?: string;
    status?: string;
    size?: string | number | null;
    remaining?: string | number | null;
  };
  fills?: Array<{ size?: string | number | null }>;
  id?: string;
  status?: string;
  size?: string | number | null;
  remaining?: string | number | null;
};

const label = (value: { label?: string; title?: string; name?: string }) =>
  value.label ?? value.title ?? value.name ?? "Market";

const orderTitle = (input: TicketOrderInput) => {
  if (input.event && input.market.type === "game-line") return label(input.event);
  return label(input.market);
};

const contractSideForOrder = (input: TicketOrderInput): BinaryContractSide =>
  input.contractSide ?? input.selection?.contractSide ?? "yes";

const contractProbability = (input: TicketOrderInput) => {
  const probability = input.outcome.probability;
  return contractSideForOrder(input) === "no" ? 100 - probability : probability;
};

const ticketMarketType = (input: TicketOrderInput): TicketSelection["marketType"] => {
  if (input.selection?.marketType) return input.selection.marketType;
  if (input.market.type === "live") return "live";
  if (input.market.marketType === "spread") return "spread";
  if (input.market.marketType === "totals") return "totals";
  if (input.market.marketType === "team-total") return "team-total";
  if (input.market.marketType === "future" || input.market.type === "future") return "future";
  if (input.market.marketType === "moneyline" || input.market.type === "game-line") return "winner";
  return "prop";
};

const selectionForOrder = (input: TicketOrderInput): TicketSelection => {
  const selection = {
    marketType: ticketMarketType(input),
    marketId: input.market.id,
    outcomeId: input.outcome.id,
    marketGroupId: input.selection?.marketGroupId ?? input.market.marketGroupId,
    line: input.selection?.line ?? input.market.line ?? undefined,
    period: input.selection?.period ?? input.market.period,
    side: input.selection?.side ?? input.outcome.side,
    displayLabel: input.selection?.displayLabel ?? label(input.outcome),
    contractSide: contractSideForOrder(input),
    referenceSource: input.selection?.referenceSource ?? input.market.referenceSource ?? undefined,
    externalSlug: input.selection?.externalSlug ?? input.market.externalSlug ?? undefined,
    externalMarketId: input.selection?.externalMarketId ?? input.market.externalMarketId ?? undefined,
    conditionId: input.selection?.conditionId ?? input.market.conditionId ?? undefined,
    referenceTokenId: input.selection?.referenceTokenId ?? input.outcome.referenceTokenId ?? undefined,
    referenceOutcomeLabel:
      input.selection?.referenceOutcomeLabel ?? input.outcome.referenceOutcomeLabel ?? undefined,
    limitPrice: input.selection?.limitPrice,
    limitSide: input.selection?.limitSide,
    limitShares: input.selection?.limitShares,
  };
  return Object.fromEntries(
    Object.entries(selection).filter(([, value]) => value !== undefined),
  ) as unknown as TicketSelection;
};

const mockOrder = (input: TicketOrderInput): TicketOrderResult => ({
  id: `mock-${input.market.id}-${input.outcome.id}-${Date.now()}`,
  mode: "mock",
  title: orderTitle(input),
  outcome: label(input.outcome),
  selection: selectionForOrder(input),
  contractSide: contractSideForOrder(input),
  side: input.side,
  amount: input.amount,
  probability: contractProbability(input),
});

const numericField = (value: string | number | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const filledSizeFromResponse = (response: ServerOrderResponse) => {
  const totalFromFills = response.fills?.reduce((total, fill) => total + (numericField(fill.size) ?? 0), 0);
  if (totalFromFills && totalFromFills > 0) return totalFromFills;

  const size = numericField(response.order?.size ?? response.size);
  const remaining = numericField(response.order?.remaining ?? response.remaining);
  if (typeof size === "number" && typeof remaining === "number") {
    return Math.max(0, size - remaining);
  }
  return undefined;
};

const sharesFromAmount = (amount: number, probability: number) => {
  const price = Math.max(probability, 1) / 100;
  return amount / price;
};

export const submitTicketOrder = async (input: TicketOrderInput): Promise<TicketOrderResult> => {
  if (input.amount <= 0) {
    throw new Error("Order amount must be greater than zero.");
  }

  if (input.mode === "mock") {
    return mockOrder(input);
  }

  const orderInput = {
    marketId: input.market.id,
    outcomeId: input.outcome.id,
    side: input.side.toUpperCase() as "BUY" | "SELL",
    contractSide: contractSideForOrder(input).toUpperCase() as "YES" | "NO",
    price: (contractProbability(input) / 100).toFixed(2),
    size: sharesFromAmount(input.amount, contractProbability(input)).toFixed(2),
    selection: selectionForOrder(input),
  };
  const payload = await input.api.placeLimitOrder(orderInput);
  const response = payload && typeof payload === "object" ? (payload as ServerOrderResponse) : {};
  const orderId = response.order?.id ?? response.id;
  if (!orderId) {
    throw new Error("Order submit was not confirmed by the server.");
  }
  const size = numericField(response.order?.size ?? response.size);
  const remainingSize = numericField(response.order?.remaining ?? response.remaining);
  const status = response.order?.status ?? response.status;

  return {
    ...mockOrder(input),
    id: orderId,
    mode: "server",
    status,
    size,
    filledSize: filledSizeFromResponse(response),
    remainingSize,
  };
};
