import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  applyDbBackedLifecyclePromotion,
  evaluatePromotionGuardrails,
  planDbBackedLifecyclePromotion,
} from "@/server/services/polymarket";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";

const DEFAULT_INPUT = path.resolve(process.cwd(), "test-logs", "polymarket-world-cup-discovery-candidates.json");
const DEFAULT_OUTPUT = path.resolve(process.cwd(), "test-logs", "polymarket-promotion-guardrails-report.json");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.input ?? DEFAULT_INPUT;
  const outputPath = args.output ?? DEFAULT_OUTPUT;
  const autoPromoteEnabled = envFlag("POLYMARKET_AUTO_PROMOTE_ENABLED", false);
  const applyLocalDbPromotion = args.applyLocalDbPromotion === "true" || envFlag("POLYMARKET_LOCAL_DB_PROMOTION", false);
  const actorUserId = args.actorUserId ?? "system";
  const report = JSON.parse(await readFile(inputPath, "utf8")) as { candidates?: PolymarketImportCandidate[] };
  const candidates = Array.isArray(report.candidates) ? report.candidates : [];
  const decisions = candidates.map(evaluatePromotionGuardrails);
  const lifecyclePlans = candidates.map((candidate) => planDbBackedLifecyclePromotion(candidate, actorUserId));
  const appliedPromotions =
    autoPromoteEnabled && applyLocalDbPromotion
      ? await Promise.all(candidates.map((candidate) => applyDbBackedLifecyclePromotion({ candidate, actorUserId })))
      : [];
  const result = {
    generatedAt: new Date().toISOString(),
    inputPath,
    dryRun: !(autoPromoteEnabled && applyLocalDbPromotion),
    autoPromoteEnabled,
    applyLocalDbPromotion,
    candidateCount: candidates.length,
    eligibleCount: decisions.filter((decision) => decision.eligible).length,
    blockedCount: decisions.filter((decision) => !decision.eligible).length,
    decisions,
    lifecyclePlans,
    appliedPromotions,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ ...result, outputPath }, null, 2)}\n`);
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function envFlag(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value == null || value.trim() === "") return fallback;
  return value.trim().toLowerCase() === "true";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
