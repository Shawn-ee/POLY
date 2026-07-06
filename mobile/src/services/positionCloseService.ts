import type { PolyApi } from "../api";
import type { Position } from "../components/Portfolio";
import type { OrderMode } from "./orderService";
import { assertPositionCloseOrderResponseShape } from "./positionCloseRouteShapeService";

export type ClosePositionInput = {
  mode: OrderMode;
  api: PolyApi;
  position: Position;
};

const hasAvailableShares = (position: Position) => {
  const shares = typeof position.shares === "number" ? position.shares : undefined;
  return Boolean(shares && shares > 0);
};

const closePrice = (position: Position) => {
  if (typeof position.currentPrice !== "number" || !Number.isFinite(position.currentPrice) || position.currentPrice <= 0) {
    return undefined;
  }
  return position.currentPrice.toFixed(2);
};

export const canCashOutPosition = (position: Position) => {
  return position.mode !== "server" || Boolean(hasAvailableShares(position) && closePrice(position));
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

  if (!hasAvailableShares(position)) {
    throw new Error("Cash out requires an open position with available shares.");
  }

  const size = closeSize(position);
  const price = closePrice(position);
  if (!position.marketId || !position.outcomeId || !size) {
    throw new Error("Server position close requires market, outcome, and share identity.");
  }
  if (!price) {
    throw new Error("Cash out requires a current market price.");
  }

  const response = await api.placeLimitOrder({
    marketId: position.marketId,
    outcomeId: position.outcomeId,
    side: "SELL",
    price,
    size,
  });
  assertPositionCloseOrderResponseShape(response, Number(size));
};
