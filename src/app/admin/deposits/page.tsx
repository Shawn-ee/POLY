"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";

type AdminDepositItem = {
  id: string;
  userId: string;
  username: string;
  userEmail: string | null;
  depositAddress: string;
  amount: string;
  txHash: string;
  status: string;
  confirmations: number;
  blockNumber: number;
  detectedAt: string;
  creditedAt: string | null;
  fromAddress: string;
  toAddress: string;
};

export default function AdminDepositsPage() {
  const [pending, setPending] = useState<AdminDepositItem[]>([]);
  const [recent, setRecent] = useState<AdminDepositItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromBlock, setFromBlock] = useState("");
  const [rescanBusy, setRescanBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/deposits", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to load deposits.");
      setLoading(false);
      return;
    }
    setPending((data?.pending ?? []) as AdminDepositItem[]);
    setRecent((data?.recent ?? []) as AdminDepositItem[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const rescan = async () => {
    setRescanBusy(true);
    setError("");
    const parsed = Number(fromBlock);
    const res = await fetch("/api/admin/deposits/rescan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(Number.isFinite(parsed) && parsed > 0 ? { fromBlock: parsed } : {}),
      }),
    });
    const data = await res.json().catch(() => null);
    setRescanBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Deposit rescan failed.");
      return;
    }
    await load();
  };

  return (
    <PageContainer size="default">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Admin</div>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--poly-text)]">Deposits</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          type="button"
        >
          Refresh
        </Button>
      </div>

      <Card className="mt-4 p-4">
        <h2 className="text-lg font-semibold text-[var(--poly-text)]">Rescan Polygon USDC</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={fromBlock}
            onChange={(event) => setFromBlock(event.target.value)}
            placeholder="Optional from block"
            className="rounded-lg border border-[var(--poly-border)] px-3 py-2 text-sm focus:border-[var(--poly-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--poly-ring)]"
          />
          <Button
            variant="outline"
            onClick={() => void rescan()}
            disabled={rescanBusy}
            type="button"
          >
            {rescanBusy ? "Rescanning..." : "Run rescan"}
          </Button>
        </div>
      </Card>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-neutral-600">Loading...</p> : null}

      <Card className="mt-6 p-4">
        <h2 className="text-lg font-semibold text-[var(--poly-text)]">Pending / Review</h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No pending deposits.</p>
        ) : (
          <DepositTable items={pending} />
        )}
      </Card>

      <Card className="mt-6 p-4">
        <h2 className="text-lg font-semibold text-[var(--poly-text)]">Credited</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No credited deposits yet.</p>
        ) : (
          <DepositTable items={recent} />
        )}
      </Card>
    </PageContainer>
  );
}

function DepositTable({ items }: { items: AdminDepositItem[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--poly-border)] bg-[var(--poly-surface-muted)] text-[var(--poly-muted)]">
            <th className="px-2 py-2 font-medium">User</th>
            <th className="px-2 py-2 font-medium">Amount</th>
            <th className="px-2 py-2 font-medium">Status</th>
            <th className="px-2 py-2 font-medium">Confirmations</th>
            <th className="px-2 py-2 font-medium">Deposit Address</th>
            <th className="px-2 py-2 font-medium">Tx Hash</th>
            <th className="px-2 py-2 font-medium">Detected</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-100 align-top">
              <td className="px-2 py-2">
                <div>{item.username}</div>
                <div className="text-xs text-neutral-500">{item.userEmail ?? item.userId}</div>
              </td>
              <td className="px-2 py-2">{item.amount}</td>
              <td className="px-2 py-2">{item.status}</td>
              <td className="px-2 py-2">{item.confirmations}</td>
              <td className="px-2 py-2 font-mono text-xs">{item.depositAddress}</td>
              <td className="px-2 py-2 font-mono text-xs">{item.txHash}</td>
              <td className="px-2 py-2">{new Date(item.detectedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
