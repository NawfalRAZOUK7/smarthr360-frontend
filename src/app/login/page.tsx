"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, KeyRound, Loader2, Sparkles } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needsOtp, setNeedsOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [guestBusy, setGuestBusy] = useState(false);

  function showLoginError(err: unknown) {
    if (err instanceof ApiError) {
      const body = err.body as { detail?: string; message?: string } | null;
      if (body?.detail === "otp_required") {
        setNeedsOtp(true);
        setError("Two-factor authentication is enabled — enter your code.");
      } else if (body?.detail === "otp_invalid") {
        setError("Invalid two-factor code.");
      } else {
        setError(body?.message ?? body?.detail ?? "Invalid credentials.");
      }
    } else if (err instanceof TypeError) {
      setError(
        "Auth service unreachable. Start it on :8000, or use demo / demo to explore the UI."
      );
    } else {
      setError("Something went wrong. Please try again.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await login(identifier, password, otp || undefined);
      router.replace("/");
    } catch (err) {
      showLoginError(err);
    } finally {
      setBusy(false);
    }
  }

  async function onGuestLogin() {
    if (busy) return;
    setError(null);
    setBusy(true);
    setGuestBusy(true);
    try {
      await login("guest@demo.smarthr360.dev", "Demo#2026!hr360");
      router.replace("/");
    } catch (err) {
      showLoginError(err);
    } finally {
      setGuestBusy(false);
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
          <h1 className="text-2xl font-bold tracking-tight">
            SmartHR<span className="gradient-text">360</span>
          </h1>
          <p className="text-sm text-ink-muted">
            HR analytics, predictions & decision support
          </p>
        </div>

        <form onSubmit={onSubmit} className="glass space-y-4 p-7">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Email or username
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={busy}
              autoFocus
              autoComplete="username"
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {needsOtp && (
            <div className="rise">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <KeyRound size={12} /> Two-factor code
              </label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                disabled={busy}
                placeholder="123456"
                className="w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.5em] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          )}

          {error && (
            <p className="rise rounded-lg border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-xs text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:brightness-110 disabled:opacity-60"
          >
            {busy && !guestBusy && <Loader2 size={15} className="animate-spin" />}
            Sign in
          </button>

          <button
            type="button"
            onClick={onGuestLogin}
            disabled={busy}
            className="group flex w-full items-center justify-center gap-2 rounded-lg border border-accent/35 bg-accent/[0.06] py-2.5 text-sm font-semibold text-accent shadow-sm transition-all hover:border-accent/55 hover:bg-accent/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guestBusy ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Eye
                size={15}
                className="transition-transform group-hover:scale-110"
                aria-hidden="true"
              />
            )}
            {guestBusy ? "Opening read-only demo…" : "Try the live demo (read-only)"}
          </button>

          <div className="flex items-center justify-between text-[11px]">
            <Link href="/register" className="font-medium text-accent hover:underline">
              Create account
            </Link>
            <Link href="/forgot-password" className="font-medium text-accent hover:underline">
              Forgot password?
            </Link>
          </div>

          <p className="text-center text-[11px] leading-relaxed text-ink-muted">
            No backend running? Password{" "}
            <code className="rounded bg-border/60 px-1 py-0.5 font-mono">demo</code>{" "}
            with{" "}
            <code className="rounded bg-border/60 px-1 py-0.5 font-mono">demo</code>{" "}
            (HR),{" "}
            <code className="rounded bg-border/60 px-1 py-0.5 font-mono">demo-admin</code>,{" "}
            <code className="rounded bg-border/60 px-1 py-0.5 font-mono">demo-manager</code>{" "}
            or{" "}
            <code className="rounded bg-border/60 px-1 py-0.5 font-mono">demo-employee</code>{" "}
            to explore each role.
          </p>
        </form>
      </div>
    </main>
  );
}
