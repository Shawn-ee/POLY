import type { PolyApi } from "../api";
import type { OpenOrder, PortfolioActivity } from "../components/Portfolio";
import { assertCancelOrderRoutePayloadShape } from "./cancelOrderRouteShapeService";
import type { OrderMode } from "./orderService";

export const openOrderCanceledActivity = (order: OpenOrder, timestamp: string): PortfolioActivity => ({
  id: `${order.id}-canceled`,
  action: "canceled",
  title: order.title,
  outcome: order.outcome,
  selection: order.selection,
  contractSide: order.contractSide,
  amount: order.orderValue ?? (order.remainingShares ?? order.remaining) * order.price,
  shares: order.remainingShares ?? order.remaining,
  side: order.side,
  probability: Math.round(order.price * 100),
  timestamp,
});

export const appendUniqueActivity = (
  current: PortfolioActivity[],
  activity: PortfolioActivity,
): PortfolioActivity[] => (current.some((item) => item.id === activity.id) ? current : [activity, ...current]);

export const shouldApplyOptimisticCancel = (mode: OrderMode) => mode !== "server";

export const cancelOpenOrderOnServer = async ({
  mode,
  api,
  order,
}: {
  mode: OrderMode;
  api: PolyApi;
  order: OpenOrder;
}): Promise<void> => {
  if (mode !== "server") {
    return;
  }
  const response = await api.cancelOrder(order.id);
  try {
    assertCancelOrderRoutePayloadShape(response, order.id);
  } catch {
    throw new Error("Order cancel was not confirmed by the server.");
  }
};
