import { getPolymarketMmOpsStatus, writePolymarketMmStatusReport } from "@/server/services/polymarketMmOpsLoop";

getPolymarketMmOpsStatus()
  .then(async (status) => {
    const reportPath = await writePolymarketMmStatusReport(status);
    console.log(JSON.stringify({ reportPath, status }, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
