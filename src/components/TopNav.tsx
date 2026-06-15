"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthModal from "@/components/AuthModal";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import TransferCryptoModal from "@/components/TransferCryptoModal";

type User = {
  id: string;
  username: string;
  displayName: string | null;
  image: string | null;
  walletAddress: string | null;
  pendingDeposits?: number | null;
  pendingBalance?: number | null;
  uBalance?: number | null;
  tokenBalance?: number | null;
  isAdmin: boolean;
};

export default function TopNav() {
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [toast, setToast] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const loadUser = async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setUser(data.user ?? null);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadUser();
    });
    const onWalletUpdated = () => {
      void loadUser();
    };
    window.addEventListener("wallet:balance-updated", onWalletUpdated as EventListener);
    return () => {
      window.removeEventListener("wallet:balance-updated", onWalletUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setIsDesktop(window.matchMedia("(min-width: 1024px)").matches);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const clearTimers = () => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    window.location.href = "/";
  };

  const openMenuByHover = () => {
    if (!isDesktop) return;
    clearTimers();
    openTimerRef.current = window.setTimeout(() => setMenuOpen(true), 100);
  };

  const closeMenuByHover = () => {
    if (!isDesktop) return;
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => setMenuOpen(false), 140);
  };

  const toggleMenuByClick = () => {
    if (isDesktop) return;
    setMenuOpen((value) => !value);
  };

  const uBalance = Number(user?.uBalance ?? user?.tokenBalance ?? 0);
  const pendingBalance = Number(
    user?.pendingBalance ?? user?.pendingDeposits ?? 0
  );
  const initials = (user?.displayName || user?.username || "U").slice(0, 1).toUpperCase();

  return (
    <header className="border-b border-neutral-200 bg-white">
      {/* Internal Beta Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="mx-auto max-w-6xl px-4 py-2 text-center text-xs font-medium text-amber-800">
          ⚠️ Internal Beta — Test credits only. Deposits and withdrawals are disabled.
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-lg font-semibold">
            Poly Market
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-700">
            <Link href="/markets">Markets</Link>
            <Link href="/sports">Sports</Link>
            <Link href="/create">Create your own market</Link>
            {user?.isAdmin ? (
              <>
                <Link href="/admin">Admin</Link>
                <Link href="/admin/bots">Bot Monitor</Link>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="rounded-md border border-neutral-200 px-3 py-1.5 text-right">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Portfolio
                </div>
                <div className="text-xs font-medium text-neutral-800">
                  {uBalance.toFixed(2)} {CURRENCY_SYMBOL}
                </div>
              </div>
              <div className="rounded-md border border-neutral-200 px-3 py-1.5 text-right">
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Pending
                </div>
                <div className="text-xs font-medium text-neutral-800">
                  {pendingBalance.toFixed(2)} {CURRENCY_SYMBOL}
                </div>
              </div>
              <button
                disabled
                title="Coming soon — internal beta uses test credits only."
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-400 cursor-not-allowed"
                type="button"
              >
                Deposit
              </button>
              <button
                className="hidden h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-sm text-neutral-700 lg:flex"
                type="button"
                aria-label="Notifications"
              >
                Bell
              </button>
              <div
                ref={menuRef}
                className="relative"
                onMouseEnter={openMenuByHover}
                onMouseLeave={closeMenuByHover}
              >
                <button
                  onClick={toggleMenuByClick}
                  className="flex items-center gap-2 rounded-full border border-neutral-300 px-2 py-1"
                  type="button"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt="avatar"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold">
                      {initials}
                    </span>
                  )}
                  <span className="text-sm text-neutral-800">
                    {user.displayName || user.username}
                  </span>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                    <Link
                      href="/wallet"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      Wallet
                    </Link>
                    <Link
                      href="/portfolio"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      Portfolio
                    </Link>
                    <Link
                      href="/my-pools"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      My private markets
                    </Link>
                    <div className="my-1 border-t border-neutral-200" />
                    <button
                      disabled
                      title="Coming soon — internal beta uses test credits only."
                      className="block w-full px-4 py-2 text-left text-sm text-neutral-400 cursor-not-allowed"
                      type="button"
                    >
                      Withdraw
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                      type="button"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-400"
              type="button"
            >
              Log in
            </button>
          )}
        </div>
      </div>

      {toast ? (
        <div className="mx-auto max-w-6xl px-4 pb-2">
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            {toast}
          </div>
        </div>
      ) : null}

      <AuthModal
        open={authOpen}
        mode="login"
        onClose={() => setAuthOpen(false)}
        onSuccess={async () => {
          setAuthOpen(false);
          await loadUser();
          setToast("Logged in.");
        }}
      />

      <TransferCryptoModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        platformBalance={uBalance}
      />

    </header>
  );
}
