"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PoolMarketItem = {
  id: string;
  title: string;
  status: string;
  betCloseTime: string | null;
  resolveTime: string | null;
  resolvedOutcomeId: string | null;
  outcomes: { id: string; name: string }[];
  totalPot: number;
  participants: number;
};

type JoinedMarketItem = PoolMarketItem & {
  myBet: {
    outcomeId: string;
    outcomeName: string;
    amount: number;
  };
  isOwner: boolean;
};

export default function MyPoolsPage() {
  const [owned, setOwned] = useState<PoolMarketItem[]>([]);
  const [joined, setJoined] = useState<JoinedMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [nowMs] = useState(() => Date.now());

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/pool-markets/mine");
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Failed to load private markets.");
      return;
    }
    setOwned(data.owned ?? []);
    setJoined(data.joined ?? []);
  };

  useEffect(() => {
    let canceled = false;

    const loadInitial = async () => {
      const res = await fetch("/api/pool-markets/mine");
      const data = await res.json().catch(() => null);
      if (canceled) return;
      setLoading(false);
      if (!res.ok) {
        setError(data?.error ?? "Failed to load private markets.");
        return;
      }
      setOwned(data.owned ?? []);
      setJoined(data.joined ?? []);
    };

    void loadInitial();

    return () => {
      canceled = true;
    };
  }, []);

  const cancelMarket = async (marketId: string) => {
    setMessage("");
    const ok = window.confirm("Cancel this market and refund all participants?");
    if (!ok) return;
    const res = await fetch(`/api/pool-markets/${marketId}/cancel`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error ?? "Failed to cancel market.");
      return;
    }
    setMessage("Market canceled and refunded.");
    await load();
  };

  const resolveLabel = (market: PoolMarketItem) => {
    if (!market.resolveTime) return "Resolve";
    const resolveAt = new Date(market.resolveTime).getTime();
    return nowMs >= resolveAt ? "Resolve now" : "Resolve";
  };

  const formatDateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString() : "Not set";

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
          Loading private markets...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My private markets</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Track pools you created or joined. Private pool actions remain separate from
            public sports markets.
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex w-fit items-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800"
        >
          Create new
        </Link>
      </div>
      {message ? (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          {message}
        </div>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Owned by you</h2>
            <p className="text-xs text-neutral-500">Pools where you can manage owner actions.</p>
          </div>
        </div>
        {owned.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">
            No owned private markets yet. Create a pool only when you are ready to manage
            participants and resolution timing.
          </div>
        ) : (
          <div className="space-y-3">
            {owned.map((market) => (
              <div
                key={market.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold">{market.title}</div>
                      <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                        {market.status}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-neutral-600 sm:grid-cols-2">
                      <div>Pot {market.totalPot.toFixed(2)} U</div>
                      <div>{market.participants} participants</div>
                      <div>Bet close: {formatDateTime(market.betCloseTime)}</div>
                      <div>Resolve: {formatDateTime(market.resolveTime)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link
                      href={`/markets/${market.id}`}
                      className="rounded-md border border-neutral-300 px-3 py-1 text-neutral-700"
                    >
                      Open
                    </Link>
                    {market.status !== "RESOLVED" ? (
                      <>
                        <Link
                          href={`/markets/${market.id}`}
                          className="rounded-md border border-neutral-300 px-3 py-1 text-neutral-700"
                        >
                          {resolveLabel(market)}
                        </Link>
                        <button
                          onClick={() => cancelMarket(market.id)}
                          className="rounded-md border border-neutral-300 px-3 py-1 text-neutral-700"
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">You joined</h2>
          <p className="text-xs text-neutral-500">Pools where you already have a recorded bet.</p>
        </div>
        {joined.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">
            You have not joined any private markets yet.
          </div>
        ) : (
          <div className="space-y-3">
            {joined.map((market) => (
              <div
                key={`${market.id}-${market.myBet.outcomeId}`}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold">{market.title}</div>
                      <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                        {market.status}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-neutral-600 sm:grid-cols-2">
                      <div>
                        My bet: {market.myBet.outcomeName} for {market.myBet.amount.toFixed(2)} U
                      </div>
                      <div>Pot {market.totalPot.toFixed(2)} U</div>
                      <div>{market.participants} participants</div>
                    </div>
                  </div>
                  <Link
                    href={`/markets/${market.id}`}
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}



