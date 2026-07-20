"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, Loader2, Plus, RefreshCw } from "lucide-react";
import { ApiError, coreHrApi, getAccessToken } from "@/lib/api";
import { mockSkillGaps, mockSkillsCatalog, mockTrainingActions } from "@/lib/mock";
import type { Goal, Skill, SkillGapResponse, TrainingAction, TrainingActionStatus } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { hasManagerAccess } from "@/lib/rbac";
import { SupplyDemandChart } from "@/components/charts";
import { DemoBanner, EmptyState, SeverityBadge, Skeleton } from "@/components/ui";
import Modal, { Field, GhostButton, PrimaryButton, Select, TextInput } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";

export default function SkillGapsPage() {
  return (
    <RoleGate rule={ACCESS.skillGaps}>
      <SkillGapsInner />
    </RoleGate>
  );
}

const HORIZONS = [3, 6, 12, 24];

function SkillGapsInner() {
  const [horizon, setHorizon] = useState(6);
  const [severity, setSeverity] = useState<string>("ALL");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, demo } = useData<SkillGapResponse>(
    () =>
      coreHrApi<SkillGapResponse>(
        `/api/hr/predictions/skill-gaps/?horizon_months=${horizon}`
      ),
    { ...mockSkillGaps, horizon_months: horizon },
    [horizon, refreshKey]
  );

  const forecasts = useMemo(() => {
    const all = data?.forecasts ?? [];
    return severity === "ALL" ? all : all.filter((f) => f.severity === severity);
  }, [data, severity]);

  return (
    <div className="space-y-5">
      <DemoBanner show={demo} />
      {error && (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">
          {error} — this analysis requires a Manager, HR, Admin or Auditor role.
        </p>
      )}

      <div className="rise flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-muted">Horizon</span>
          <div className="glass flex rounded-full p-1">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  horizon === h
                    ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {h}m
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                severity === s ? "glass text-ink ring-1 ring-accent/50" : "text-ink-muted hover:text-ink"
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            aria-label="Refresh"
            className="glass glass-hover flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:text-accent"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          <section className="glass rise rise-1 p-5">
            <header className="mb-4">
              <h2 className="text-sm font-semibold">Supply vs demand at {data?.horizon_months}m</h2>
              <p className="text-xs text-ink-muted">
                Run {data?.run_id === "demo" ? "demo" : data?.run_id?.slice(0, 8)} ·{" "}
                {data?.forecasts.length ?? 0} forecasts
              </p>
            </header>
            {data && <SupplyDemandChart forecasts={data.forecasts} />}
          </section>

          {forecasts.length === 0 ? (
            <EmptyState
              title="No forecasts for this filter"
              hint="Adjust the severity filter or the horizon."
            />
          ) : (
            <section className="glass rise rise-2 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    <th className="px-5 py-3.5 font-semibold">Skill</th>
                    <th className="px-3 py-3.5 font-semibold">Dept</th>
                    <th className="hidden px-3 py-3.5 font-semibold sm:table-cell">Now</th>
                    <th className="px-3 py-3.5 font-semibold">Projected</th>
                    <th className="px-3 py-3.5 font-semibold">Demand</th>
                    <th className="px-3 py-3.5 font-semibold">Gap</th>
                    <th className="hidden px-3 py-3.5 font-semibold md:table-cell">Risk</th>
                    <th className="px-3 py-3.5 font-semibold">Severity</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((f) => {
                    const key = `${f.department_code}-${f.skill_code}`;
                    const open = openRow === key;
                    return [
                      <tr
                        key={key}
                        onClick={() => setOpenRow(open ? null : key)}
                        className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-accent/5"
                      >
                        <td className="px-5 py-3 font-medium">{f.skill_name}</td>
                        <td className="px-3 py-3 text-xs text-ink-muted">{f.department_code}</td>
                        <td className="hidden px-3 py-3 tabular-nums sm:table-cell">
                          {f.current_avg_level.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 tabular-nums">{f.projected_level.toFixed(1)}</td>
                        <td className="px-3 py-3 tabular-nums">{f.demand_level.toFixed(1)}</td>
                        <td
                          className={`px-3 py-3 font-semibold tabular-nums ${
                            f.gap < 0 ? "text-danger" : "text-success"
                          }`}
                        >
                          {f.gap > 0 ? "+" : ""}
                          {f.gap.toFixed(1)}
                        </td>
                        <td className="hidden px-3 py-3 md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-warning to-danger transition-all duration-700"
                                style={{ width: `${f.risk_score}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-ink-muted">
                              {f.risk_score.toFixed(0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <SeverityBadge severity={f.severity} />
                        </td>
                        <td className="pr-4">
                          <ChevronDown
                            size={14}
                            className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
                          />
                        </td>
                      </tr>,
                      open ? (
                        <tr key={`${key}-detail`} className="border-b border-border/50 bg-accent/5">
                          <td colSpan={9} className="px-5 py-4">
                            <div className="grid gap-4 text-xs sm:grid-cols-4">
                              <div>
                                <p className="font-semibold uppercase tracking-wider text-ink-muted">Velocity</p>
                                <p className="mt-1 tabular-nums">
                                  {f.velocity_per_month >= 0 ? "+" : ""}
                                  {f.velocity_per_month.toFixed(3)} lvl/month
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold uppercase tracking-wider text-ink-muted">Coverage</p>
                                <p className="mt-1 tabular-nums">{(f.coverage * 100).toFixed(0)}% assessed</p>
                              </div>
                              <div>
                                <p className="font-semibold uppercase tracking-wider text-ink-muted">Attrition</p>
                                <p className="mt-1 tabular-nums">{(f.attrition_rate * 100).toFixed(0)}%</p>
                              </div>
                              <div>
                                <p className="font-semibold uppercase tracking-wider text-ink-muted">Importance</p>
                                <p className="mt-1">{"★".repeat(f.importance)}{"☆".repeat(5 - f.importance)}</p>
                              </div>
                            </div>
                            <p className="mt-3 border-t border-border/60 pt-3 text-xs leading-relaxed text-ink-muted">
                              {f.rationale}
                            </p>
                          </td>
                        </tr>
                      ) : null,
                    ];
                  })}
                </tbody>
              </table>
            </section>
          )}

          <TrainingPlanSection />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Training plan — turn a skill gap into a trackable action            */
/* ------------------------------------------------------------------ */

const TA_STATUS: { value: TrainingActionStatus; label: string; cls: string }[] = [
  { value: "PLANNED", label: "Planned", cls: "bg-accent-3/12 text-accent-3 border-accent-3/25" },
  { value: "IN_PROGRESS", label: "In progress", cls: "bg-warning/12 text-warning border-warning/25" },
  { value: "COMPLETED", label: "Completed", cls: "bg-success/12 text-success border-success/25" },
  { value: "CANCELLED", label: "Cancelled", cls: "bg-ink-muted/10 text-ink-muted border-border" },
];

function TrainingPlanSection() {
  const toast = useToast();
  const { user } = useAuth();
  const isManager = hasManagerAccess(user?.role ?? "");
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [prefill, setPrefill] = useState<{ skill: string; title: string } | null>(null);

  const actions = useData<TrainingAction[]>(
    () => coreHrApi<TrainingAction[]>("/api/hr/training-actions/"),
    mockTrainingActions,
    [reloadKey]
  );
  const list = Array.isArray(actions.data) ? actions.data : mockTrainingActions;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const skill = params.get("skill");
    if (skill) {
      setPrefill({ skill, title: params.get("title") ?? `Training for ${skill}` });
      setCreating(true);
    }
  }, []);

  async function setStatus(a: TrainingAction, status: TrainingActionStatus) {
    if (getAccessToken() === "demo") {
      toast("success", `Marked ${status.toLowerCase().replace("_", " ")} (demo).`);
      return;
    }
    try {
      const progress = status === "COMPLETED" ? 100 : status === "PLANNED" ? 0 : a.progress_percent;
      await coreHrApi(`/api/hr/training-actions/${a.id}/`, {
        method: "PATCH",
        body: { status, progress_percent: progress },
      });
      toast("success", "Training action updated.");
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast("error", err instanceof ApiError ? `Failed (${err.status}).` : "Could not update.");
    }
  }

  return (
    <section className="glass rise rise-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen size={15} className="text-accent" /> Training plan
          </h2>
          <p className="text-xs text-ink-muted">
            Turn a gap into an owned, dated action — and track it through to done.
          </p>
        </div>
        {isManager && (
          <PrimaryButton onClick={() => setCreating(true)}>
            <Plus size={14} /> New action
          </PrimaryButton>
        )}
      </div>

      <div className="mt-3">
        <DemoBanner show={actions.demo} />
      </div>

      {list.length === 0 ? (
        <EmptyState title="No training actions yet" hint="Create one from a skill gap above." />
      ) : (
        <div className="mt-2 space-y-3">
          {list.map((a) => {
            const st = TA_STATUS.find((s) => s.value === a.status) ?? TA_STATUS[0];
            return (
              <div key={a.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-[11px] text-ink-muted">
                      {a.skill?.name ?? "—"}
                      {a.provider ? ` · ${a.provider}` : ""}
                      {a.department ? ` · ${a.department.name}` : ""}
                      {a.due_date ? ` · due ${new Date(a.due_date).toLocaleDateString()}` : ""}
                      {a.budget && Number(a.budget) > 0 ? ` · €${Number(a.budget).toLocaleString()}` : ""}
                    </p>
                  </div>
                  {isManager ? (
                    <select
                      value={a.status}
                      onChange={(e) => setStatus(a, e.target.value as TrainingActionStatus)}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${st.cls}`}
                    >
                      {TA_STATUS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                      style={{ width: `${a.progress_percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] tabular-nums text-ink-muted">{a.progress_percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <NewTrainingActionModal
          prefill={prefill}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </section>
  );
}

function NewTrainingActionModal({ onClose, onSaved, prefill }: { onClose: () => void; onSaved: () => void; prefill?: { skill: string; title: string } | null }) {
  const toast = useToast();
  const skills = useData<Skill[]>(
    () => coreHrApi<Skill[]>("/api/hr/skills/?page_size=200"),
    mockSkillsCatalog
  );
  const skillList = Array.isArray(skills.data) ? skills.data : mockSkillsCatalog;
  const goals = useData<Goal[]>(
    () => coreHrApi<Goal[]>("/api/reviews/goals/?page_size=200"),
    []
  );
  const goalList = Array.isArray(goals.data) ? goals.data : [];
  const [skillId, setSkillId] = useState("");
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [provider, setProvider] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [budget, setBudget] = useState("");
  const [goalId, setGoalId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!skillId) {
      const match = prefill && skillList.find((skill) => skill.name.toLowerCase() === prefill.skill.toLowerCase());
      if (match?.id || skillList[0]?.id) setSkillId(String(match?.id ?? skillList[0].id));
    }
  }, [skillList, skillId, prefill]);

  async function save() {
    if (!skillId) return toast("error", "Pick a skill.");
    if (!title.trim()) return toast("error", "Give the action a title.");
    setBusy(true);
    try {
      if (getAccessToken() !== "demo") {
        await coreHrApi("/api/hr/training-actions/", {
          method: "POST",
          body: {
            skill_id: Number(skillId),
            title: title.trim(),
            provider: provider.trim(),
            due_date: dueDate || null,
            budget: budget || null,
            goal_id: goalId ? Number(goalId) : null,
          },
        });
      }
      toast("success", "Training action created.");
      onSaved();
    } catch (err) {
      toast("error", err instanceof ApiError ? `Failed (${err.status}).` : "Could not create.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New training action"
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />} Create
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Skill (the gap to close)">
          <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
            {skillList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kubernetes CKA certification" />
        </Field>
        <Field label="Provider" hint="Course provider (optional)">
          <TextInput value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Linux Foundation" />
        </Field>
        <Field label="Link to goal" hint="Optional">
          <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">No linked goal</option>
            {goalList.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Due date">
            <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Budget (€)">
            <TextInput type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="1200" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
