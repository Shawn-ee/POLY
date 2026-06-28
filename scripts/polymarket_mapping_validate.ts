import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { validatePolymarketCandidateMapping } from "@/server/services/polymarket";
import { PolymarketImportCandidate } from "@/server/services/polymarket/types";

const DEFAULT_INPUT = path.resolve(process.cwd(), "test-logs", "polymarket-world-cup-discovery-candidates.json");
const DEFAULT_OUTPUT = path.resolve(process.cwd(), "test-logs", "polymarket-mapping-validation-report.json");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.input ?? DEFAULT_INPUT;
  const outputPath = args.output ?? DEFAULT_OUTPUT;
  const report = JSON.parse(await readFile(inputPath, "utf8")) as { candidates?: PolymarketImportCandidate[] };
  const candidates = Array.isArray(report.candidates) ? report.candidates : [];
  const validations = candidates.map((candidate) => validatePolymarketCandidateMapping(candidate));
  const result = {
    generatedAt: new Date().toISOString(),
    inputPath,
    dryRun: true,
    autoPromoteEnabled: false,
    candidateCount: candidates.length,
    validatedCount: validations.filter((item) => item.status === "validated").length,
    adminReviewRequiredCount: validations.filter((item) => item.status === "admin_review_required").length,
    blockedCount: validations.filter((item) => item.status === "blocked" || item.status === "draft_only").length,
    unsupportedCount: validations.filter((item) => item.status === "unsupported").length,
    duplicateCount: validations.filter((item) => item.status === "duplicate").length,
    validations,
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
