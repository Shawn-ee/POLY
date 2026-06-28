import fs from "fs";
import path from "path";

describe("closed beta runtime safety surfaces", () => {
  test("admin runtime route uses shared status service and does not serialize env secrets directly", () => {
    const routeSource = fs.readFileSync(path.join(process.cwd(), "src", "app", "api", "admin", "runtime", "route.ts"), "utf8");
    const serviceSource = fs.readFileSync(path.join(process.cwd(), "src", "server", "services", "closedBetaRuntimeStatus.ts"), "utf8");

    expect(routeSource).toContain("assertReferenceBotAdmin");
    expect(routeSource).toContain("getClosedBetaRuntimeStatus");
    expect(serviceSource).toContain("unsafeFlags");
    expect(serviceSource).not.toContain("NEXTAUTH_SECRET");
    expect(serviceSource).not.toContain("GOOGLE_CLIENT_SECRET");
    expect(serviceSource).not.toContain("DATABASE_URL");
  });
});

