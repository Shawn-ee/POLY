import { referenceSnapshotConfig } from "@/server/services/referenceQuoteSnapshots";
import { syncPolymarketReferencePricesOnce } from "@/server/services/polymarket";

const pollMs = Number(process.env.REFERENCE_POLL_MS ?? referenceSnapshotConfig.pollMs);

async function tick() {
  const result = await syncPolymarketReferencePricesOnce({ onlyMmEnabled: process.env.REFERENCE_SYNC_ONLY_MM_ENABLED === "true" });
  console.log(
    JSON.stringify(
      {
        generatedAt: result.generatedAt,
        refreshedCount: result.refreshedCount,
        skippedCount: result.skippedCount,
      },
      null,
      2,
    ),
  );
}

tick().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
});

setInterval(() => {
  tick().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
  });
}, Number.isFinite(pollMs) && pollMs > 0 ? pollMs : 5000);
