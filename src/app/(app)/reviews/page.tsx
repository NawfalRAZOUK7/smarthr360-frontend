"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, ChevronDown, ClipboardCheck, Loader2, Plus, Target } from "lucide-react";
import { ApiError, coreHrApi, getAccessToken } from "@/lib/api";
import { mockCycles, mockEmployees, mockGoals, mockReviews } from "@/lib/mock";
import type { EmployeeProfile, Goal, PeerFeedback, PerformanceReview, ReviewCycle } from "@/lib/types";
import { mockPeerFeedback } from "@/lib/mock";
import { MessagesSquare, Star } from "lucide-react";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { hasManagerAccess } from "@/lib/rbac";
import { DemoBanner, EmptyState, Skeleton } from "@/components/ui";
import Modal, { Field, GhostButton, PrimaryButton, Select, TextArea, TextInput } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";

export default function ReviewsPage() {
  return (
    <RoleGate rule={ACCESS.reviews}>
      <ReviewsInner />
    </RoleGate>
  );
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "border-border text-ink-muted",
  SUBMITTED: "border-accent-3/25 bg-accent-3/10 text-accent-3",
  ACKNOWLEDGED: "border-success/25 bg-success/10 text-success",
  IN_PROGRESS: "border-accent-3/25 bg-accent-3/10 text-accent-3",
  DONE: "border-success/25 bg-success/10 text-success",
  PENDING: "border-warning/25 bg-warning/10 text-warning",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
        STATUS_STYLE[status] ?? "border-border text-ink-muted"
      }`}
    >
      {status.replace("_", " ").toLowerCase()}
    </span>
  );
}

type Tab = "reviews" | "goals" | "cycles";

function ReviewsInner() {
  const { user } = useAuth();
  const canCreate = hasManagerAccess(user?.role ?? "");
  const [tab, setTab] = useState<Tab>("reviews");
  const [open, setOpen] = useState<number | null>(null);
  const [modal, setModal] = useState<"review" | "goal" | null>(null);
  const [key, setKey] = useState(0);
  const reload = () => setKey((k) => k + 1);

  const cycles = useData<ReviewCycle[]>(
    () => coreHrApi<ReviewCycle[]>("/api/reviews/cycles/"),
    mockCycles,
    [key]
  );
  const reviews = useData<PerformanceReview[]>(
    () => coreHrApi<PerformanceReview[]>("/api/reviews/"),
    mockReviews,
    [key]
  );
  const goals = useData<Goal[]>(
    () => coreHrApi<Goal[]>("/api/reviews/goals/"),
    mockGoals,
    [key]
  );
  const employees = useData<EmployeeProfile[]>(
    () => coreHrApi<EmployeeProfile[]>("/api/hr/employees/?page_size=100"),
    mockEmployees
  );

  const demo = cycles.demo || reviews.demo || goals.demo;
  const reviewList = useMemo(
    () => (Array.isArray(reviews.data) ? reviews.data : []),
    [reviews.data]
  );
  const goalList = Array.isArray(goals.data) ? goals.data : [];
  const cycleList = Array.isArray(cycles.data) ? cycles.data : [];

  const TABS: { id: Tab; label: string; icon: typeof Target; count: number }[] = [
    { id: "reviews", label: "Reviews", icon: ClipboardCheck, count: reviewList.length },
    { id: "goals", label: "Goals", icon: Target, count: goalList.length },
    { id: "cycles", label: "Cycles", icon: CalendarRange, count: cycleList.length },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner show={demo} />

      <div className="rise flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-ink-muted">
          Performance reviews, goals and review cycles. Employees see their own;
          managers and HR see their scope.
        </p>
        <div className="flex items-center gap-2">
          {canCreate && tab !== "cycles" && (
            <PrimaryButton onClick={() => setModal(tab === "reviews" ? "review" : "goal")}>
              <Plus size={15} /> {tab === "reviews" ? "New review" : "New goal"}
            </PrimaryButton>
          )}
        <div className="glass flex rounded-full p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                tab === t.id
                  ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <t.icon size={13} />
              {t.label}
              <span className="rounded-full bg-black/10 px-1.5 text-[10px] tabular-nums dark:bg-white/10">
                {t.count}
              </span>
            </button>
          ))}
        </div>
        </div>
      </div>

      {modal && (
        <CreateReviewGoalModal
          kind={modal}
          employees={Array.isArray(employees.data) ? employees.data : []}
          cycles={cycleList}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      )}

      {tab === "reviews" &&
        (reviews.loading ? (
          <Skeleton className="h-64" />
        ) : reviewList.length === 0 ? (
          <EmptyState title="No reviews visible to you" hint="Reviews appear once a cycle starts." />
        ) : (
          <div className="rise space-y-3">
            {reviewList.map((r) => {
              const isOpen = open === r.id;
              return (
                <article
                  key={r.id}
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  className="glass cursor-pointer p-5 transition-colors hover:border-accent/40"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-xs font-bold text-white">
                      {(r.employee?.first_name?.[0] ?? "?") + (r.employee?.last_name?.[0] ?? "")}
                    </div>
                    <div className="min-w-40 flex-1">
                      <h3 className="text-sm font-semibold">
                        {r.employee?.first_name} {r.employee?.last_name}
                      </h3>
                      <p className="text-[11px] text-ink-muted">
                        {r.cycle?.name ?? "No cycle"} · manager{" "}
                        {r.manager ? `${r.manager.first_name} ${r.manager.last_name}` : "—"}
                      </p>
                    </div>
                    {typeof r.overall_score === "number" && (
                      <span className="text-lg font-bold tabular-nums text-accent">
                        {r.overall_score.toFixed(1)}
                        <span className="text-xs text-ink-muted">/5</span>
                      </span>
                    )}
                    <StatusBadge status={r.status} />
                    <ChevronDown
                      size={15}
                      className={`text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {isOpen && (
                    <div className="rise mt-4 space-y-3 border-t border-border/60 pt-4">
                      {(r.items?.length ?? 0) > 0 && (
                        <div className="space-y-2">
                          {(r.items ?? []).map((it) => (
                            <div key={it.id} className="flex items-center gap-3 text-sm">
                              <span className="w-44 shrink-0 text-xs text-ink-muted">
                                {it.criteria}
                              </span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                                  style={{ width: `${(it.score / 5) * 100}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-xs font-bold tabular-nums">
                                {it.score}/5
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(r.manager_comment || r.employee_comment) && (
                        <div className="grid gap-3 text-xs sm:grid-cols-2">
                          {r.manager_comment && (
                            <div className="rounded-xl border border-border/70 p-3">
                              <p className="font-semibold uppercase tracking-wider text-ink-muted">
                                Manager
                              </p>
                              <p className="mt-1 leading-relaxed">{r.manager_comment}</p>
                            </div>
                          )}
                          {r.employee_comment && (
                            <div className="rounded-xl border border-border/70 p-3">
                              <p className="font-semibold uppercase tracking-wider text-ink-muted">
                                Employee
                              </p>
                              <p className="mt-1 leading-relaxed">{r.employee_comment}</p>
                            </div>
                          )}
                        </div>
                      )}
                      <div onClick={(e) => e.stopPropagation()}>
                        <ReviewFeedback reviewId={r.id} />
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ))}

      {tab === "goals" &&
        (goals.loading ? (
          <Skeleton className="h-64" />
        ) : goalList.length === 0 ? (
          <EmptyState title="No goals yet" hint="Goals are created by managers or HR." />
        ) : (
          <div className="rise grid gap-4 sm:grid-cols-2">
            {goalList.map((g) => (
              <article key={g.id} className="glass glass-hover p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">{g.title}</h3>
                  <div className="flex items-center gap-2">
                    {(g.training_actions_count ?? 0) > 0 && (
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {g.training_actions_count} training
                      </span>
                    )}
                    <StatusBadge status={g.status} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {g.employee ? `${g.employee.first_name} ${g.employee.last_name}` : "—"} ·{" "}
                  {g.cycle?.name ?? "no cycle"}
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                  {g.description}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-3 to-accent transition-all duration-700"
                      style={{ width: `${g.progress_percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums">{g.progress_percent}%</span>
                </div>
              </article>
            ))}
          </div>
        ))}

      {tab === "cycles" &&
        (cycles.loading ? (
          <Skeleton className="h-48" />
        ) : cycleList.length === 0 ? (
          <EmptyState title="No review cycles" hint="HR creates cycles to start review campaigns." />
        ) : (
          <div className="rise space-y-3">
            {cycleList.map((c) => (
              <article key={c.id} className="glass flex flex-wrap items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/10">
                  <CalendarRange size={16} className="text-accent" />
                </div>
                <div className="min-w-40 flex-1">
                  <h3 className="text-sm font-semibold">{c.name}</h3>
                  <p className="text-[11px] text-ink-muted">
                    {c.start_date} → {c.end_date}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    c.is_active
                      ? "border-success/25 bg-success/10 text-success"
                      : "border-border text-ink-muted"
                  }`}
                >
                  {c.is_active ? "active" : "closed"}
                </span>
              </article>
            ))}
          </div>
        ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create review / goal (Manager+)                                     */
/* ------------------------------------------------------------------ */

function CreateReviewGoalModal({
  kind,
  employees,
  cycles,
  onClose,
  onSaved,
}: {
  kind: "review" | "goal";
  employees: EmployeeProfile[];
  cycles: ReviewCycle[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ? String(employees[0].id) : "");
  const [cycleId, setCycleId] = useState(cycles[0]?.id ? String(cycles[0].id) : "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  // The employees/cycles lists may still be loading when this modal mounts;
  // seed the default selection once they arrive so the first employee is
  // pre-selected rather than leaving the field empty.
  useEffect(() => {
    if (!employeeId && employees[0]?.id) setEmployeeId(String(employees[0].id));
  }, [employees, employeeId]);
  useEffect(() => {
    if (!cycleId && cycles[0]?.id) setCycleId(String(cycles[0].id));
  }, [cycles, cycleId]);

  async function save() {
    if (!employeeId) {
      toast("error", "Select an employee.");
      return;
    }
    if (kind === "goal" && !title.trim()) {
      toast("error", "Give the goal a title.");
      return;
    }
    setBusy(true);
    try {
      const base: Record<string, unknown> = { employee_id: Number(employeeId) };
      if (cycleId) base.cycle_id = Number(cycleId);
      if (getAccessToken() !== "demo") {
        if (kind === "review") {
          await coreHrApi("/api/reviews/", { method: "POST", body: base });
        } else {
          await coreHrApi("/api/reviews/goals/", {
            method: "POST",
            body: { ...base, title: title.trim(), description: description.trim() },
          });
        }
      }
      toast("success", kind === "review" ? "Review created." : "Goal created.");
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not create.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={kind === "review" ? "New performance review" : "New goal"}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Create
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Employee">
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {`${e.first_name} ${e.last_name}`.trim() || e.email}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cycle">
          <Select value={cycleId} onChange={(e) => setCycleId(e.target.value)}>
            <option value="">No cycle</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        {kind === "goal" && (
          <>
            <Field label="Title">
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="e.g. Reach Lead readiness 80%" />
            </Field>
            <Field label="Description">
              <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* 360° peer feedback on a review                                      */
/* ------------------------------------------------------------------ */

function ReviewFeedback({ reviewId }: { reviewId: number }) {
  const toast = useToast();
  const [key, setKey] = useState(0);
  const [give, setGive] = useState(false);
  const { data, loading } = useData<PeerFeedback>(
    () => coreHrApi<PeerFeedback>(`/api/reviews/${reviewId}/feedback/`),
    { ...mockPeerFeedback, review_id: reviewId },
    [reviewId, key]
  );

  return (
    <div className="rounded-xl border border-border/70 p-3.5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          <MessagesSquare size={13} /> 360° feedback
        </p>
        <button
          onClick={() => setGive(true)}
          className="flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/20"
        >
          <Star size={11} /> Give feedback
        </button>
      </div>

      {loading ? (
        <div className="mt-2"><Skeleton className="h-10" /></div>
      ) : (data?.count ?? 0) === 0 ? (
        <p className="mt-2 text-[11px] text-ink-muted">No peer feedback yet.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-bold text-accent">
              <Star size={12} className="fill-accent" /> {data?.average_rating?.toFixed(1)}
            </span>
            <span className="text-ink-muted">{data?.count} responses</span>
            {Object.entries(data?.by_relationship ?? {}).map(([rel, n]) => (
              <span key={rel} className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
                {rel.toLowerCase()} · {n}
              </span>
            ))}
          </div>
          {(data?.comments ?? []).map((c, i) => (
            <div key={i} className="rounded-lg bg-accent/5 px-3 py-2 text-[11px]">
              <span className="font-semibold text-accent">{c.rating}★</span>{" "}
              <span className="uppercase tracking-wider text-ink-muted">{c.relationship.toLowerCase()}</span>
              <p className="mt-0.5 leading-relaxed">{c.comment}</p>
            </div>
          ))}
        </div>
      )}

      {give && (
        <GiveFeedbackModal
          reviewId={reviewId}
          onClose={() => setGive(false)}
          onSaved={() => setKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function GiveFeedbackModal({ reviewId, onClose, onSaved }: { reviewId: number; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(4);
  const [relationship, setRelationship] = useState("PEER");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      if (getAccessToken() !== "demo")
        await coreHrApi(`/api/reviews/${reviewId}/feedback/`, {
          method: "POST",
          body: { rating, relationship, comment: comment.trim() },
        });
      toast("success", "Feedback recorded.");
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ??
            (err.status === 409 ? "You already gave feedback on this review." : `Failed (${err.status}).`))
          : "Could not submit feedback.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Give 360° feedback"
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton onClick={submit} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Submit
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Rating">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`flex h-10 flex-1 items-center justify-center rounded-lg border transition-all ${
                  n <= rating ? "border-accent bg-gradient-to-br from-accent to-accent-2 text-white" : "border-border text-ink-muted hover:border-accent/50"
                }`}
              >
                <Star size={16} className={n <= rating ? "fill-white" : ""} />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Relationship">
          <Select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
            <option value="PEER">Peer</option>
            <option value="REPORT">Direct report</option>
            <option value="OTHER">Other</option>
          </Select>
        </Field>
        <Field label="Comment">
          <TextArea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="What stood out? Strengths, areas to grow…" />
        </Field>
      </div>
    </Modal>
  );
}
