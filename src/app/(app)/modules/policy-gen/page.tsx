"use client";

import { useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  FlaskConical,
  Loader2,
  PiggyBank,
  Rocket,
  Scale,
  Sparkle,
  Sparkles,
  Target,
  TriangleAlert,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { ApiError, downloadFile, getAccessToken, policyGenApi } from "@/lib/api";
import { SERVICES } from "@/lib/config";
import {
  mockAiRecommendations,
  mockOptimize,
  mockPolicyAnalytics,
  mockPolicyCompare,
  mockAppliedPolicies,
  mockPolicyDocTemplates,
  mockPolicyEmployees,
  mockPolicyOutcomesSummary,
  mockSimHistory,
} from "@/lib/mock";
import {
  POLICY_TYPES,
  type AiRecommendation,
  type AppliedPolicies,
  type AppliedPolicy,
  type OptimizeResponse,
  type PolicyAnalytics,
  type PolicyCompareResponse,
  type PolicyDocTemplate,
  type PolicyEmployee,
  type PolicyOutcomesSummary,
  type SimulateResult,
  type SimulationHistory,
} from "@/lib/types";
import { useData } from "@/lib/use-data";
import { EmptyState, KpiCard, Skeleton } from "@/components/ui";
import { DemoBanner } from "@/components/ui";
import Modal, { Field, GhostButton, PrimaryButton, Select, TextArea, TextInput } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";

export default function PolicyGenPage() {
  return (
    <RoleGate rule={ACCESS.policyGen}>
      <PolicyGenInner />
    </RoleGate>
  );
}

const POLICY_LABELS: Record<string, { label: string; hint: string }> = {
  salary_increase: { label: "Salary increase", hint: "Across-the-board raise" },
  remote_work: { label: "Remote work", hint: "Expanded WFH policy" },
  training_budget: { label: "Training budget", hint: "Per-employee L&D budget" },
  wellness_program: { label: "Wellness program", hint: "Health & wellbeing perks" },
  flexible_hours: { label: "Flexible hours", hint: "Self-managed schedules" },
  mentorship: { label: "Mentorship", hint: "Structured mentoring pairs" },
};

const fmtMoney = (n: number) =>
  n === 0 ? "Free" : n.toLocaleString("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

type Tab = "compare" | "simulate" | "analytics" | "optimizer" | "ai" | "documents" | "outcomes";

const TABS: { id: Tab; label: string; icon: typeof Scale }[] = [
  { id: "compare", label: "A/B Compare", icon: Scale },
  { id: "simulate", label: "Simulate", icon: FlaskConical },
  { id: "outcomes", label: "Outcomes", icon: Trophy },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "optimizer", label: "Optimizer", icon: PiggyBank },
  { id: "ai", label: "AI Recommendations", icon: Sparkles },
  { id: "documents", label: "Documents", icon: FileText },
];

function PolicyGenInner() {
  const [tab, setTab] = useState<Tab>("compare");
  const [selected, setSelected] = useState<string[]>(["flexible_hours", "salary_increase", "training_budget"]);
  const [useLive, setUseLive] = useState(false);
  const [result, setResult] = useState<PolicyCompareResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  function toggle(pt: string) {
    setSelected((s) => (s.includes(pt) ? s.filter((x) => x !== pt) : [...s, pt]));
  }

  async function compare() {
    setBusy(true);
    setError(null);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 500));
        setResult({
          ...mockPolicyCompare,
          ranking: mockPolicyCompare.ranking.filter((r) => selected.includes(r.policy_type)),
        });
        setDemo(true);
        return;
      }
      const res = await policyGenApi<PolicyCompareResponse>("/api/policy/compare/", {
        method: "POST",
        body: {
          policies: selected.map((policy_type) => ({ policy_type, magnitude: 1 })),
          use_live: useLive,
        },
      });
      setResult(res);
      setDemo(false);
    } catch (err) {
      if (err instanceof TypeError) {
        setResult({
          ...mockPolicyCompare,
          ranking: mockPolicyCompare.ranking.filter((r) => selected.includes(r.policy_type)),
        });
        setDemo(true);
      } else if (err instanceof ApiError) {
        const body = err.body as { detail?: string } | null;
        setError(body?.detail ?? `Comparison failed (${err.status}) — HR or Admin role required.`);
      } else {
        setError("Comparison failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  const maxBenefit = Math.max(...(result?.ranking.map((r) => r.benefit_score) ?? [1]), 0.001);

  return (
    <div className="space-y-6">
      <DemoBanner show={demo} />

      <div className="rise flex flex-wrap items-center justify-between gap-3">
        <div className="glass flex flex-wrap rounded-full p-1">
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
            </button>
          ))}
        </div>
      </div>

      {tab === "simulate" && <SimulateTab />}
      {tab === "outcomes" && <OutcomesTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "optimizer" && <OptimizerTab />}
      {tab === "ai" && <AiTab />}
      {tab === "documents" && <DocumentsTab />}

      {tab === "compare" && (
      <>
      <div className="rise">
        <p className="text-sm text-ink-muted">
          A/B-compare HR policies head-to-head: projected turnover reduction,
          performance gain, and cost efficiency.
        </p>
      </div>

      <div className="rise rise-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {POLICY_TYPES.map((pt) => {
          const active = selected.includes(pt);
          const meta = POLICY_LABELS[pt];
          return (
            <button
              key={pt}
              onClick={() => toggle(pt)}
              className={`glass glass-hover p-4 text-left transition-all ${active ? "ring-2 ring-accent/60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{meta.label}</p>
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                    active ? "border-accent bg-gradient-to-br from-accent to-accent-2" : "border-border"
                  }`}
                />
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">{meta.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="rise rise-2 flex flex-wrap items-center gap-4">
        <button
          onClick={compare}
          disabled={selected.length < 2 || busy}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Scale size={15} />}
          Compare {selected.length} policies
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={useLive}
            onChange={(e) => setUseLive(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--accent)]"
          />
          Evaluate against live core-hr data
        </label>
        {selected.length < 2 && <p className="text-xs text-ink-muted">Select at least 2 policies.</p>}
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      {result && (
        <section className="rise space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass flex items-center gap-3 border-accent/30 bg-gradient-to-r from-accent/10 to-accent-2/5 p-4">
              <Trophy size={18} className="text-accent" />
              <p className="text-sm">
                Best overall:{" "}
                <span className="font-bold gradient-text">
                  {POLICY_LABELS[result.recommended ?? ""]?.label ?? result.recommended ?? "—"}
                </span>
              </p>
            </div>
            <div className="glass flex items-center gap-3 border-success/30 bg-gradient-to-r from-success/10 to-accent-3/5 p-4">
              <BadgeDollarSign size={18} className="text-success" />
              <p className="text-sm">
                Most cost-efficient:{" "}
                <span className="font-bold text-success">
                  {POLICY_LABELS[result.most_cost_efficient ?? ""]?.label ?? result.most_cost_efficient ?? "—"}
                </span>
              </p>
            </div>
          </div>

          <div className="glass overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  <th className="px-5 py-3.5 font-semibold">Policy</th>
                  <th className="px-3 py-3.5 font-semibold">Turnover Δ</th>
                  <th className="px-3 py-3.5 font-semibold">Performance Δ</th>
                  <th className="px-3 py-3.5 font-semibold">Cost</th>
                  <th className="px-3 py-3.5 font-semibold">Benefit</th>
                  <th className="px-3 py-3.5 font-semibold">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {result.ranking.map((r, i) => (
                  <tr key={r.policy_type} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5 font-medium">
                        {i === 0 && <Sparkle size={13} className="text-accent" />}
                        {POLICY_LABELS[r.policy_type]?.label ?? r.policy_type}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-success">
                      {r.turnover_change !== null ? `${r.turnover_change.toFixed(1)} pts` : "—"}
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-accent-3">
                      {r.performance_change !== null ? `+${r.performance_change.toFixed(1)} pts` : "—"}
                    </td>
                    <td className="px-3 py-3.5 tabular-nums">
                      {r.zero_cost ? (
                        <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                          Free
                        </span>
                      ) : (
                        fmtMoney(r.cost_estimate)
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-700"
                            style={{ width: `${(r.benefit_score / maxBenefit) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-ink-muted">{r.benefit_score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 tabular-nums text-xs text-ink-muted">
                      {r.cost_efficiency.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.data_source && (
            <p className="text-right text-[11px] text-ink-muted">source: {result.data_source}</p>
          )}
        </section>
      )}
      </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Simulate — single policy impact preview + apply + history           */
/* ------------------------------------------------------------------ */

function SimulateTab() {
  const toast = useToast();
  const [policy, setPolicy] = useState<string>("remote_work");
  const [magnitude, setMagnitude] = useState(5);
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [appliedKey, setAppliedKey] = useState(0);

  const history = useData<SimulationHistory>(
    () => policyGenApi<SimulationHistory>("/api/policy/simulations/"),
    mockSimHistory,
    [historyKey]
  );
  const runs = history.data?.simulations ?? [];

  async function simulate() {
    setBusy(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 400));
        setResult({
          simulation_id: "demo", policy_type: policy, magnitude,
          impact: { turnover_change: -1.8, performance_change: 1.1, cost_estimate: policy === "flexible_hours" ? 0 : 30000 },
          data_source: "demo",
        });
      } else {
        const res = await policyGenApi<SimulateResult>("/api/policy/simulate/", {
          method: "POST",
          body: { policy_type: policy, magnitude },
        });
        setResult(res);
        setHistoryKey((k) => k + 1);
      }
    } catch (err) {
      toast("error", err instanceof ApiError ? `Simulate failed (${err.status}).` : "Could not simulate.");
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    setApplying(true);
    try {
      if (getAccessToken() !== "demo") {
        await policyGenApi("/api/policy/apply/", {
          method: "POST",
          body: { policy_type: policy, magnitude, simulation_id: result?.simulation_id },
        });
        setAppliedKey((k) => k + 1);
      }
      toast("success", `Applied ${POLICY_LABELS[policy]?.label ?? policy} (demo semantics).`);
    } catch (err) {
      toast("error", err instanceof ApiError ? ((err.body as { detail?: string })?.detail ?? `Apply failed (${err.status}).`) : "Could not apply.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="rise space-y-5">
      <section className="glass p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FlaskConical size={15} className="text-accent" /> Simulate a single policy
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Policy">
            <Select value={policy} onChange={(e) => setPolicy(e.target.value)}>
              {POLICY_TYPES.map((p) => (
                <option key={p} value={p}>{POLICY_LABELS[p]?.label ?? p}</option>
              ))}
            </Select>
          </Field>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <span>Magnitude</span>
              <span className="text-ink">{magnitude}/10</span>
            </div>
            <input type="range" min={0} max={10} value={magnitude} onChange={(e) => setMagnitude(Number(e.target.value))} className="mt-3 w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton onClick={simulate} disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
            Simulate
          </PrimaryButton>
          {result && (
            <GhostButton onClick={apply} disabled={applying}>
              {applying ? <Loader2 size={14} className="inline animate-spin" /> : <Rocket size={14} className="inline" />}{" "}
              Apply this policy
            </GhostButton>
          )}
        </div>

        {result && (
          <div className="mt-5 grid grid-cols-3 gap-4">
            <ImpactCard label="Turnover Δ" value={`${result.impact.turnover_change} pts`} tone="success" />
            <ImpactCard label="Performance Δ" value={`+${result.impact.performance_change} pts`} tone="accent" />
            <ImpactCard label="Cost" value={fmtMoney(result.impact.cost_estimate)} tone="muted" />
          </div>
        )}
      </section>

      <section className="glass overflow-x-auto">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Simulation history</h2>
        </div>
        {history.loading ? (
          <div className="p-5"><Skeleton className="h-32" /></div>
        ) : runs.length === 0 ? (
          <div className="p-5"><EmptyState title="No simulations yet" hint="Run one above." /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3 font-semibold">Policy</th>
                <th className="px-3 py-3 font-semibold">Mag.</th>
                <th className="px-3 py-3 font-semibold">Turnover Δ</th>
                <th className="px-3 py-3 font-semibold">Perf. Δ</th>
                <th className="px-3 py-3 font-semibold">Cost</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">When</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                  <td className="px-5 py-3 font-medium">{POLICY_LABELS[r.scenario.policy_type ?? ""]?.label ?? r.scenario.policy_type}</td>
                  <td className="px-3 py-3 tabular-nums">{r.scenario.magnitude ?? "—"}</td>
                  <td className="px-3 py-3 tabular-nums text-success">{r.result?.turnover_change ?? "—"} pts</td>
                  <td className="px-3 py-3 tabular-nums text-accent-3">+{r.result?.performance_change ?? 0} pts</td>
                  <td className="px-3 py-3 tabular-nums">{fmtMoney(r.result?.cost_estimate ?? 0)}</td>
                  <td className="hidden px-3 py-3 text-xs text-ink-muted sm:table-cell">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <AppliedPoliciesPanel refreshKey={appliedKey} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Applied policies — predicted vs. real outcome (loop-closer)         */
/* ------------------------------------------------------------------ */

function AppliedPoliciesPanel({ refreshKey }: { refreshKey: number }) {
  const toast = useToast();
  const [localKey, setLocalKey] = useState(0);
  const [editing, setEditing] = useState<AppliedPolicy | null>(null);

  const applied = useData<AppliedPolicies>(
    () => policyGenApi<AppliedPolicies>("/api/policy/applied/"),
    mockAppliedPolicies,
    [refreshKey, localKey]
  );
  const rows = applied.data?.applied ?? [];

  return (
    <section className="glass">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Target size={15} className="text-accent" /> Applied policies — did they deliver?
        </h2>
        {applied.data && (
          <span className="text-xs text-ink-muted">
            {applied.data.tracked_count}/{applied.data.count} tracked
          </span>
        )}
      </div>

      {applied.loading ? (
        <div className="p-5"><Skeleton className="h-32" /></div>
      ) : rows.length === 0 ? (
        <div className="p-5">
          <EmptyState title="No applied policies yet" hint="Apply a simulated policy above, then record its real outcome here." />
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {rows.map((a) => (
            <AppliedRow key={a.applied_id} a={a} onRecord={() => setEditing(a)} />
          ))}
        </div>
      )}

      {editing && (
        <RecordOutcomeModal
          applied={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setLocalKey((k) => k + 1);
            toast("success", "Outcome recorded.");
          }}
        />
      )}
    </section>
  );
}

function AppliedRow({ a, onRecord }: { a: AppliedPolicy; onRecord: () => void }) {
  const label = POLICY_LABELS[a.policy_type]?.label ?? a.policy_type;
  const v = a.variance;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
      <div className="min-w-[140px]">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink-muted">
          mag {a.magnitude} · {new Date(a.applied_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <MetricPair title="Turnover Δ" predicted={`${a.predicted?.turnover_change ?? "—"} pts`}
          actual={a.outcome ? `${a.outcome.observed_turnover_change ?? "—"} pts` : null} />
        <MetricPair title="Cost" predicted={fmtMoney(a.predicted?.cost_estimate ?? 0)}
          actual={a.outcome && a.outcome.observed_cost != null ? fmtMoney(a.outcome.observed_cost) : null} />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {a.outcome ? (
          v?.delivered ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <CheckCircle2 size={13} /> Delivered
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
              <TriangleAlert size={13} /> Under target
            </span>
          )
        ) : (
          <GhostButton onClick={onRecord}>Record outcome</GhostButton>
        )}
      </div>
    </div>
  );
}

function MetricPair({ title, predicted, actual }: { title: string; predicted: string; actual: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-ink-muted">{title}</p>
      <p className="tabular-nums">
        <span className="text-ink-muted">pred</span> {predicted}
        {actual != null && (
          <>
            {" · "}
            <span className="text-ink-muted">actual</span> <span className="font-semibold text-ink">{actual}</span>
          </>
        )}
      </p>
    </div>
  );
}

function RecordOutcomeModal({
  applied,
  onClose,
  onSaved,
}: {
  applied: AppliedPolicy;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [turnover, setTurnover] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const canSave = turnover.trim() !== "" || cost.trim() !== "";

  async function save() {
    if (!canSave) return;
    setBusy(true);
    try {
      if (getAccessToken() !== "demo") {
        await policyGenApi(`/api/policy/applied/${applied.applied_id}/outcome/`, {
          method: "POST",
          body: {
            observed_turnover_change: turnover.trim() === "" ? null : Number(turnover),
            observed_cost: cost.trim() === "" ? null : Number(cost),
            note,
          },
        });
      }
      onSaved();
    } catch (err) {
      toast("error", err instanceof ApiError
        ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
        : "Could not record outcome.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Record real outcome">
      <div className="space-y-4">
        <p className="text-xs text-ink-muted">
          Predicted turnover Δ was <strong>{applied.predicted?.turnover_change ?? "—"} pts</strong>. Enter what actually
          happened after the policy took effect — lower (more negative) turnover means it delivered.
        </p>
        <Field label="Observed turnover change (pts)">
          <TextInput type="number" step="0.1" value={turnover} placeholder="e.g. -2.1"
            onChange={(e) => setTurnover(e.target.value)} />
        </Field>
        <Field label="Observed cost (EUR)">
          <TextInput type="number" step="1" value={cost} placeholder="e.g. 54000"
            onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label="Note (optional)">
          <TextArea rows={2} value={note} placeholder="Context for this reading…"
            onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={busy || !canSave}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save outcome
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

function ImpactCard({ label, value, tone }: { label: string; value: string; tone: "success" | "accent" | "muted" }) {
  const c = { success: "text-success", accent: "text-accent-3", muted: "text-ink" } as const;
  return (
    <div className="glass p-4 text-center">
      <p className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${c[tone]}`}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Outcomes — did applied policies actually deliver? (aggregate)       */
/* ------------------------------------------------------------------ */

function OutcomesTab() {
  const { data, loading, demo } = useData<PolicyOutcomesSummary>(
    () => policyGenApi<PolicyOutcomesSummary>("/api/policy/outcomes/summary/"),
    mockPolicyOutcomesSummary as PolicyOutcomesSummary,
    []
  );

  if (loading) return <div className="rise"><Skeleton className="h-64" /></div>;
  const s = data ?? (mockPolicyOutcomesSummary as PolicyOutcomesSummary);
  const rows = s.by_policy_type ?? [];

  return (
    <div className="rise space-y-5">
      <DemoBanner show={demo} />
      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard label="Policies applied" value={String(s.applied_count)} icon={<FileText size={18} />} />
        <KpiCard label="Outcomes recorded" value={String(s.tracked_count)} icon={<Target size={18} />} />
        <KpiCard label="Delivered" value={String(s.delivered_count)} icon={<CheckCircle2 size={18} />} />
        <KpiCard
          label="Delivered rate"
          value={s.delivered_rate != null ? `${Math.round(s.delivered_rate * 100)}%` : "—"}
          icon={<Trophy size={18} />}
        />
      </div>

      <section className="glass overflow-x-auto">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Trophy size={15} className="text-accent" /> Did policies deliver? By type
          </h2>
        </div>
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No applied policies yet" hint="Apply a policy and record its outcome to build this view." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3 font-semibold">Policy</th>
                <th className="px-3 py-3 font-semibold">Applied</th>
                <th className="px-3 py-3 font-semibold">Tracked</th>
                <th className="px-3 py-3 font-semibold">Delivered</th>
                <th className="px-3 py-3 font-semibold">Turnover Δ pred → actual</th>
                <th className="px-3 py-3 font-semibold">Cost variance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.policy_type} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                  <td className="px-5 py-3 font-medium">{POLICY_LABELS[r.policy_type]?.label ?? r.policy_type}</td>
                  <td className="px-3 py-3 tabular-nums">{r.applied}</td>
                  <td className="px-3 py-3 tabular-nums">{r.tracked}</td>
                  <td className="px-3 py-3">
                    {r.delivered_rate == null ? (
                      <span className="text-ink-muted">—</span>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.delivered_rate >= 0.5 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {r.delivered}/{r.tracked} · {Math.round(r.delivered_rate * 100)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {r.avg_predicted_turnover == null ? (
                      "—"
                    ) : (
                      <>
                        <span className="text-ink-muted">{r.avg_predicted_turnover}</span> →{" "}
                        <span className="font-semibold">{r.avg_observed_turnover ?? "—"}</span> pts
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {r.total_cost_variance == null ? "—" : fmtMoney(r.total_cost_variance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Analytics — current social indicators                               */
/* ------------------------------------------------------------------ */

function AnalyticsTab() {
  const { data, loading, demo, error } = useData<PolicyAnalytics>(
    () => policyGenApi<PolicyAnalytics>("/api/policy/analytics/"),
    mockPolicyAnalytics
  );

  if (loading) return <Skeleton className="h-40" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>;
  if (!data) return null;

  return (
    <div className="rise space-y-4">{demo && null}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Turnover rate"
          value={`${data.turnover_rate.toFixed(1)}%`}
          sub="last 12 months"
          icon={<BarChart3 size={18} />}
          tone={data.turnover_rate > 15 ? "danger" : data.turnover_rate > 10 ? "warning" : "success"}
          delay={1}
        />
        <KpiCard
          label="Avg performance"
          value={data.avg_performance.toFixed(2)}
          sub="/ 5.0 review score"
          icon={<Trophy size={18} />}
          tone={data.avg_performance >= 3.5 ? "success" : "warning"}
          delay={2}
        />
        <KpiCard
          label="Headcount"
          value={data.headcount ?? "—"}
          sub={data.active !== undefined ? `${data.active} active` : undefined}
          icon={<Users size={18} />}
          delay={3}
        />
        <KpiCard label="Data source" value="" sub={data.source} icon={<Wallet size={18} />} delay={4} />
      </div>
      <p className="text-xs text-ink-muted">
        These indicators are the baseline every simulation and optimization runs against.
        Pass <code className="rounded bg-border/60 px-1 font-mono">?source=live</code> to
        compute them from live core-hr data.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Optimizer — budget-constrained portfolio                            */
/* ------------------------------------------------------------------ */

function OptimizerTab() {
  const [budget, setBudget] = useState(100000);
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 450));
        setResult({ ...mockOptimize, budget });
        setDemo(true);
        return;
      }
      const res = await policyGenApi<OptimizeResponse>("/api/policy/optimize/", {
        method: "POST",
        body: { budget, magnitude: 5 },
      });
      setResult(res);
      setDemo(false);
    } catch (err) {
      if (err instanceof TypeError) {
        setResult({ ...mockOptimize, budget });
        setDemo(true);
      } else if (err instanceof ApiError) {
        const body = err.body as { detail?: string } | null;
        setError(body?.detail ?? `Optimization failed (${err.status}).`);
      } else {
        setError("Optimization failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rise space-y-5">{demo && null}
      <div className="glass flex flex-wrap items-center gap-5 p-5">
        <div className="min-w-64 flex-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-semibold uppercase tracking-wider">Budget</span>
            <span className="text-base font-bold tabular-nums text-ink">
              €{budget.toLocaleString("en-US")}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={300000}
            step={5000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
          />
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <PiggyBank size={15} />}
          Optimize portfolio
        </button>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Budget used" value={`€${result.budget_used.toLocaleString("en-US")}`} sub={`of €${result.budget.toLocaleString("en-US")}`} icon={<Wallet size={18} />} delay={1} />
            <KpiCard label="Remaining" value={`€${result.budget_remaining.toLocaleString("en-US")}`} icon={<PiggyBank size={18} />} tone="success" delay={2} />
            <KpiCard label="Turnover impact" value={`${result.expected_turnover_change} pts`} sub="expected change" icon={<BarChart3 size={18} />} tone="success" delay={3} />
            <KpiCard label="Performance impact" value={`+${result.expected_performance_change} pts`} icon={<Trophy size={18} />} tone="success" delay={4} />
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Selected policies</h2>
            {result.selected.map((e) => (
              <article key={e.policy_type} className="glass flex flex-wrap items-center gap-4 p-4">
                <Sparkle size={15} className="shrink-0 text-accent" />
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-semibold capitalize">{e.policy_type.replace(/_/g, " ")}</p>
                  <p className="text-[11px] text-ink-muted">{e.reason}</p>
                </div>
                <div className="flex gap-5 text-center text-xs">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-ink-muted">Cost</p>
                    <p className="font-bold tabular-nums">{e.cost === 0 ? "Free" : `€${e.cost.toLocaleString("en-US")}`}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-ink-muted">Turnover</p>
                    <p className="font-bold tabular-nums text-success">{e.impact.turnover_change} pts</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-ink-muted">Performance</p>
                    <p className="font-bold tabular-nums text-accent-3">+{e.impact.performance_change} pts</p>
                  </div>
                </div>
              </article>
            ))}
            {(result.skipped ?? []).length > 0 && (
              <>
                <h2 className="pt-2 text-sm font-semibold text-ink-muted">Skipped</h2>
                {(result.skipped ?? []).map((e) => (
                  <article key={e.policy_type} className="glass flex flex-wrap items-center gap-4 p-4 opacity-60">
                    <div className="min-w-40 flex-1">
                      <p className="text-sm font-medium capitalize">{e.policy_type.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-ink-muted">{e.reason}</p>
                    </div>
                    <span className="text-xs tabular-nums text-ink-muted">
                      €{e.cost.toLocaleString("en-US")}
                    </span>
                  </article>
                ))}
              </>
            )}
          </section>
        </>
      )}
      {!result && !busy && (
        <EmptyState title="Set a budget and optimize" hint="Greedy knapsack over the policy impact model." />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI Recommendations (Groq LLM)                                       */
/* ------------------------------------------------------------------ */

function AiTab() {
  const [budget, setBudget] = useState(100000);
  const { data, loading, demo, error } = useData<{ budget: number; recommendations: AiRecommendation[] } | AiRecommendation[]>(
    () => policyGenApi(`/api/policy/recommendations/?budget=${budget}`),
    { budget, recommendations: mockAiRecommendations },
    [budget]
  );
  const recs: AiRecommendation[] = Array.isArray(data)
    ? data
    : (data?.recommendations ?? []);

  return (
    <div className="rise space-y-4">{demo && null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          LLM-generated policy proposals under budget, sorted by cost.
        </p>
        <div className="glass flex rounded-full p-1">
          {[50000, 100000, 200000].map((b) => (
            <button
              key={b}
              onClick={() => setBudget(b)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium tabular-nums transition-all ${
                budget === b
                  ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {(b / 1000).toFixed(0)}k
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>
      )}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : recs.length === 0 ? (
        <EmptyState title="No recommendations" hint="The Groq API key may not be configured in policy-gen." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recs.map((r, i) => (
            <article key={i} className={`glass glass-hover rise rise-${Math.min((i % 4) + 1, 4)} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/10">
                  <Sparkles size={15} className="text-accent" />
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    /high/i.test(r.priority)
                      ? "border-danger/25 bg-danger/10 text-danger"
                      : "border-warning/25 bg-warning/10 text-warning"
                  }`}
                >
                  {r.priority}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{r.policy}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{r.reason}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-success">
                <BadgeDollarSign size={13} /> {r.budget_estimate}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Documents — generate contract / policy PDFs                         */
/* ------------------------------------------------------------------ */

function DocumentsTab() {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const employees = useData<PolicyEmployee[]>(
    () =>
      policyGenApi<{ employees: PolicyEmployee[] }>("/api/policy/employees/").then(
        (r) => r.employees ?? []
      ),
    mockPolicyEmployees
  );
  const templates = useData<PolicyDocTemplate[]>(
    () =>
      policyGenApi<{ templates: PolicyDocTemplate[] }>(
        "/api/policy/documents/templates/"
      ).then((r) => r.templates ?? []),
    mockPolicyDocTemplates
  );

  async function download(key: string, path: string, filename: string) {
    if (getAccessToken() === "demo") {
      toast("error", "Connect the backend to generate real PDFs.");
      return;
    }
    setBusy(key);
    try {
      const ok = await downloadFile(SERVICES.policyGen, path, filename);
      toast(ok ? "success" : "error", ok ? `${filename} downloaded.` : "Could not generate the PDF.");
    } finally {
      setBusy(null);
    }
  }

  const emps = Array.isArray(employees.data) ? employees.data : mockPolicyEmployees;
  const tmpls = Array.isArray(templates.data) ? templates.data : mockPolicyDocTemplates;

  return (
    <div className="rise space-y-6">
      <DemoBanner show={employees.demo || templates.demo} />

      <section className="glass overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <FileText size={15} className="text-accent" />
          <h2 className="text-sm font-semibold">Employment contracts</h2>
          <span className="ml-auto text-[11px] text-ink-muted">{emps.length} employees</span>
        </div>
        {employees.loading ? (
          <div className="p-5"><Skeleton className="h-40" /></div>
        ) : emps.length === 0 ? (
          <div className="p-5"><EmptyState title="No employees" hint="Reset demo data or sync from core-hr." /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">Department</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">Job title</th>
                <th className="px-3 py-3 font-semibold text-right">Contract</th>
              </tr>
            </thead>
            <tbody>
              {emps.map((e) => (
                <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                  <td className="px-5 py-3">
                    <p className="font-medium">{e.name}</p>
                    <p className="text-[11px] text-ink-muted">{e.employee_number ?? e.email ?? "—"}</p>
                  </td>
                  <td className="hidden px-3 py-3 text-ink-muted sm:table-cell">{e.department ?? "—"}</td>
                  <td className="hidden px-3 py-3 text-ink-muted sm:table-cell">{e.job_title ?? "—"}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() =>
                        download(
                          `emp-${e.id}`,
                          `/api/policy/employees/${e.id}/contract/`,
                          `contract_${e.employee_number ?? e.id}.pdf`
                        )
                      }
                      disabled={busy === `emp-${e.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      {busy === `emp-${e.id}` ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="glass p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileText size={15} className="text-accent" /> HR policy documents
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Generate a formatted, GDPR-aware policy document as a PDF.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {tmpls.map((t) => (
            <div key={t.policy_type} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="font-mono text-[10px] text-ink-muted">{t.policy_type}</p>
              </div>
              <button
                onClick={() =>
                  download(
                    `doc-${t.policy_type}`,
                    `/api/policy/documents/policy/?policy_type=${encodeURIComponent(t.policy_type)}`,
                    `policy_${t.policy_type}.pdf`
                  )
                }
                disabled={busy === `doc-${t.policy_type}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-accent-2 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                {busy === `doc-${t.policy_type}` ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                Generate
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
