import { prisma } from "@/lib/db";

let userCounter = 0;

const assertIsolatedTestDatabase = () => {
  const rawUrl = process.env.DATABASE_URL;
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetPublicSchema may only run with NODE_ENV=test.");
  }
  if (process.env.POLY_ALLOW_TEST_DB_RESET !== "true") {
    throw new Error("resetPublicSchema requires POLY_ALLOW_TEST_DB_RESET=true.");
  }
  if (!rawUrl) {
    throw new Error("resetPublicSchema requires DATABASE_URL.");
  }

  let databaseName = "";
  try {
    databaseName = decodeURIComponent(new URL(rawUrl).pathname.replace(/^\//, ""));
  } catch {
    throw new Error("resetPublicSchema requires a valid DATABASE_URL.");
  }

  if (!/(^|[_-])(test|jest|ci)([_-]|$)/i.test(databaseName)) {
    throw new Error(
      `Refusing to reset non-test database "${databaseName}". Use an isolated test/jest database.`,
    );
  }
};

export const resetPublicSchema = async () => {
  assertIsolatedTestDatabase();

  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const tableList = tables
    .map(({ tablename }) => `"public"."${tablename.replace(/"/g, "\"\"")}"`)
    .join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
};

export const createDeterministicUser = async () => {
  userCounter += 1;
  const suffix = `phase3_${process.pid}_${userCounter}`;
  return prisma.user.create({
    data: {
      username: `ledger_${suffix}`,
      email: `ledger_${suffix}@test.local`,
    },
  });
};
