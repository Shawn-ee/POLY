import { runReferenceMarketMakerOnce } from "@/server/services/referenceMarketMaker";

runReferenceMarketMakerOnce({ dryRun: process.env.ALLOW_BOT_TRADING !== "true" })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
