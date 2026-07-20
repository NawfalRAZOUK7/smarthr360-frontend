"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { coreHrApi, policyGenApi, retentionApi } from "@/lib/api";
import {
  mockAppliedPolicies,
  mockAttrition,
  mockGoals,
  mockReviews,
  mockTrainingActions,
} from "@/lib/mock";
import type {
  AppliedPolicies,
  AttritionResponse,
  Goal,
  PerformanceReview,
  TrainingAction,
} from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { hasHrAccess, hasManagerAccess } from "@/lib/rbac";
import { EmptyState, Skeleton } from "@/components/ui";

type Tone = "urgent" | "attention" | "normal";

interface ActionItem {
  key: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  count: number;
  tone: Tone;
  href: string;
  cta: string;
}

const TONE_ORDER: Record<Tone, number> = { urgent: 0, attention: 1, normal: 2 };

const TONE_STYLES: Record<Tone, { ring: string; chip: string; text: string }> = {
  urgent: { ring: "border-danger/30", chip: "bg-danger/10 text-danger", text: "text-danger" },
  attention: { ring: "border-warning/30", chip: "bg-warning/10 text-warning", text: "text-warning" },
  normal: { ring: "border-border", chip: "bg-accent/10 text-accent", text: "text-accent" },
};

const isOpen = (status: string, done: RegExp) => !!status && !done.test(status);
const REVIEW_DONE = /complete|closed|done|approved/i;
const GOAL_DONE = /complete|done|achieved|cancel/i;
const ACTIVE_TRAINING = new Set(["PLANNED", "IN_PROGRESS"]);

const empty = <T,>(v: T) => () => Promise.resolve(v);

export default function ActionCenterPage() {
  const { user } = useAuth();
  const role = user?.role ?? "EMPLOYEE";
  const canHr = hasHrAccess(role);
  const canMgr = hasManagerAccess(role);

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
  const training = useData<TrainingAction[]>(
    canMgr ? () => coreHrApi<TrainingAction[]>("/api/hr/training-actions/") : empty<TrainingAction[]>([]),
    canMgr ? (mockTrainingActions as unknown as TrainingAction[]) : [],
    [canMgr]
  );
  const attrition = useData<AttritionResponse>(
    canHr ? () => retentionApi<AttritionResponse>("/api/retention/attrition/") : empty(mockAttrition),
    mockAttrition,
    [canHr]
  );
  const applied = useData<AppliedPolicies>(
    canHr ? () => policyGenApi<AppliedPolicies>("/api/policy/applied/") : empty(mockAppliedPolicies as AppliedPolicies),
    mockAppliedPolicies as AppliedPolicies,
    [canHr]
  );

  const loading =
    reviews.loading || goals.loading || (canMgr && training.loading) || (canHr && (attrition.loading || applied.loading));

  const items: ActionItem[] = [];

  const openReviews = (reviews.data ?? []).filter((r) => isOpen(r.status, REVIEW_DONE));
  if (openReviews.length > 0) {
    items.push({
      key: "reviews",
      icon: ClipboardCheck,
      title: "Reviews to complete",
      detail: `${openReviews.length} performance review${openReviews.length === 1 ? "" : "s"} still open.`,
      count: openReviews.length,
      tone: "attention",
      href: "/reviews",
      cta: "Open reviews",
    });
  }

  const openGoals = (goals.data ?? []).filter((g) => isOpen(g.status, GOAL_DONE));
  if (openGoals.length > 0) {
    items.push({
      key: "goals",
      icon: Target,
      title: "Goals in progress",
      detail: `${openGoals.length} development goal${openGoals.length === 1 ? "" : "s"} being tracked.`,
      count: openGoals.length,
      tone: "normal",
      href: "/reviews",
      cta: "View goals",
    });
  }

  if (canMgr) {
    const activeTraining = (training.data ?? []).filter((t) => ACTIVE_TRAINING.has(t.status));
    if (activeTraining.length > 0) {
      items.push({
        key: "training",
        icon: BookOpen,
        title: "Training actions to progress",
        detail: `${activeTraining.length} planned or in-progress training action${activeTraining.length === 1 ? "" : "s"}.`,
        count: activeTraining.length,
        tone: "normal",
        href: "/skill-gaps",
        cta: "Open training plan",
      });
    }
  }

  if (canHr) {
    const summary = attrition.data?.level_summary;
    const atRisk = (summary?.critical ?? 0) + (summary?.high ?? 0);
    if (atRisk > 0) {
      items.push({
        key: "attrition",
        icon: AlertTriangle,
        title: "Employees at attrition risk",
        detail: `${summary?.critical ?? 0} critical, ${summary?.high ?? 0} high-risk — intervene before they leave.`,
        count: atRisk,
        tone: (summary?.critical ?? 0) > 0 ? "urgent" : "attention",
        href: "/modules/retention",
        cta: "Review risk",
      });
    }

    const untracked = (applied.data?.count ?? 0) - (applied.data?.tracked_count ?? 0);
    if (untracked > 0) {
      items.push({
        key: "policies",
        icon: Wallet,
        title: "Applied policies awaiting outcome",
        detail: `${untracked} applied polic${untracked === 1 ? "y" : "ies"} with no measured result yet.`,
        count: untracked,
        tone: "attention",
        href: "/modules/policy-gen",
        cta: "Record outcomes",
      });
    }
  }

  items.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone] || b.count - a.count);
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="rise space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Inbox size={19} className="text-accent" /> Action Center
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Everything waiting on you across the platform, in one prioritized place.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass p-8">
          <EmptyState
            title="You're all caught up"
            hint="No open reviews, goals, training, risks or outcomes need your attention right now."
          />
        </div>
      ) : (
        <>
          <div className="glass flex items-center gap-3 px-5 py-4">
            <CheckCircle2 size={18} className="text-accent" />
            <p className="text-sm">
              <span className="font-semibold tabular-nums">{total}</span> item{total === 1 ? "" : "s"} across{" "}
              <span className="font-semibold">{items.length}</span> area{items.length === 1 ? "" : "s"} need your attention.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const s = TONE_STYLES[item.tone];
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`glass flex items-center gap-4 border px-5 py-4 transition hover:bg-accent/5 ${s.ring}`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${s.chip}`}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${s.chip}`}>
                        {item.count}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">{item.detail}</p>
                  </div>
                  <span className={`hidden items-center gap-1 text-xs font-semibold sm:flex ${s.text}`}>
                    {item.cta} <ArrowRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
