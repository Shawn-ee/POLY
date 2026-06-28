import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildWorldCupAdminReviewReport } from "@/server/services/polymarket";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";

const DEFAULT_INPUT = path.resolve(process.cwd(), "test-logs", "polymarket-world-cup-discovery-candidates.json");
const DEFAULT_OUTPUT = path.resolve(process.cwd(), "test-logs", "polymarket-admin-review-report.json");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.input ?? DEFAULT_INPUT;
  const outputPath = args.output ?? DEFAULT_OUTPUT;
  const report = JSON.parse(await readFile(inputPath, "utf8")) as { candidates?: PolymarketImportCandidate[] };
  const candidates = Array.isArray(report.candidates) ? report.candidates : [];
  const result = buildWorldCupAdminReviewReport(candidates);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ ...result, inputPath }, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ ...result, inputPath, outputPath }, null, 2)}\n`);
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
