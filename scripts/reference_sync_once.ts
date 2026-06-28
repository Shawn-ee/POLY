import { syncPolymarketReferencePricesOnce } from "@/server/services/polymarket";

const marketId = readArg("--marketId");
const eventSlug = readArg("--eventSlug");
const onlyMmEnabled = process.argv.includes("--onlyMmEnabled");
const includePendingReview = process.argv.includes("--includePendingReview");

syncPolymarketReferencePricesOnce({ marketId, eventSlug, onlyMmEnabled, includePendingReview })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });

function readArg(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length) || null;
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}
