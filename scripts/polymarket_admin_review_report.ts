import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildDiscoveryCandidateQueueReviewReport,
  buildWorldCupAdminReviewReport,
  listDiscoveryCandidates,
} from "@/server/services/polymarket";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";

const DEFAULT_INPUT = path.resolve(process.cwd(), "test-logs", "polymarket-world-cup-discovery-candidates.json");
const DEFAULT_OUTPUT = path.resolve(process.cwd(), "test-logs", "polymarket-admin-review-report.json");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fromDb = argFlag(args.fromDb, false);
  const inputPath = args.input ?? DEFAULT_INPUT;
  const outputPath = args.output ?? DEFAULT_OUTPUT;
  const result = fromDb
    ? buildDiscoveryCandidateQueueReviewReport((await listDiscoveryCandidates({
        source: args.source,
        status: args.status,
        batchId: args.batchId,
        pageSize: Number(args.pageSize ?? "100"),
      })).items)
    : await buildReportFromDiscoveryFile(inputPath);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ ...result, inputPath: fromDb ? null : inputPath }, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ ...result, inputPath: fromDb ? null : inputPath, outputPath }, null, 2)}\n`);
}

async function buildReportFromDiscoveryFile(inputPath: string) {
  const report = JSON.parse(await readFile(inputPath, "utf8")) as { candidates?: PolymarketImportCandidate[] };
  const candidates = Array.isArray(report.candidates) ? report.candidates : [];
  return buildWorldCupAdminReviewReport(candidates);
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const [key, inlineValue] = part.slice(2).split("=", 2);
    if (inlineValue != null) {
      args[key] = inlineValue;
      continue;
    }
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

function argFlag(value: string | undefined, fallback: boolean) {
  if (value == null || value.trim() === "") return fallback;
  return value.trim().toLowerCase() === "true";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
