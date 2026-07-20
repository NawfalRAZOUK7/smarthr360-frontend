"use client";

import { useState } from "react";
import { AlertTriangle, Copy, KeyRound, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { ApiError, authApi, clearTokens, getAccessToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Modal, { Field, GhostButton, PrimaryButton, TextInput } from "@/components/Modal";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="rise glass p-5">
        <h2 className="text-sm font-semibold">Account</h2>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Name" value={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "—"} />
          <Info label="Email" value={user?.email ?? "—"} />
          <Info label="Username" value={user?.username ?? "—"} />
          <Info label="Role" value={user?.role ?? "—"} />
        </div>
      </div>

      <ChangePassword />
      <TwoFactor />
      <DangerZone />
    </div>
  );
}

/* Danger zone: GDPR self-erasure ------------------------------------- */

function DangerZone() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  async function erase() {
    if (!password) {
      toast("error", "Confirm your password to proceed.");
      return;
    }
    setBusy(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 500));
        toast("success", "Account erased (demo).");
      } else {
        await authApi("/api/auth/me/erase/", {
          method: "POST",
          body: { password, otp: otp || undefined },
        });
        toast("success", "Account erased. Signing you out…");
      }
      clearTokens();
      setTimeout(() => (window.location.href = "/login"), 1200);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not erase account.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rise glass border-danger/25 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-danger">
        <AlertTriangle size={15} /> Danger zone
      </h2>
      <p className="mt-2 text-xs text-ink-muted">
        Permanently erase your account (GDPR). Your personal data is anonymized
        and all sessions revoked. This cannot be undone.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
      >
        Erase my account
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Erase your account"
        footer={
          <>
            <GhostButton onClick={() => setOpen(false)} disabled={busy}>Cancel</GhostButton>
            <button
              onClick={erase}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-danger to-accent-2 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Permanently erase
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="rounded-lg border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-xs text-danger">
            This anonymizes your personal data and revokes all sessions. There is
            no undo.
          </p>
          <Field label="Confirm password">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="Two-factor code (if enabled)" hint="Leave blank if you don't use 2FA">
            <TextInput value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="123456" />
          </Field>
        </div>
      </Modal>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}

/* Change password ------------------------------------------------------ */

function ChangePassword() {
  const toast = useToast();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (newPw.length < 8) {
      toast("error", "New password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      if (getAccessToken() !== "demo")
        await authApi("/api/auth/change-password/", {
          method: "POST",
          body: { old_password: oldPw, new_password: newPw },
        });
      toast("success", "Password changed.");
      setOldPw("");
      setNewPw("");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string; old_password?: string[] })?.detail ??
            (err.body as { old_password?: string[] })?.old_password?.[0] ??
            `Failed (${err.status}).`)
          : "Could not change password.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rise glass p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <KeyRound size={15} className="text-accent" /> Change password
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Current password">
          <TextInput type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <TextInput type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" placeholder="min. 8 characters" />
        </Field>
      </div>
      <div className="mt-4">
        <PrimaryButton onClick={submit} disabled={busy}>
          {busy && <Loader2 size={14} className="animate-spin" />}
          Update password
        </PrimaryButton>
      </div>
    </section>
  );
}

/* Two-factor setup ----------------------------------------------------- */

function TwoFactor() {
  const toast = useToast();
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [settingUp, setSettingUp] = useState(false);
  const [activating, setActivating] = useState(false);
  const [active, setActive] = useState(false);

  async function beginSetup() {
    setSettingUp(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 400));
        setSecret("JBSWY3DPEHPK3PXP");
        setUri("otpauth://totp/SmartHR360:demo?secret=JBSWY3DPEHPK3PXP&issuer=SmartHR360");
      } else {
        const res = await authApi<{ secret: string; otpauth_uri: string }>("/api/auth/2fa/setup/", { method: "POST" });
        setSecret(res.secret);
        setUri(res.otpauth_uri);
      }
    } catch (err) {
      toast("error", err instanceof ApiError ? `Setup failed (${err.status}).` : "Could not start 2FA setup.");
    } finally {
      setSettingUp(false);
    }
  }

  async function activate() {
    if (otp.length < 6) {
      toast("error", "Enter the 6-digit code from your authenticator app.");
      return;
    }
    setActivating(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 400));
      } else {
        await authApi("/api/auth/2fa/activate/", { method: "POST", body: { otp } });
      }
      setActive(true);
      toast("success", "Two-factor authentication enabled.");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string; message?: string })?.message ??
            (err.body as { detail?: string })?.detail ??
            "Invalid code — try again.")
          : "Could not activate 2FA.";
      toast("error", msg);
    } finally {
      setActivating(false);
    }
  }

  return (
    <section className="rise glass p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck size={15} className="text-accent" /> Two-factor authentication
      </h2>

      {active ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-success">
          <ShieldCheck size={15} /> 2FA is enabled on your account.
        </p>
      ) : !secret ? (
        <>
          <p className="mt-2 text-xs text-ink-muted">
            Add a TOTP authenticator (Google Authenticator, 1Password, Authy…) for
            a second login factor.
          </p>
          <div className="mt-4">
            <PrimaryButton onClick={beginSetup} disabled={settingUp}>
              {settingUp ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
              Set up 2FA
            </PrimaryButton>
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-ink-muted">
              1. In your authenticator app, add a new account and enter this secret
              (or scan the URI below):
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-canvas px-3 py-2 font-mono text-sm tracking-widest">
                {secret}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(secret);
                  toast("success", "Secret copied.");
                }}
                aria-label="Copy secret"
                className="glass glass-hover flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:text-ink"
              >
                <Copy size={15} />
              </button>
            </div>
            {uri && (
              <p className="mt-2 break-all text-[10px] text-ink-muted/70">{uri}</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs text-ink-muted">2. Enter the 6-digit code to confirm:</p>
            <div className="flex items-center gap-2">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
                className="w-40 rounded-lg border border-border bg-canvas px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <PrimaryButton onClick={activate} disabled={activating}>
                {activating && <Loader2 size={14} className="animate-spin" />}
                Activate
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
