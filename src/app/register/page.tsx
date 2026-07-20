"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, UserPlus } from "lucide-react";
import { ApiError, authApi, storeTokens } from "@/lib/api";
import type { Tokens, User } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";

const input =
  "w-full rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    password: "",
    role: "EMPLOYEE",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await authApi<{ user: User; tokens: Tokens }>("/api/auth/register/", {
        method: "POST",
        body: form,
        auth: false,
      });
      storeTokens(res.tokens.access, res.tokens.refresh);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, string[] | string> | null;
        const first =
          body &&
          Object.entries(body)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join(" · ");
        setError(first || `Registration failed (${err.status}).`);
      } else if (err instanceof TypeError) {
        setError("Auth service unreachable on :8000.");
      } else {
        setError("Something went wrong.");
      }
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
          <h1 className="text-2xl font-bold tracking-tight">
            Create your <span className="gradient-text">SmartHR360</span> account
          </h1>
        </div>

        <form onSubmit={onSubmit} className="glass space-y-4 p-7">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">First name</label>
              <input value={form.first_name} onChange={set("first_name")} required autoFocus className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Last name</label>
              <input value={form.last_name} onChange={set("last_name")} required className={input} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Email</label>
            <input type="email" value={form.email} onChange={set("email")} required autoComplete="email" className={input} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Username</label>
            <input value={form.username} onChange={set("username")} required autoComplete="username" className={input} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Password</label>
            <input type="password" value={form.password} onChange={set("password")} required minLength={8} autoComplete="new-password" placeholder="min. 8 characters" className={input} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Role</label>
            <select value={form.role} onChange={set("role")} className={input}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {error && (
            <p className="rise rounded-lg border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-xs text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Create account
          </button>

          <p className="text-center text-[11px] text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
