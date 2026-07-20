"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { AccessRule } from "@/lib/rbac";

/**
 * Wraps a page: renders children only when the signed-in user's role
 * satisfies the rule; otherwise shows a friendly locked state instead
 * of letting the page fire calls that would 403.
 */
export default function RoleGate({
  rule,
  children,
}: {
  rule: AccessRule;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const role = user?.role ?? "";

  if (rule.check(role)) return <>{children}</>;

  return (
    <div className="rise flex min-h-[50vh] items-center justify-center">
      <div className="glass max-w-md p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent-2/10">
          <Lock size={20} className="text-accent" />
        </div>
        <h2 className="text-base font-semibold">Restricted area</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This screen requires a <span className="font-semibold text-ink">{rule.required}</span>{" "}
          role. You are signed in as{" "}
          <span className="font-semibold text-ink">{role || "unknown"}</span>.
        </p>
        <p className="mt-3 text-xs text-ink-muted">
          Ask an administrator to change your role if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
