"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, Mail, Sparkles } from "lucide-react";
import { ApiError, authApi } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";

const input =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await authApi<{ detail: string; debug_token?: string }>(
        "/api/auth/password-reset/request/",
        { method: "POST", body: { email }, auth: false }
      );
      // In DEBUG the backend returns the token directly (no email server).
      if (res.debug_token) {
        setToken(res.debug_token);
        setInfo("Dev mode: reset token filled in for you below.");
      } else {
        setInfo("If an account exists, a reset link has been sent to your email.");
      }
      setStep("confirm");
    } catch (err) {
      setError(err instanceof ApiError ? `Request failed (${err.status}).` : "Auth service unreachable.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi("/api/auth/password-reset/confirm/", {
        method: "POST",
        body: { token: token.trim(), new_password: newPassword },
        auth: false,
      });
      setInfo("Password reset. Redirecting to sign in…");
      setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string; token?: string[] })?.detail ??
            (err.body as { token?: string[] })?.token?.[0] ??
            `Reset failed (${err.status}).`)
          : "Auth service unreachable.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="rise w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 shadow-xl shadow-accent/30">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        </div>

        {step === "request" ? (
          <form onSubmit={requestReset} className="glass space-y-4 p-7">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@company.com" className={input} />
            </div>
            {info && <p className="rounded-lg border border-accent/25 bg-accent/10 px-3.5 py-2.5 text-xs text-accent">{info}</p>}
            {error && <p className="rounded-lg border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-xs text-danger">{error}</p>}
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:brightness-110 disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              Send reset token
            </button>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="glass space-y-4 p-7">
            {info && (
              <p className="flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-3.5 py-2.5 text-xs text-accent">
                <CheckCircle2 size={13} /> {info}
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Reset token</label>
              <input value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Paste the token from your email" className={`${input} font-mono`} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">New password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="min. 8 characters" className={input} />
            </div>
            {error && <p className="rounded-lg border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-xs text-danger">{error}</p>}
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:brightness-110 disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
              Set new password
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-[11px] text-ink-muted">
          <Link href="/login" className="font-medium text-accent hover:underline">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
