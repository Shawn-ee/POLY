"use client";

import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import TransferCryptoModal from "@/components/TransferCryptoModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";

type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "BET" | "PAYOUT" | string;
  amount: number;
  status: "CREATED" | "SUBMITTED" | "CONFIRMED" | "FAILED" | string;
  txHash: string | null;
  createdAt: string;
};

type LinkedWallet = {
  id: string;
  address: string;
  checksumAddress: string;
  chainId: number;
  linkMethod: "SIGNATURE" | "MANUAL" | string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
};

type WithdrawalItem = {
  id: string;
  amountUSDC: string;
  destinationAddress: string | null;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  rejectedAt: string | null;
  txHash: string | null;
  adminNotes: string | null;
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}

export default function WalletPage() {
  const [availableBalance, setAvailableBalance] = useState<unknown>(null);
  const [lockedBalance, setLockedBalance] = useState<unknown>(null);
  const [totalBalance, setTotalBalance] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const depositAddressInfo: {
    network: string;
    token: string;
    address: string;
    minimumDeposit: string;
    confirmationsRequired: number;
    warnings: string[];
  } = {
    network: "Polygon",
    token: "USDC",
    address: "",
    minimumDeposit: "2.00",
    confirmationsRequired: 0,
    warnings: [],
  };
  const depositHistory: Array<{
    id: string;
    amount: string;
    status: string;
    confirmations: number;
    detectedAt: string;
    txHash: string;
    warnings?: string[];
  }> = [];
  const depositLoading = false;
  const depositError = "";
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [usdcBalances, setUsdcBalances] = useState<Record<string, string>>({});
  const [walletError, setWalletError] = useState("");
  const [walletNotice, setWalletNotice] = useState("");
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [manualWalletAddress, setManualWalletAddress] = useState("");
  const [manualLinking, setManualLinking] = useState(false);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("25");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawDestinationMode, setWithdrawDestinationMode] = useState<"linked" | "custom">(
    "custom"
  );
  const [withdrawDestinationTouched, setWithdrawDestinationTouched] = useState(false);
  const [selectedLinkedWithdrawAddress, setSelectedLinkedWithdrawAddress] = useState("");
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  const baseChainId = Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID ?? "8453");
  const wrongNetwork = walletChainId !== null && walletChainId !== baseChainId;

  const isUserRejectedError = (error: unknown) => {
    const err = error as {
      code?: unknown;
      message?: unknown;
      shortMessage?: unknown;
      info?: { error?: { code?: unknown; message?: unknown } };
    };

    const codes = [err?.code, err?.info?.error?.code].map((value) => Number(value));
    if (codes.some((value) => value === 4001)) return true;

    const text = [err?.message, err?.shortMessage, err?.info?.error?.message]
      .filter((value): value is string => typeof value === "string")
      .join(" ")
      .toLowerCase();

    return text.includes("user rejected") || text.includes("action_rejected");
  };

  const toFriendlyWalletError = (error: unknown) => {
    const raw =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Wallet linking failed.";
    const normalized = raw.toLowerCase();

    if (normalized.includes("wrong network")) {
      return `Wrong network. Please switch MetaMask to Base (${baseChainId}).`;
    }
    if (normalized.includes("metamask not detected")) return "MetaMask not detected.";
    if (normalized.includes("unauthorized")) return "Please sign in, then try linking again.";
    if (normalized.includes("already linked")) return "This wallet is already linked to another user.";

    return "Could not link wallet. Please try again.";
  };

  const showWalletNotice = (value: string) => {
    setWalletNotice(value);
    setTimeout(() => setWalletNotice(""), 3000);
  };

  function formatMoney2(v: unknown): string {
    if (v == null) return "--";
    if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(2) : "--";
    if (typeof v === "string") {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n.toFixed(2) : "--";
    }
    if (typeof v === "bigint") return v.toString();
    if (
      typeof v === "object" &&
      v &&
      "toNumber" in v &&
      typeof (v as { toNumber?: unknown }).toNumber === "function"
    ) {
      const n = (v as { toNumber: () => number }).toNumber();
      return Number.isFinite(n) ? n.toFixed(2) : "--";
    }
    const n = Number(v as unknown);
    return Number.isFinite(n) ? n.toFixed(2) : "--";
  }

  const loadBalance = async () => {
    const [balanceRes, meRes] = await Promise.all([
      fetch("/api/wallet/balance"),
      fetch("/api/auth/me"),
    ]);
    if (!balanceRes.ok) {
      setMessage("Please log in to view your wallet.");
      return;
    }
    const balanceData = await balanceRes.json();
    setAvailableBalance(balanceData.availableUSDC ?? balanceData.balance ?? 0);
    setLockedBalance(balanceData.lockedUSDC ?? 0);
    setTotalBalance(balanceData.totalUSDC ?? balanceData.balance ?? 0);
    if (meRes.ok) {
      await meRes.json().catch(() => null);
    }
  };

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    const res = await fetch("/api/wallet/transactions");
    const data = await res.json().catch(() => null);
    setTransactionsLoading(false);
    if (!res.ok) {
      setTransactions([]);
      return;
    }
    setTransactions(data?.transactions ?? []);
  };

  const loadWithdrawals = async () => {
    setWithdrawalsLoading(true);
    const res = await fetch("/api/withdrawals");
    const data = await res.json().catch(() => null);
    setWithdrawalsLoading(false);
    if (!res.ok) {
      setWithdrawals([]);
      return;
    }
    setWithdrawals((data?.items ?? []) as WithdrawalItem[]);
  };

  const loadWallets = async () => {
    setWalletsLoading(true);
    const res = await fetch("/api/wallet/list");
    const data = await res.json().catch(() => null);
    setWalletsLoading(false);
    if (!res.ok) {
      setWallets([]);
      return [] as LinkedWallet[];
    }
    const nextWallets = (data?.wallets ?? []) as LinkedWallet[];
    setWallets(nextWallets);
    return nextWallets;
  };

  const loadUsdcBalances = async (nextWallets: LinkedWallet[]) => {
    if (nextWallets.length === 0) {
      setUsdcBalances({});
      return;
    }
    const responses = await Promise.all(
      nextWallets.map(async (wallet) => {
        const res = await fetch(
          `/api/wallet/usdc-balance?address=${encodeURIComponent(wallet.address)}`
        );
        const data = await res.json().catch(() => null);
        return {
          address: wallet.address,
          balance: res.ok ? String(data?.balance ?? "0") : "N/A",
        };
      })
    );
    const nextMap: Record<string, string> = {};
    for (const row of responses) {
      nextMap[row.address] = row.balance;
    }
    setUsdcBalances(nextMap);
  };

  const refreshWalletData = async () => {
    const nextWallets = await loadWallets();
    await loadUsdcBalances(nextWallets);
  };

  const loadNetworkState = async () => {
    if (!window.ethereum) {
      setWalletChainId(null);
      return;
    }
    try {
      const chainHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      setWalletChainId(parseInt(chainHex, 16));
    } catch {
      setWalletChainId(null);
    }
  };

  useEffect(() => {
    void loadBalance();
    void loadTransactions();
    void loadWithdrawals();
    void refreshWalletData();
    void loadNetworkState();

    if (!window.ethereum) return;
    const onChainChanged = () => {
      void loadNetworkState();
    };
    window.ethereum.on?.("chainChanged", onChainChanged);
    return () => {
      window.ethereum?.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadBalance();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const activeWallets = wallets.filter((wallet) => wallet.isActive);
    if (activeWallets.length === 0) {
      setWithdrawDestinationMode("custom");
      setSelectedLinkedWithdrawAddress("");
      return;
    }

    if (!selectedLinkedWithdrawAddress) {
      setSelectedLinkedWithdrawAddress(activeWallets[0].address);
    } else if (!activeWallets.some((wallet) => wallet.address === selectedLinkedWithdrawAddress)) {
      setSelectedLinkedWithdrawAddress(activeWallets[0].address);
    }

    // Prefer linked wallet by default, but do not override explicit user selection.
    if (!withdrawDestinationTouched && withdrawDestinationMode !== "linked" && !withdrawAddress.trim()) {
      setWithdrawDestinationMode("linked");
    }
  }, [
    wallets,
    selectedLinkedWithdrawAddress,
    withdrawDestinationMode,
    withdrawAddress,
    withdrawDestinationTouched,
  ]);

  const handleSwitchToBase = async () => {
    setWalletError("");
    if (!window.ethereum) {
      setWalletError("MetaMask not detected.");
      return;
    }
    setSwitchingNetwork(true);
    try {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }],
        });
      } catch (switchError) {
        const code =
          typeof switchError === "object" && switchError !== null && "code" in switchError
            ? Number((switchError as { code: unknown }).code)
            : null;
        if (code !== 4902) throw switchError;

        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x2105",
              chainName: "Base",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://mainnet.base.org"],
              blockExplorerUrls: ["https://basescan.org"],
            },
          ],
        });
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }],
        });
      }
      await loadNetworkState();
      await refreshWalletData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to switch network to Base.";
      setWalletError(errorMessage);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const handleLinkWallet = async () => {
    setWalletError("");
    setWalletNotice("");
    setMessage("");
    setLinkingWallet(true);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected.");
      }

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts?.[0];
      if (!address) throw new Error("No wallet address found.");

      const chainHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      const chainId = parseInt(chainHex, 16);
      setWalletChainId(chainId);
      if (chainId !== baseChainId) {
        throw new Error(`Wrong network. Please switch MetaMask to Base (${baseChainId}).`);
      }

      const challengeRes = await fetch(
        `/api/wallet/challenge?address=${encodeURIComponent(address)}`
      );
      const challengeData = await challengeRes.json().catch(() => null);
      if (!challengeRes.ok) {
        const errorMessage = challengeData?.error ?? "Failed to get wallet challenge.";
        throw new Error(errorMessage);
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(challengeData.message);

      const linkRes = await fetch("/api/wallet/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          message: challengeData.message,
          signature,
        }),
      });
      const linkData = await linkRes.json().catch(() => null);
      if (!linkRes.ok) {
        const errorMessage = linkData?.error ?? "Wallet linking failed.";
        throw new Error(errorMessage);
      }

      setMessage("Wallet linked.");
      await Promise.all([refreshWalletData(), loadBalance()]);
    } catch (error) {
      if (isUserRejectedError(error)) {
        setWalletError("");
        showWalletNotice("Wallet linking canceled.");
      } else {
        setWalletError(toFriendlyWalletError(error));
      }
      if (process.env.NODE_ENV !== "production") {
        console.error("[wallet] link failed", error);
      }
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleManualLinkWallet = async () => {
    setWalletError("");
    setMessage("");
    const address = manualWalletAddress.trim();
    if (!address) {
      setWalletError("Enter a wallet address.");
      return;
    }
    setManualLinking(true);
    try {
      const res = await fetch("/api/wallet/link-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const errorMessage = data?.error ?? "Manual wallet linking failed.";
        throw new Error(errorMessage);
      }
      setManualWalletAddress("");
      setMessage("Wallet linked manually.");
      await Promise.all([refreshWalletData(), loadBalance()]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Manual wallet linking failed.";
      setWalletError(errorMessage);
    } finally {
      setManualLinking(false);
    }
  };

  const handleFaucet = async () => {
    setMessage("");
    const res = await fetch("/api/wallet/faucet", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Faucet failed.");
      return;
    }
    await loadBalance();
    window.dispatchEvent(new Event("wallet:balance-updated"));
    setMessage(`Credited ${data.credited} U.`);
    await loadTransactions();
  };

  const handleWithdraw = async () => {
    setMessage("");
    const destinationAddress =
      withdrawDestinationMode === "linked"
        ? selectedLinkedWithdrawAddress
        : withdrawAddress.trim();

    if (!withdrawAmount.trim()) {
      setMessage("Enter a withdrawal amount.");
      return;
    }
    if (!destinationAddress) {
      setMessage("Select a linked wallet or enter a destination address.");
      return;
    }
    if (
      withdrawDestinationMode === "custom" &&
      !/^0x[a-fA-F0-9]{40}$/.test(destinationAddress)
    ) {
      setMessage("Enter a valid wallet address.");
      return;
    }

    const res = await fetch("/api/withdrawals/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: withdrawAmount,
        address: destinationAddress,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error ?? "Withdraw request failed.");
      return;
    }
    setMessage("Withdrawal requested and funds locked.");
    await Promise.all([loadTransactions(), loadBalance(), loadWithdrawals()]);
  };

  const formatType = (type: string) => {
    if (type === "DEPOSIT") return "Deposit";
    if (type === "WITHDRAW") return "Withdraw";
    if (type === "BET") return "Bet";
    if (type === "PAYOUT") return "Payout";
    return type;
  };

  const formatStatus = (status: string) => {
    if (status === "CREATED") return "Created";
    if (status === "SUBMITTED") return "Submitted";
    if (status === "CONFIRMED") return "Confirmed";
    if (status === "FAILED") return "Failed";
    return status;
  };

  return (
    <PageContainer size="default">
      {/* Internal Beta Banner */}
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">
        Internal Beta: test credits only. Deposits and withdrawals are disabled.
      </div>
      <div>
        <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Account</div>
        <h1 className="mt-1 text-3xl font-semibold text-[var(--poly-text)]">Wallet</h1>
      </div>
      <Card className="mt-4 p-4">
        <div className="text-sm font-semibold text-[var(--poly-muted)]">Balance</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <div>
            <div className="text-xs text-neutral-500">Available</div>
            <div className="text-xl font-semibold">{formatMoney2(availableBalance)} U</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Locked</div>
            <div className="text-xl font-semibold">{formatMoney2(lockedBalance)} U</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Total</div>
            <div className="text-xl font-semibold">{formatMoney2(totalBalance)} U</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={handleFaucet}
            variant="outline"
            type="button"
          >
            Request faucet
          </Button>
        </div>
        {message ? <div className="mt-3 text-sm text-neutral-600">{message}</div> : null}
      </Card>

      <Card className="mt-6 p-4">
        <h2 className="text-lg font-semibold text-[var(--poly-text)]">Deposit</h2>
        <p className="mt-1 text-sm text-[var(--poly-muted)]">
          During internal beta, deposits are disabled. Use the faucet to get test credits.
        </p>
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-neutral-900">Real-money deposits disabled</div>
              <div className="mt-1 text-sm text-neutral-600">
                Internal beta uses test credits only. Real-money deposit functionality is coming soon.
              </div>
            </div>
            <button
              disabled
              title="Coming soon — internal beta uses test credits only."
              className="rounded-2xl bg-neutral-300 px-4 py-3 text-sm font-medium text-neutral-500 cursor-not-allowed"
              type="button"
            >
              Coming soon
            </button>
          </div>
        </div>
        {false ? (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          {depositAddressInfo ? (
            <>
              <div className="grid gap-4 md:grid-cols-[1fr_200px]">
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Network</div>
                      <div className="mt-1 text-sm text-neutral-800">{depositAddressInfo.network}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Token</div>
                      <div className="mt-1 text-sm text-neutral-800">{depositAddressInfo.token}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Deposit address</div>
                    <div className="mt-1 break-all rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-sm text-neutral-800">
                      {depositAddressInfo.address}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(depositAddressInfo.address)}
                        className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                        type="button"
                      >
                        Copy address
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Minimum deposit</div>
                      <div className="mt-1 text-sm text-neutral-800">${depositAddressInfo.minimumDeposit}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Confirmations</div>
                      <div className="mt-1 text-sm text-neutral-800">{depositAddressInfo.confirmationsRequired}</div>
                    </div>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {depositAddressInfo.warnings.map((warning) => (
                      <div key={warning}>{warning}</div>
                    ))}
                  </div>
                </div>
                <div className="flex items-start justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      depositAddressInfo.address,
                    )}`}
                    alt="Deposit address QR code"
                    className="h-[180px] w-[180px] rounded-md border border-neutral-200 bg-white p-2"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-md border border-neutral-200 bg-white p-3">
                <div className="text-sm font-medium text-neutral-800">Deposit history</div>
                {depositLoading ? (
                  <div className="mt-2 text-sm text-neutral-600">Refreshing deposits...</div>
                ) : depositHistory.length === 0 ? (
                  <div className="mt-2 text-sm text-neutral-600">Waiting for deposit.</div>
                ) : (
                  <div className="mt-3 space-y-2 text-sm">
                    {depositHistory.slice(0, 10).map((deposit) => (
                      <div key={deposit.id} className="rounded-md border border-neutral-100 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>{Number(deposit.amount).toFixed(2)} USDC</span>
                          <span className="text-neutral-600">{deposit.status}</span>
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {deposit.confirmations} confirmations · {new Date(deposit.detectedAt).toLocaleString()}
                        </div>
                        <div className="mt-1 font-mono text-xs text-neutral-500">
                          {deposit.txHash}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-neutral-600">
              {depositError || "Loading Polygon USDC deposit address..."}
            </div>
          )}
        </div>
        ) : null}
      </Card>

      <Card className="mt-6 p-4">
        <h2 className="text-lg font-semibold text-[var(--poly-text)]">Withdraw</h2>
        <div className="mt-4 rounded-lg border border-dashed border-[var(--poly-border)] bg-[var(--poly-surface-muted)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--poly-muted)]">Withdrawals coming soon</p>
          <p className="mt-1 text-xs text-[var(--poly-muted)]">
            Internal beta uses test credits only. Real-money withdrawals are not yet available.
          </p>
        </div>
      </Card>

      <Card id="history" className="mt-6 p-4">
        <h2 className="text-lg font-semibold text-[var(--poly-text)]">Transaction history</h2>
        <p className="mt-1 text-sm text-[var(--poly-muted)]">Deposits and withdrawals</p>

        {transactionsLoading ? (
          <div className="mt-4 text-sm text-neutral-600">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="mt-4 text-sm text-neutral-600">No transactions yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600">
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-neutral-100">
                    <td className="px-2 py-2 text-neutral-700">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-neutral-700">{formatType(tx.type)}</td>
                    <td className="px-2 py-2 text-neutral-700">
                      {Number(tx.amount ?? 0).toFixed(2)} U
                    </td>
                    <td className="px-2 py-2 text-neutral-700">{formatStatus(tx.status)}</td>
                    <td className="px-2 py-2 text-neutral-700">
                      {tx.txHash ? (
                        <div className="flex items-center gap-2">
                          <span>
                            {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(tx.txHash as string)}
                            className="rounded border border-neutral-300 px-2 py-0.5 text-xs"
                            type="button"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6 p-4">
        <h2 className="text-lg font-semibold text-[var(--poly-text)]">Withdrawal requests</h2>
        {withdrawalsLoading ? (
          <div className="mt-3 text-sm text-neutral-600">Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div className="mt-3 text-sm text-neutral-600">No withdrawals yet.</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600">
                  <th className="px-2 py-2 font-medium">Requested</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Address</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="px-2 py-2 text-neutral-700">
                      {new Date(item.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-neutral-700">{formatMoney2(item.amountUSDC)}</td>
                    <td className="px-2 py-2 text-neutral-700">{item.destinationAddress ?? "--"}</td>
                    <td className="px-2 py-2 text-neutral-700">{item.status}</td>
                    <td className="px-2 py-2 text-neutral-700">
                      {item.txHash
                        ? `${item.txHash.slice(0, 10)}...${item.txHash.slice(-8)}`
                        : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--poly-text)]">My Wallets</h2>
            <p className="mt-1 text-sm text-[var(--poly-muted)]">
              Wallets linked to your account for login and withdrawals.
            </p>
          </div>
          <Button
            onClick={handleLinkWallet}
            disabled={linkingWallet}
            variant="outline"
            type="button"
          >
            {linkingWallet ? "Linking..." : "Link new wallet"}
          </Button>
        </div>

        {wrongNetwork ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <span>Wrong network. Please switch MetaMask to Base ({baseChainId}).</span>
            <button
              onClick={handleSwitchToBase}
              disabled={switchingNetwork}
              className="rounded border border-amber-300 px-2 py-1 text-xs disabled:opacity-60"
              type="button"
            >
              {switchingNetwork ? "Switching..." : "Switch to Base"}
            </button>
          </div>
        ) : null}

        {walletsLoading ? (
          <div className="mt-4 text-sm text-neutral-600">Loading wallets...</div>
        ) : wallets.length === 0 ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            No linked wallets yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600">
                  <th className="px-2 py-2 font-medium">Address</th>
                  <th className="px-2 py-2 font-medium">Chain</th>
                  <th className="px-2 py-2 font-medium">USDC balance</th>
                  <th className="px-2 py-2 font-medium">Linked At</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className="border-b border-neutral-100">
                    <td className="px-2 py-2 font-mono text-xs text-neutral-700">
                      {wallet.checksumAddress}
                    </td>
                    <td className="px-2 py-2 text-neutral-700">{wallet.chainId}</td>
                    <td className="px-2 py-2 text-neutral-700">
                      {usdcBalances[wallet.address] ?? "..."}
                    </td>
                    <td className="px-2 py-2 text-neutral-700">
                      {new Date(wallet.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-neutral-700">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={wallet.isActive ? "positive" : "neutral"}>{wallet.isActive ? "active" : "inactive"}</Badge>
                        <Badge tone={wallet.isVerified ? "primary" : "warning"}>{wallet.isVerified ? "verified" : "unverified"}</Badge>
                        <Badge>{wallet.linkMethod.toLowerCase()}</Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <h3 className="text-sm font-semibold">Manually link a wallet (fallback)</h3>
          <p className="mt-1 text-xs text-neutral-600">
            Use this if the signature flow fails.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={manualWalletAddress}
              onChange={(event) => setManualWalletAddress(event.target.value)}
              placeholder="0x..."
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <div className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700">
              App network
            </div>
            <Button
              onClick={handleManualLinkWallet}
              disabled={manualLinking}
              variant="outline"
              type="button"
            >
              {manualLinking ? "Adding..." : "Add wallet"}
            </Button>
          </div>
        </div>

        {walletError ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {walletError}
          </div>
        ) : null}
        {walletNotice ? (
          <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            {walletNotice}
          </div>
        ) : null}
      </Card>
      <TransferCryptoModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        platformBalance={Number(totalBalance ?? 0)}
      />
    </PageContainer>
  );
}
