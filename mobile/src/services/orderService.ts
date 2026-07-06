import { PolyApi } from "../api";
import type { BinaryContractSide, TicketSelection } from "../components/TradeTicket";
import type { Event, Market, Outcome } from "../mocks/worldCup";
import { portfolioSelectionFromBackend } from "./portfolioSelectionService";

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
    selection?: Partial<TicketSelection> | null;
  };
  fills?: Array<{ size?: string | number | null }>;
  id?: string;
  status?: string;
  size?: string | number | null;
  remaining?: string | number | null;
  selection?: Partial<TicketSelection> | null;
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

const requireContractProbability = (input: TicketOrderInput) => {
  const probability = contractProbability(input);
  if (!Number.isFinite(probability) || probability <= 0 || probability > 100) {
    throw new Error("Order price must be between 1 and 100 cents.");
  }
  return probability;
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
  probability: requireContractProbability(input),
});

const numericField = (value: string | number | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const optionalServerNumber = (value: string | number | null | undefined, field: string) => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = numericField(value);
  if (parsed === undefined || parsed < 0) {
    throw new Error(`Order submit response had invalid ${field}.`);
  }
  return parsed;
};

const fillTotalFromResponse = (response: ServerOrderResponse) => {
  if (response.fills === undefined) return undefined;
  if (!Array.isArray(response.fills)) {
    throw new Error("Order submit response had invalid fills.");
  }
  return response.fills.reduce((total, fill) => total + (optionalServerNumber(fill.size, "fills[].size") ?? 0), 0);
};

const lifecycleFromResponse = (response: ServerOrderResponse) => {
  const size = optionalServerNumber(response.order?.size ?? response.size, "order.size");
  const remainingSize = optionalServerNumber(response.order?.remaining ?? response.remaining, "order.remaining");
  const fillTotal = fillTotalFromResponse(response);
  if (size !== undefined && remainingSize !== undefined && remainingSize > size) {
    throw new Error("Order submit response had remaining size above order size.");
  }
  if (size !== undefined && fillTotal !== undefined && fillTotal > size) {
    throw new Error("Order submit response had filled size above order size.");
  }
  if (size !== undefined && remainingSize !== undefined && fillTotal !== undefined && fillTotal + remainingSize > size + 0.000001) {
    throw new Error("Order submit response had filled plus remaining size above order size.");
  }
  const filledSize =
    fillTotal !== undefined && fillTotal > 0
      ? fillTotal
      : size !== undefined && remainingSize !== undefined
        ? Math.max(0, size - remainingSize)
        : undefined;
  return {
    size,
    remainingSize,
    filledSize,
  };
};

const sharesFromAmount = (amount: number, probability: number) => {
  const price = Math.max(probability, 1) / 100;
  return amount / price;
};

const lineSelectionFamilies: Array<TicketSelection["marketType"]> = ["spread", "totals", "team-total"];

const blockedAvailabilityStatuses = new Set(["suspended", "unavailable"]);
const failedOrderStatuses = new Set(["CANCELED", "CANCELLED", "REJECTED", "FAILED", "EXPIRED"]);

export const marketOrderBlockReason = (market: Market) => {
  const status = market.availability?.status;
  if (!status || !blockedAvailabilityStatuses.has(status)) return null;
  return market.availability?.reason || `Market is ${status}.`;
};

const selectionRequiresServerEcho = (selection: TicketSelection) =>
  lineSelectionFamilies.includes(selection.marketType) ||
  Boolean(selection.line || selection.period || selection.externalMarketId || selection.conditionId || selection.referenceTokenId);

const criticalSelectionFields: Array<keyof TicketSelection> = [
  "marketId",
  "outcomeId",
  "marketType",
  "line",
  "period",
  "contractSide",
  "externalMarketId",
  "conditionId",
  "referenceTokenId",
  "referenceOutcomeLabel",
];

const matchingSelectionValue = (left: unknown, right: unknown) => {
  if (left === undefined || left === null || left === "") return true;
  return `${left}` === `${right ?? ""}`;
};

const validateServerSelectionEcho = (expected: TicketSelection, response: ServerOrderResponse): TicketSelection | undefined => {
  const echoed = response.order?.selection ?? response.selection;
  if (!selectionRequiresServerEcho(expected)) {
    return portfolioSelectionFromBackend(echoed, "order.selection", "Order submit selection response");
  }
  if (!echoed || typeof echoed !== "object") {
    throw new Error("Order submit did not confirm the selected market line.");
  }
  const confirmedEcho = portfolioSelectionFromBackend(echoed, "order.selection", "Order submit selection response");
  if (!confirmedEcho) {
    throw new Error("Order submit did not confirm the selected market line.");
  }
  const mismatched = criticalSelectionFields.find((field) => !matchingSelectionValue(expected[field], confirmedEcho[field]));
  if (mismatched) {
    throw new Error(`Order submit changed selected market line (${mismatched}).`);
  }
  return {
    ...expected,
    ...confirmedEcho,
  } as TicketSelection;
};

const validateServerOrderStatus = (status: string | undefined) => {
  if (!status) return undefined;
  const normalized = status.trim().toUpperCase();
  if (failedOrderStatuses.has(normalized)) {
    throw new Error(`Order submit was rejected by the server with status ${normalized}.`);
  }
  return status;
};

export const submitTicketOrder = async (input: TicketOrderInput): Promise<TicketOrderResult> => {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Order amount must be a finite value greater than zero.");
  }

  if (input.mode === "mock") {
    return mockOrder(input);
  }

  const blockReason = marketOrderBlockReason(input.market);
  if (blockReason) {
    throw new Error(`Market unavailable for orders: ${blockReason}`);
  }

  const expectedSelection = selectionForOrder(input);
  const probability = requireContractProbability(input);
  const orderInput = {
    marketId: input.market.id,
    outcomeId: input.outcome.id,
    side: input.side.toUpperCase() as "BUY" | "SELL",
    contractSide: contractSideForOrder(input).toUpperCase() as "YES" | "NO",
    price: (probability / 100).toFixed(2),
    size: sharesFromAmount(input.amount, probability).toFixed(2),
    selection: expectedSelection,
  };
  const payload = await input.api.placeLimitOrder(orderInput);
  const response = payload && typeof payload === "object" ? (payload as ServerOrderResponse) : {};
  const orderId = response.order?.id ?? response.id;
  if (!orderId) {
    throw new Error("Order submit was not confirmed by the server.");
  }
  const status = validateServerOrderStatus(response.order?.status ?? response.status);
  const confirmedSelection = validateServerSelectionEcho(expectedSelection, response);
  const lifecycle = lifecycleFromResponse(response);

  return {
    ...mockOrder(input),
    id: orderId,
    mode: "server",
    status,
    selection: confirmedSelection ?? expectedSelection,
    size: lifecycle.size,
    filledSize: lifecycle.filledSize,
    remainingSize: lifecycle.remainingSize,
  };
};
