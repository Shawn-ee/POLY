"use client";

/* eslint-disable react-hooks/purity */

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { EmptyState, ErrorState } from "@/components/ui/States";

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
    load();
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
    return Date.now() >= resolveAt ? "Resolve now" : "Resolve";
  };

  if (loading) {
    return <PageContainer size="default"><Card className="p-6 text-sm text-[var(--poly-muted)]">Loading private markets...</Card></PageContainer>;
  }

  if (error) {
    return (
      <PageContainer size="default">
        <ErrorState>{error}</ErrorState>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="default">
      <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Pools</div>
      <h1 className="mt-1 text-3xl font-semibold text-[var(--poly-text)]">My private markets</h1>
      <p className="mt-1 text-sm text-[var(--poly-muted)]">
        Manage private pool markets you created or joined.
      </p>
      {message ? (
        <div className="mt-4 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] px-3 py-2 text-sm text-[var(--poly-muted)]">
          {message}
        </div>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--poly-text)]">Owned by you</h2>
          <Link
            href="/create"
            className="rounded-lg border border-[var(--poly-border)] bg-white px-3 py-1 text-sm font-semibold text-[var(--poly-text)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
          >
            Create new
          </Link>
        </div>
        {owned.length === 0 ? (
          <EmptyState title="No owned private markets yet" />
        ) : (
          <div className="space-y-3">
            {owned.map((market) => (
              <Card
                key={market.id}
                className="p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-[var(--poly-text)]">{market.title}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={market.status === "LIVE" || market.status === "ACTIVE" ? "positive" : market.status === "RESOLVED" ? "primary" : "neutral"}>{market.status}</Badge>
                      <Badge tone="teal">Pot {market.totalPot.toFixed(2)} U</Badge>
                      <Badge>{market.participants} participants</Badge>
                    </div>
                    <div className="mt-2 text-xs text-[var(--poly-muted)]">
                      {market.participants} participants
                    </div>
                    <div className="mt-1 text-xs text-[var(--poly-muted)]">
                      Bet close:{" "}
                      {market.betCloseTime
                        ? new Date(market.betCloseTime).toLocaleString()
                        : "--"}
                      {" | "}
                      Resolve:{" "}
                      {market.resolveTime
                        ? new Date(market.resolveTime).toLocaleString()
                        : "--"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link
                      href={`/markets/${market.id}`}
                      className="rounded-lg border border-[var(--poly-border)] px-3 py-1 text-[var(--poly-text)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                    >
                      Open
                    </Link>
                    {market.status !== "RESOLVED" ? (
                      <>
                        <Link
                          href={`/markets/${market.id}`}
                          className="rounded-lg border border-[var(--poly-border)] px-3 py-1 text-[var(--poly-text)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                        >
                          {resolveLabel(market)}
                        </Link>
                        <Button
                          onClick={() => cancelMarket(market.id)}
                          variant="negative"
                          size="sm"
                          type="button"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--poly-text)]">You joined</h2>
        {joined.length === 0 ? (
          <EmptyState title="You have not joined any private markets yet" />
        ) : (
          <div className="space-y-3">
            {joined.map((market) => (
              <Card
                key={`${market.id}-${market.myBet.outcomeId}`}
                className="p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-[var(--poly-text)]">{market.title}</div>
                    <div className="mt-1 text-xs text-[var(--poly-muted)]">
                      Status {market.status} | My bet {market.myBet.outcomeName} for{" "}
                      {market.myBet.amount.toFixed(2)} U
                    </div>
                    <div className="mt-1 text-xs text-[var(--poly-muted)]">
                      Pot {market.totalPot.toFixed(2)} U | {market.participants} participants
                    </div>
                  </div>
                  <Link
                    href={`/markets/${market.id}`}
                    className="rounded-lg border border-[var(--poly-border)] px-3 py-1 text-xs text-[var(--poly-text)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                  >
                    Open
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}



