"use client";

import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";

export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="rise mb-5 flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
      <FlaskConical size={14} />
      Backend unreachable — showing demo data. Start the services with{" "}
      <code className="rounded bg-warning/15 px-1.5 py-0.5 font-mono">
        docker-compose up
      </code>{" "}
      in smarthr360-platform.
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: "HIGH" | "MEDIUM" | "LOW" }) {
  const styles = {
    HIGH: "bg-danger/12 text-danger border-danger/25",
    MEDIUM: "bg-warning/12 text-warning border-warning/25",
    LOW: "bg-success/12 text-success border-success/25",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[severity]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  tone?: "default" | "danger" | "warning" | "success";
  delay?: number;
}) {
  const tones = {
    default: "from-accent/15 to-accent-2/5 text-accent",
    danger: "from-danger/15 to-danger/5 text-danger",
    warning: "from-warning/15 to-warning/5 text-warning",
    success: "from-success/15 to-success/5 text-success",
  } as const;
  return (
    <div className={`glass glass-hover rise rise-${delay} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-1 p-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
