"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";

type PoolMarketResponse = {
  market: {
    id: string;
    title: string;
    description: string;
    status: string;
    ownerId: string | null;
    isOwner: boolean;
    betCloseTime: string | null;
    resolveTime: string | null;
    hidePicksUntilClose: boolean;
    outcomes: { id: string; name: string }[];
    presets: number[];
    participants: number;
    maxParticipants: number;
    totalPot: number;
    totalsByOutcome: Record<string, { amount: number; count: number }>;
    myBet: { outcomeId: string; amount: number } | null;
  };
};

const timeLeftLabel = (targetIso: string | null) => {
  if (!targetIso) return "--";
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return "closed";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export default function PoolMarketDetail({ marketId }: { marketId: string }) {
  const searchParams = useSearchParams();
  const isInvite = searchParams.get("invite") === "1";
  const [data, setData] = useState<PoolMarketResponse["market"] | null>(null);
  const [outcomeId, setOutcomeId] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [viewState, setViewState] = useState<
    "loadingAuth" | "unauthenticated" | "joiningInvite" | "loadingMarket" | "forbidden" | "ready" | "error"
  >("loadingAuth");

  const loginReturnTo = useMemo(() => {
    if (typeof window === "undefined") return `/markets/${marketId}${isInvite ? "?invite=1" : ""}`;
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }, [marketId, isInvite]);

  const loginHref = useMemo(
    () => `/api/auth/google/start?returnTo=${encodeURIComponent(loginReturnTo)}`,
    [loginReturnTo]
  );

  const loadMarket = useCallback(async () => {
    setViewState("loadingMarket");
    const res = await fetch(`/api/pool-markets/${marketId}`);
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401) {
        setMessage(isInvite ? "Login required to accept this private invite." : "Please log in to view this market.");
        setData(null);
        setViewState("unauthenticated");
        return false;
      }
      if (res.status === 403) {
        setMessage(payload?.error ?? "You do not have access to this private market.");
        setData(null);
        setViewState("forbidden");
        return false;
      }
      setMessage(payload?.error ?? "Failed to load pool market.");
      setData(null);
      setViewState("error");
      return false;
    }

    setData(payload.market);
    if (!outcomeId && payload.market.outcomes.length) {
      setOutcomeId(payload.market.outcomes[0].id);
    }
    if (amount === null && payload.market.presets.length) {
      setAmount(payload.market.presets[0]);
    }
    setViewState("ready");
    return true;
  }, [amount, isInvite, marketId, outcomeId]);

  const initialize = useCallback(async () => {
    setMessage("");
    setViewState("loadingAuth");

    const authRes = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
    const authPayload = authRes ? await authRes.json().catch(() => null) : null;
    const isAuthenticated = Boolean(authRes?.ok && authPayload?.user?.id);

    if (!isAuthenticated && isInvite) {
      setData(null);
      setMessage("Login required to accept this private invite.");
      setViewState("unauthenticated");
      return;
    }

    if (isAuthenticated && isInvite) {
      setViewState("joiningInvite");
      const joinRes = await fetch(`/api/pool-markets/${marketId}/join`, { method: "POST" });
      const joinPayload = await joinRes.json().catch(() => null);
      if (!joinRes.ok && joinRes.status !== 400) {
        if (joinRes.status === 401) {
          setData(null);
          setMessage("Login required to accept this private invite.");
          setViewState("unauthenticated");
          return;
        }
        if (joinRes.status === 403) {
          setData(null);
          setMessage(joinPayload?.error ?? "You do not have access to this private market.");
          setViewState("forbidden");
          return;
        }
        setData(null);
        setMessage(joinPayload?.error ?? "Failed to accept invite.");
        setViewState("error");
        return;
      }
    }

    await loadMarket();
  }, [isInvite, loadMarket, marketId]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return `/markets/${marketId}?invite=1`;
    return `${window.location.origin}/markets/${marketId}?invite=1`;
  }, [marketId]);

  const placeBet = async () => {
    if (!outcomeId || !amount) return;
    const res = await fetch(`/api/pool-markets/${marketId}/bet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcomeId, amount }),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(payload?.error ?? "Failed to place bet.");
      return;
    }
    setMessage("Bet placed.");
    await loadMarket();
  };

  const resolve = async () => {
    if (!outcomeId) return;
    const res = await fetch(`/api/pool-markets/${marketId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winningOutcomeId: outcomeId }),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(payload?.error ?? "Failed to resolve market.");
      return;
    }
    setMessage("Market resolved.");
    await loadMarket();
  };

  const cancel = async () => {
    const res = await fetch(`/api/pool-markets/${marketId}/cancel`, {
      method: "POST",
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(payload?.error ?? "Failed to cancel market.");
      return;
    }
    setMessage("Market canceled and refunded.");
    await loadMarket();
  };

  if (viewState === "loadingAuth") {
    return <PageContainer size="default"><Card className="p-6 text-sm text-[var(--poly-muted)]">Checking login...</Card></PageContainer>;
  }

  if (viewState === "joiningInvite") {
    return <PageContainer size="default"><Card className="p-6 text-sm text-[var(--poly-muted)]">Accepting invite...</Card></PageContainer>;
  }

  if (viewState === "loadingMarket") {
    return <PageContainer size="default"><Card className="p-6 text-sm text-[var(--poly-muted)]">Loading market...</Card></PageContainer>;
  }

  if (viewState === "unauthenticated") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h1 className="text-lg font-semibold">Login required</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {message || "Please log in to continue."}
          </p>
          <a
            href={loginHref}
            className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Continue with Google
          </a>
        </div>
      </main>
    );
  }

  if (viewState === "forbidden") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {message || "You do not have access to this private market."}
          </p>
        </div>
      </main>
    );
  }

  if (viewState === "error" || !data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h1 className="text-lg font-semibold">Could not load market</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {message || "Please try again."}
          </p>
          <button
            type="button"
            onClick={() => void initialize()}
            className="mt-4 rounded-md border border-neutral-300 px-4 py-2 text-sm"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <PageContainer size="default">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{data.title}</h1>
            <p className="mt-1 text-sm text-neutral-600">{data.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="teal">No trading</Badge>
              <Badge tone={data.status === "LIVE" || data.status === "ACTIVE" ? "positive" : data.status === "RESOLVED" ? "primary" : "neutral"}>{data.status}</Badge>
            </div>
          </div>
          {data.isOwner ? (
            <Button
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
              variant="outline"
              size="sm"
              type="button"
            >
              Copy invite link
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <h2 className="text-lg font-semibold">Place your bet</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Betting closes in {timeLeftLabel(data.betCloseTime)}
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {data.outcomes.map((outcome) => (
                <button
                  key={outcome.id}
                  onClick={() => setOutcomeId(outcome.id)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    outcome.id === outcomeId
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 text-neutral-700"
                  }`}
                  type="button"
                >
                  {outcome.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {data.presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    amount === preset
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 text-neutral-700"
                  }`}
                  type="button"
                >
                  {preset} U
                </button>
              ))}
            </div>
            <button
              onClick={placeBet}
              disabled={data.status !== "LIVE" && data.status !== "ACTIVE"}
              className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              type="button"
            >
              Confirm place bet
            </button>
          </div>
          {data.myBet ? (
            <div className="mt-3 text-sm text-neutral-600">
              Your bet:{" "}
              {data.outcomes.find((outcome) => outcome.id === data.myBet?.outcomeId)?.name}{" "}
              for {data.myBet.amount.toFixed(2)} U
            </div>
          ) : null}
          {message ? <div className="mt-3 text-sm text-neutral-600">{message}</div> : null}
        </Card>

        <div className="space-y-4">
          <Card className="p-4 text-sm">
            <div>Total pot: {data.totalPot.toFixed(2)} U</div>
            <div className="mt-1 text-neutral-600">
              Participants: {data.participants}/{data.maxParticipants}
            </div>
          </Card>
          <Card className="p-4 text-sm">
            <h3 className="font-semibold">Pool sides</h3>
            <div className="mt-2 space-y-2">
              {data.outcomes.map((outcome) => {
                const row = data.totalsByOutcome[outcome.id];
                return (
                  <div key={outcome.id} className="flex items-center justify-between">
                    <span>{outcome.name}</span>
                    <span className="text-neutral-600">
                      {row ? `${row.amount.toFixed(2)} • ${row.count} picks` : "Hidden"}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
          {data.isOwner ? (
            <Card className="p-4 text-sm">
              <div className="font-semibold">Owner actions</div>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <button
                  onClick={resolve}
                  className="rounded-md border border-neutral-300 px-3 py-2"
                  type="button"
                >
                  Resolve with selected side
                </button>
                <button
                  onClick={cancel}
                  className="rounded-md border border-neutral-300 px-3 py-2"
                  type="button"
                >
                  Cancel and refund all
                </button>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}

