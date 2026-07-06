import type { PolyApi } from "../api";
import type { PortfolioActivity, PortfolioSyncStatus } from "../components/Portfolio";
import { loadPortfolioHistoryActivities } from "./portfolioHistoryService";
import { loadPortfolioSnapshot, PortfolioSnapshotResult } from "./portfolioSnapshotService";

export type ServerPortfolioState = {
  syncStatus: Extract<PortfolioSyncStatus, "synced" | "error">;
  snapshotStatus: "synced" | "error";
  historyStatus: "synced" | "error";
  snapshot?: PortfolioSnapshotResult;
  activities?: PortfolioActivity[];
};

export const resolvePortfolioSyncResults = (
  snapshotResult: PromiseSettledResult<PortfolioSnapshotResult>,
  historyResult: PromiseSettledResult<PortfolioActivity[]>,
): ServerPortfolioState => {
  const snapshot = snapshotResult.status === "fulfilled" ? snapshotResult.value : undefined;
  const activities = historyResult.status === "fulfilled" ? historyResult.value : undefined;
  const snapshotStatus = snapshot ? "synced" : "error";
  const historyStatus = activities ? "synced" : "error";
  return {
    syncStatus: snapshot && activities ? "synced" : "error",
    snapshotStatus,
    historyStatus,
    ...(snapshot ? { snapshot } : {}),
    ...(activities ? { activities } : {}),
  };
};

export const loadServerPortfolioState = async (api: PolyApi): Promise<ServerPortfolioState> => {
  const [snapshotResult, historyResult] = await Promise.allSettled([
    loadPortfolioSnapshot(api),
    loadPortfolioHistoryActivities(api),
  ]);
  return resolvePortfolioSyncResults(snapshotResult, historyResult);
};
