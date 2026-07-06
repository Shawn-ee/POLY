import type { PolyApi } from "../api";
import type { Position } from "../components/Portfolio";
import type { OrderMode } from "./orderService";
import { assertPositionCloseOrderResponseShape } from "./positionCloseRouteShapeService";

export type ClosePositionInput = {
  mode: OrderMode;
  api: PolyApi;
  position: Position;
};

const closePrice = (position: Position) =>
  (typeof position.currentPrice === "number" ? position.currentPrice : position.probability / 100).toFixed(2);

export const canCashOutPosition = (position: Position) => {
  const shares = typeof position.shares === "number" ? position.shares : undefined;
  return position.mode !== "server" || Boolean(shares && shares > 0);
};

export const cashOutEstimate = (position: Position) => {
  if (typeof position.currentValue === "number" && Number.isFinite(position.currentValue)) return position.currentValue;
  return typeof position.shares === "number" && typeof position.currentPrice === "number"
    ? position.shares * position.currentPrice
    : 0;
};

const closeSize = (position: Position) => {
  const shares = typeof position.shares === "number" ? position.shares : undefined;
  return shares && shares > 0 ? shares.toFixed(2) : undefined;
};

export const closePositionOnServer = async ({ mode, api, position }: ClosePositionInput): Promise<void> => {
  if (mode !== "server") {
    return;
  }

  if (!canCashOutPosition(position)) {
    throw new Error("Cash out requires an open position with available shares.");
  }

  const size = closeSize(position);
  if (!position.marketId || !position.outcomeId || !size) {
    throw new Error("Server position close requires market, outcome, and share identity.");
  }

  const response = await api.placeLimitOrder({
    marketId: position.marketId,
    outcomeId: position.outcomeId,
    side: "SELL",
    price: closePrice(position),
    size,
  });
  assertPositionCloseOrderResponseShape(response, Number(size));
};
