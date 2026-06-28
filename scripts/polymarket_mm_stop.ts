import { stopPolymarketMmOpsLoop } from "@/server/services/polymarketMmOpsLoop";

stopPolymarketMmOpsLoop()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
