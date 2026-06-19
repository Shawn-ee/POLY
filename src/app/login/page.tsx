"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import PageContainer from "@/components/ui/PageContainer";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error")?.replaceAll("_", " ") ?? "";

  return (
    <PageContainer size="default" className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-5 rounded-lg border border-[var(--poly-border)] bg-white p-5 shadow-[var(--poly-shadow-sm)]">
          <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">
            Internal beta
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--poly-text)]">Sign in to POLY</h1>
          <p className="mt-2 text-sm text-[var(--poly-muted)]">
            Use Google or a wallet to continue. Trading and funding access may be limited
            while POLY is in beta.
          </p>
        </div>
        {error ? (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <AuthModal
          open
          onClose={() => {
            window.location.href = "/";
          }}
          onSuccess={() => {
            window.location.href = "/";
          }}
        />
      </div>
    </PageContainer>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <PageContainer size="default" className="flex min-h-[70vh] items-center justify-center">
          <p className="text-sm text-[var(--poly-muted)]">Loading sign-in...</p>
        </PageContainer>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
