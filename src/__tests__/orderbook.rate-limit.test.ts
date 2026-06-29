import { enforceOrderRateLimit } from "@/server/services/orderRateLimiter";

describe("order rate limiting", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-05T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("3.1 >1 place per second returns 429 error", () => {
    expect(() => enforceOrderRateLimit("u1", "place")).not.toThrow();
    expect(() => enforceOrderRateLimit("u1", "place")).toThrow(
      "Rate limit exceeded for place orders. Limit is 1/second."
    );
  });

  test("3.2 >1 cancel per second returns 429 error", () => {
    expect(() => enforceOrderRateLimit("u1", "cancel")).not.toThrow();
    expect(() => enforceOrderRateLimit("u1", "cancel")).toThrow(
      "Rate limit exceeded for cancel orders. Limit is 1/second."
    );
  });

  test("6.2 rapid place/cancel actions enforce limits independently", () => {
    enforceOrderRateLimit("u2", "place");
    enforceOrderRateLimit("u2", "cancel");
    expect(() => enforceOrderRateLimit("u2", "place")).toThrow();
    expect(() => enforceOrderRateLimit("u2", "cancel")).toThrow();
  });
});
