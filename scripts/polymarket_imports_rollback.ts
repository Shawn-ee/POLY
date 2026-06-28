import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { executePolymarketImportRollback } from "@/server/services/polymarket";
import { prisma } from "@/lib/db";

const DEFAULT_OUTPUT = path.resolve(process.cwd(), "test-logs", "polymarket-imports-rollback-report.json");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.output ?? DEFAULT_OUTPUT;
  const result = await executePolymarketImportRollback({
    selector: {
      batchId: args.batchId,
      source: args.source,
      candidateIds: args.candidateIds?.split(",").map((item) => item.trim()).filter(Boolean),
    },
    confirmRollback: argFlag(args.confirmRollback, false),
    reason: args.reason,
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ ...result, outputPath }, null, 2)}\n`);
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

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
