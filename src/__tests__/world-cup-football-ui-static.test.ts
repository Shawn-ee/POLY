import fs from "fs";
import path from "path";

describe("World Cup football event UI static checks", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "sports", "WorldCupEventTradingPage.tsx"),
    "utf8",
  );

  test("renders a real chart and submits through the guarded internal order API", () => {
    expect(source).toContain("MarketOutcomeChart");
    expect(source).toContain('fetch("/api/orders"');
    expect(source).toContain('executionMode: "MARKET"');
    expect(source).toContain('timeInForce: "IOC"');
  });

  test("does not expose ordinary-user mapping diagnostics or no-local-book copy", () => {
    expect(source).not.toContain("<Diagnostic");
    expect(source).not.toContain("Mapped</");
    expect(source).not.toContain("Fresh refs");
    expect(source).not.toContain("Bot books");
    expect(source).not.toContain("No local book");
  });
});
