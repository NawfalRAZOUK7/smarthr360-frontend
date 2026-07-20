"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  GitCompareArrows,
  HeartPulse,
  Inbox,
  Loader2,
  Target,
  UserRound,
} from "lucide-react";
import { careerSimApi, coreHrApi, getAccessToken, retentionApi } from "@/lib/api";
import { mockCareerMobility, mockGoals, mockReviews } from "@/lib/mock";
import type { CareerMobility, EmployeeProfile, Goal, PerformanceReview } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toast";
import { EmptyState, Skeleton } from "@/components/ui";

const REVIEW_DONE = /complete|closed|done|approved/i;
const GOAL_DONE = /complete|done|achieved|cancel/i;

const fallbackProfile: EmployeeProfile = {
  id: 0,
  user: { user_id: 0, email: "", first_name: "", last_name: "", role: "EMPLOYEE" },
  email: "",
  first_name: "",
  last_name: "",
  user_role: "EMPLOYEE",
  department: { id: 0, code: "—", name: "—", description: "" },
  job_title: "—",
  employment_type: "FULL_TIME",
  hire_date: null,
} as EmployeeProfile;

export default function MyHubPage() {
  const { user } = useAuth();

  const profile = useData<EmployeeProfile>(
    () => coreHrApi<EmployeeProfile>("/api/hr/employees/me/"),
    fallbackProfile,
    []
  );
  const mobility = useData<CareerMobility>(
    () => careerSimApi<CareerMobility>("/api/career/mobility/"),
    mockCareerMobility as unknown as CareerMobility,
    []
  );
  const reviews = useData<PerformanceReview[]>(
    () => coreHrApi<PerformanceReview[]>("/api/reviews/"),
    mockReviews,
    []
  );
  const goals = useData<Goal[]>(
    () => coreHrApi<Goal[]>("/api/reviews/goals/"),
    mockGoals,
    []
  );

  const firstName = user?.first_name || "there";
  const p = profile.data ?? fallbackProfile;
  const readyRoles = (mobility.data?.positions ?? []).slice(0, 3);
  const openReviews = (reviews.data ?? []).filter((r) => r.status && !REVIEW_DONE.test(r.status));
  const openGoals = (goals.data ?? []).filter((g) => g.status && !GOAL_DONE.test(g.status));

  return (
    <div className="rise space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <UserRound size={19} className="text-accent" /> Hi {firstName}, welcome back
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your personal space — profile, growth and what&apos;s on your plate.
        </p>
      </header>

      {/* Profile + quick stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="glass p-5 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-wider text-ink-muted">Profile</p>
          <p className="mt-1 text-base font-semibold">
            {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : "—"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
            <Briefcase size={13} /> {p.job_title || "—"}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-semibold text-accent">
              {p.user_role || user?.role}
            </span>
            {p.department?.name && (
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-ink-muted">{p.department.name}</span>
            )}
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-ink-muted">
              {(p.employment_type || "").replace("_", " ").toLowerCase() || "—"}
            </span>
          </div>
        </div>

        <StatTile label="Roles you're ready for" value={mobility.data?.ready_count ?? 0} icon={<Compass size={15} className="text-accent" />} loading={mobility.loading} />
        <div className="grid grid-cols-2 gap-4 sm:col-span-1">
          <StatTile label="Open reviews" value={openReviews.length} icon={<ClipboardCheck size={15} className="text-accent" />} loading={reviews.loading} compact />
          <StatTile label="Active goals" value={openGoals.length} icon={<Target size={15} className="text-accent" />} loading={goals.loading} compact />
        </div>
      </section>

      {/* Private wellbeing check-in */}
      <WellbeingCheckin />

      {/* Career readiness */}
      <section className="glass">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Compass size={15} className="text-accent" /> Roles you&apos;re most ready for
          </h2>
          <Link href="/modules/career-sim" className="text-xs font-semibold text-accent hover:underline">
            Explore paths
          </Link>
        </div>
        {mobility.loading ? (
          <div className="p-5"><Skeleton className="h-24" /></div>
        ) : readyRoles.length === 0 ? (
          <div className="p-5"><EmptyState title="No target roles yet" hint="Run a career simulation to see where you're headed." /></div>
        ) : (
          <div className="divide-y divide-border/60">
            {readyRoles.map((r) => (
              <div key={r.target_position_id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.target_position}</p>
                  <p className="text-xs text-ink-muted">{r.department} · {r.missing_skills} skill gap{r.missing_skills === 1 ? "" : "s"}</p>
                </div>
                <div className="w-28 shrink-0">
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.round(r.readiness_percent))}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[11px] tabular-nums text-ink-muted">{Math.round(r.readiness_percent)}% ready</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/actions" icon={<Inbox size={16} />} label="Action Center" />
        <QuickLink href="/modules/career-sim" icon={<GitCompareArrows size={16} />} label="Career Sim" />
        <QuickLink href="/reviews" icon={<ClipboardCheck size={16} />} label="My Reviews" />
        <QuickLink href="/wellbeing" icon={<HeartPulse size={16} />} label="Wellbeing" />
      </section>
    </div>
  );
}

const MOODS = [
  { score: 1, emoji: "😣", label: "Struggling" },
  { score: 2, emoji: "😕", label: "Low" },
  { score: 3, emoji: "😐", label: "OK" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😄", label: "Great" },
];

function WellbeingCheckin() {
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);
  const [done, setDone] = useState<{ flagged: boolean; detail: string } | null>(null);

  async function submit(score: number) {
    setBusy(score);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 350));
        setDone({
          flagged: score <= 2,
          detail:
            score <= 2
              ? "Thanks for sharing. We've flagged this privately so support can reach out."
              : "Thanks for checking in.",
        });
      } else {
        const res = await retentionApi<{ flagged: boolean; detail: string }>(
          "/api/retention/checkin/",
          { method: "POST", body: { score } }
        );
        setDone(res);
      }
    } catch {
      toast("error", "Couldn't submit your check-in. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="glass p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <HeartPulse size={15} className="text-accent" /> Private check-in
      </h2>
      {done ? (
        <div className={`mt-3 flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm ${done.flagged ? "bg-accent/10 text-ink" : "bg-success/10 text-ink"}`}>
          <CheckCircle2 size={16} className={done.flagged ? "mt-0.5 text-accent" : "mt-0.5 text-success"} />
          <div>
            <p>{done.detail}</p>
            <button onClick={() => setDone(null)} className="mt-1 text-xs font-semibold text-accent hover:underline">
              Check in again
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-muted">How are you doing today?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.score}
                onClick={() => submit(m.score)}
                disabled={busy !== null}
                className="glass glass-hover flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-3 py-2.5 disabled:opacity-50"
              >
                {busy === m.score ? (
                  <Loader2 size={20} className="animate-spin text-accent" />
                ) : (
                  <span className="text-xl leading-none">{m.emoji}</span>
                )}
                <span className="text-[11px] text-ink-muted">{m.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink-muted">
            Private to you — this is separate from anonymous surveys, and is only shared with support if you&apos;re struggling.
          </p>
        </>
      )}
    </section>
  );
}

function StatTile({
  label,
  value,
  icon,
  loading,
  compact,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  loading?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-muted">
        {icon} <span className="truncate">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-10" />
      ) : (
        <p className={`mt-1 font-bold tabular-nums ${compact ? "text-xl" : "text-2xl"}`}>{value}</p>
      )}
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="glass glass-hover flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
      <span className="flex items-center gap-2">
        <span className="text-accent">{icon}</span> {label}
      </span>
      <ArrowRight size={14} className="text-ink-muted" />
    </Link>
  );
}
