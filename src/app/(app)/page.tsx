"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  TrendingDown,
  Users,
} from "lucide-react";
import { coreHrApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { mockEmployees, mockSkillGaps } from "@/lib/mock";
import type { EmployeeProfile, SkillGapResponse } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { CoverageRadar, RiskBarChart, SupplyDemandChart } from "@/components/charts";
import { DemoBanner, KpiCard, SeverityBadge, Skeleton } from "@/components/ui";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const role = user?.role ?? "";
  const canSeeDashboard = ACCESS.dashboard.check(role);

  // Employees (and other roles without dashboard access) land on their
  // personal hub instead of a restricted screen.
  useEffect(() => {
    if (user && !canSeeDashboard) router.replace("/me");
  }, [user, canSeeDashboard, router]);

  if (user && !canSeeDashboard) return null;

  return (
    <RoleGate rule={ACCESS.dashboard}>
      <DashboardInner />
    </RoleGate>
  );
}

function DashboardInner() {
  const { user } = useAuth();

  const gaps = useData<SkillGapResponse>(
    () => coreHrApi<SkillGapResponse>("/api/hr/predictions/skill-gaps/"),
    mockSkillGaps
  );
  const employees = useData<EmployeeProfile[]>(
    () => coreHrApi<EmployeeProfile[]>("/api/hr/employees/?page_size=100"),
    mockEmployees
  );

  const g = gaps.data;
  const emps = Array.isArray(employees.data) ? employees.data : [];
  const activeCount = emps.filter((e) => e.is_active).length;

  if (gaps.loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DemoBanner show={gaps.demo || employees.demo} />

      <div className="rise">
        <p className="text-sm text-ink-muted">
          {`Welcome back${user?.first_name ? `, ${user.first_name}` : ""} — here is the organisation's competency outlook at ${g?.horizon_months ?? 6} months.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Active employees"
          value={activeCount || "—"}
          sub={`${emps.length} profiles total`}
          icon={<Users size={18} />}
          delay={1}
        />
        <KpiCard
          label="High-risk gaps"
          value={g?.severity_summary?.high ?? 0}
          sub="require action now"
          icon={<AlertTriangle size={18} />}
          tone="danger"
          delay={2}
        />
        <KpiCard
          label="Medium-risk gaps"
          value={g?.severity_summary?.medium ?? 0}
          sub="watch closely"
          icon={<TrendingDown size={18} />}
          tone="warning"
          delay={3}
        />
        <KpiCard
          label="Healthy skills"
          value={g?.severity_summary?.low ?? 0}
          sub="supply meets demand"
          icon={<ShieldCheck size={18} />}
          tone="success"
          delay={4}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="glass rise rise-2 p-5 lg:col-span-3">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Top skill-gap risks</h2>
              <p className="text-xs text-ink-muted">
                Ranked by risk score · {g?.horizon_months ?? 6}-month horizon
              </p>
            </div>
            <Link
              href="/skill-gaps"
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              Full analysis <ArrowRight size={12} />
            </Link>
          </header>
          {g && <RiskBarChart forecasts={g.forecasts} />}
        </section>

        <section className="glass rise rise-3 p-5 lg:col-span-2">
          <header className="mb-4">
            <h2 className="text-sm font-semibold">Assessment coverage</h2>
            <p className="text-xs text-ink-muted">Share of headcount assessed, by department</p>
          </header>
          {g && <CoverageRadar forecasts={g.forecasts} />}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="glass rise rise-3 p-5 lg:col-span-3">
          <header className="mb-4">
            <h2 className="text-sm font-semibold">Projected supply vs demand</h2>
            <p className="text-xs text-ink-muted">Average proficiency (1–4) at horizon, by department</p>
          </header>
          {g && <SupplyDemandChart forecasts={g.forecasts} />}
        </section>

        <section className="glass rise rise-4 p-5 lg:col-span-2">
          <header className="mb-4 flex items-center gap-2">
            <BrainCircuit size={15} className="text-accent" />
            <h2 className="text-sm font-semibold">Critical gaps</h2>
          </header>
          <ul className="space-y-3">
            {(g?.forecasts ?? [])
              .filter((f) => f.severity === "HIGH")
              .slice(0, 4)
              .map((f) => (
                <li
                  key={`${f.department_code}-${f.skill_code}`}
                  className="rounded-xl border border-border/70 p-3.5 transition-colors hover:border-accent/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold">{f.skill_name}</p>
                    <SeverityBadge severity={f.severity} />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    {f.department_code} · gap {f.gap.toFixed(1)} · risk {f.risk_score.toFixed(0)}/100
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
                    {f.rationale}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
