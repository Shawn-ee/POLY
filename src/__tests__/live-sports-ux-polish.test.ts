import fs from "fs";
import path from "path";

const eventPage = fs.readFileSync(
  path.join(process.cwd(), "src", "app", "events", "[slug]", "page.tsx"),
  "utf8",
);

describe("live sports UX polish contract", () => {
  test("sports event page includes market search, status summary, and sticky outcome preview", () => {
    expect(eventPage).toContain("Search markets");
    expect(eventPage).toContain("summarizeMarketStatuses");
    expect(eventPage).toContain("lg:sticky lg:top-6");
    expect(eventPage).toContain("SportsEventView");
  });

  test("legacy sports event page remains display-only outside World Cup trading flow", () => {
    expect(eventPage).toContain("Event-page trading remains gated. Use market detail for the guarded internal beta ticket.");
    expect(eventPage).toContain("Event-page trading is disabled in this display-only phase.");
  });

  test("World Cup soccer events use the dedicated trading page", () => {
    expect(eventPage).toContain("isWorldCupSoccerEvent(nextEvent)");
    expect(eventPage).toContain("<WorldCupEventTradingPage model={worldCupModel} />");
  });
});
