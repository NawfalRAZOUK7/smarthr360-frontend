"use client";

import { useState } from "react";
import {
  Activity,
  ArrowRightLeft,
  BellRing,
  Check,
  CheckCircle2,
  Download,
  Flame,
  Gauge,
  LineChart as LineChartIcon,
  ListTodo,
  Loader2,
  NotebookPen,
  Plus,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { ApiError, coreHrApi, downloadFile, getAccessToken, workloadApi } from "@/lib/api";
import { SERVICES } from "@/lib/config";
import {
  mockAlerts,
  mockEmployees,
  mockRebalance,
  mockTasks,
  mockTeamBurnout,
  mockTrend,
} from "@/lib/mock";
import type {
  BurnoutForecast,
  EmployeeProfile,
  RebalanceResponse,
  ScoreTrend,
  TeamBurnoutResponse,
  WorkloadAlert,
  WorkloadTask,
} from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { hasManagerAccess } from "@/lib/rbac";
import { DemoBanner, EmptyState, KpiCard, Skeleton } from "@/components/ui";
import Modal, {
  Field,
  GhostButton,
  PrimaryButton,
  Select,
  TextArea,
  TextInput,
} from "@/components/Modal";
import { useToast } from "@/components/Toast";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";

export default function WorkloadPage() {
  return (
    <RoleGate rule={ACCESS.workload}>
      <WorkloadInner />
    </RoleGate>
  );
}

const HORIZONS = [7, 14, 30];

const LEVEL_STYLE: Record<string, { bar: string; text: string; label: string }> = {
  BURNOUT_RISK: { bar: "from-danger to-accent-2", text: "text-danger", label: "Burnout risk" },
  HIGH: { bar: "from-warning to-danger", text: "text-warning", label: "High" },
  MODERATE: { bar: "from-accent-3 to-warning", text: "text-accent-3", label: "Moderate" },
  LOW: { bar: "from-success to-accent-3", text: "text-success", label: "Low" },
};

function ForecastCard({
  f,
  index,
  name,
}: {
  f: BurnoutForecast;
  index: number;
  name?: string;
}) {
  const style = LEVEL_STYLE[f.projected_level ?? "LOW"] ?? LEVEL_STYLE.LOW;
  const delta =
    f.projected_score !== null && f.current_score !== null
      ? f.projected_score - f.current_score
      : null;

  return (
    <article className={`glass glass-hover rise rise-${Math.min((index % 4) + 1, 4)} p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{name ?? `User #${f.user_id}`}</p>
        <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
          {f.trending_to_burnout && <Flame size={12} />}
          {style.label}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ink-muted">Now</p>
          <p className="text-2xl font-bold tabular-nums">
            {f.current_score !== null ? f.current_score.toFixed(0) : "—"}
          </p>
        </div>
        <div className="flex items-center gap-1 pb-1 text-xs text-ink-muted">
          {delta !== null &&
            (delta >= 0 ? (
              <TrendingUp size={13} className={delta > 2 ? "text-danger" : ""} />
            ) : (
              <TrendingDown size={13} className="text-success" />
            ))}
          {delta !== null && `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`}
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-ink-muted">
            In {f.horizon_days}d
          </p>
          <p className={`text-2xl font-bold tabular-nums ${style.text}`}>
            {f.projected_score !== null ? f.projected_score.toFixed(0) : "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${style.bar}`}
          style={{ width: `${Math.min(f.projected_score ?? 0, 100)}%` }}
        />
      </div>

      <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
        {f.rationale}
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-ink-muted/70">
        slope {f.slope_per_day >= 0 ? "+" : ""}
        {f.slope_per_day.toFixed(2)}/day · confidence {f.confidence}
      </p>
    </article>
  );
}

type Tab = "forecast" | "tasks" | "alerts" | "trend" | "rebalance";

const TABS: { id: Tab; label: string; icon: typeof ListTodo }[] = [
  { id: "forecast", label: "Forecast", icon: Flame },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "alerts", label: "Alerts", icon: BellRing },
  { id: "rebalance", label: "Rebalance", icon: ArrowRightLeft },
  { id: "trend", label: "My trend", icon: LineChartIcon },
];

function WorkloadInner() {
  const [tab, setTab] = useState<Tab>("forecast");
  const [horizon, setHorizon] = useState(14);
  const toast = useToast();
  const { user } = useAuth();
  const isManager = hasManagerAccess(user?.role ?? "");
  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    if (getAccessToken() === "demo") {
      toast("error", "Connect the backend to export the report.");
      return;
    }
    setExporting(true);
    try {
      const ok = await downloadFile(SERVICES.workload, "/api/workload/export/", "workload_report.csv");
      toast(ok ? "success" : "error", ok ? "Workload report downloaded." : "Could not export the report.");
    } finally {
      setExporting(false);
    }
  }

  const { data, loading, error, demo } = useData<TeamBurnoutResponse>(
    () =>
      workloadApi<TeamBurnoutResponse>(
        `/api/workload/forecast/team/?horizon_days=${horizon}`
      ),
    { ...mockTeamBurnout, horizon_days: horizon },
    [horizon]
  );

  // Resolve user_ids to names via the core-hr directory (best effort).
  const employees = useData<EmployeeProfile[]>(
    () => coreHrApi<EmployeeProfile[]>("/api/hr/employees/?page_size=100"),
    mockEmployees
  );
  const nameById = new Map<number, string>(
    (Array.isArray(employees.data) ? employees.data : [])
      .filter((e) => e.user?.user_id != null)
      .map((e) => [
        e.user.user_id as number,
        `${e.first_name} ${e.last_name}`.trim(),
      ])
  );

  const forecasts = data?.forecasts ?? [];

  return (
    <div className="space-y-6">
      <DemoBanner show={demo} />
      {error && (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">
          {error} — the team forecast requires a Manager, HR or Admin role.
        </p>
      )}

      <div className="rise flex flex-wrap items-center justify-between gap-3">
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
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {tab === "forecast" && (
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
                  {h}d
                </button>
              ))}
            </div>
          )}
          {isManager && (
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="glass glass-hover flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
            >
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Export CSV
            </button>
          )}
        </div>
      </div>

      {tab === "tasks" && <TasksTab nameById={nameById} />}
      {tab === "alerts" && <AlertsTab nameById={nameById} />}
      {tab === "rebalance" && <RebalanceTab nameById={nameById} />}
      {tab === "trend" && <TrendTab />}

      {tab !== "forecast" ? null : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Team size" value={data?.team_size ?? 0} icon={<Users size={18} />} delay={1} />
            <KpiCard
              label="Projected at risk"
              value={data?.projected_at_risk ?? 0}
              sub={`at ${data?.horizon_days ?? horizon} days`}
              icon={<Flame size={18} />}
              tone={(data?.projected_at_risk ?? 0) > 0 ? "danger" : "success"}
              delay={2}
            />
            <KpiCard
              label="Trending up"
              value={forecasts.filter((f) => f.slope_per_day > 0.2).length}
              sub="rising workload scores"
              icon={<Activity size={18} />}
              tone="warning"
              delay={3}
            />
          </div>

          {forecasts.length === 0 ? (
            <EmptyState
              title="No forecasts available"
              hint="No workload scores recorded for your team yet."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {forecasts.map((f, i) => (
                <ForecastCard
                  key={f.user_id}
                  f={f}
                  index={i}
                  name={nameById.get(f.user_id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

const TASK_STATUS_STYLE: Record<string, string> = {
  TODO: "border-border text-ink-muted",
  IN_PROGRESS: "border-accent-3/25 bg-accent-3/10 text-accent-3",
  DONE: "border-success/25 bg-success/10 text-success",
};

function TasksTab({ nameById }: { nameById: Map<number, string> }) {
  const toast = useToast();
  const { user } = useAuth();
  const isManager = hasManagerAccess(user?.role ?? "");
  const [reloadKey, setReloadKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [computing, setComputing] = useState(false);
  const { data, loading, error } = useData<WorkloadTask[]>(
    () => workloadApi<WorkloadTask[]>("/api/workload/tasks/"),
    mockTasks,
    [reloadKey]
  );
  const list = Array.isArray(data) ? data : [];
  const reload = () => setReloadKey((k) => k + 1);

  async function computeScore() {
    setComputing(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 500));
        toast("success", "Score computed: 88 (BURNOUT_RISK) — demo.");
      } else {
        const res = await workloadApi<{ score: number; level: string; alert?: boolean }>(
          "/api/workload/scores/compute/",
          { method: "POST" }
        );
        toast(
          res.alert ? "error" : "success",
          `Score computed: ${Math.round(res.score)} (${res.level})${res.alert ? " — alert raised" : ""}`
        );
      }
      reload();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not compute score.";
      toast("error", msg);
    } finally {
      setComputing(false);
    }
  }

  return (
    <div className="rise space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-muted">
          Your open tasks feed the workload score. Add tasks, then recompute.
        </p>
        <div className="flex gap-2">
          <GhostButton onClick={computeScore} disabled={computing}>
            {computing ? <Loader2 size={14} className="inline animate-spin" /> : <Gauge size={14} className="inline" />}{" "}
            Compute score
          </GhostButton>
          {isManager && (
            <GhostButton onClick={() => setImportOpen(true)}>
              <Upload size={14} className="inline" /> Import tasks
            </GhostButton>
          )}
          <PrimaryButton onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add task
          </PrimaryButton>
        </div>
      </div>

      <ImportTasksModal open={importOpen} onClose={() => setImportOpen(false)} onDone={reload} />

      {loading ? (
        <Skeleton className="h-64" />
      ) : error ? (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>
      ) : list.length === 0 ? (
        <EmptyState title="No tasks yet" hint="Add a task to start scoring your workload." />
      ) : (
      <section className="glass overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              <th className="px-5 py-3.5 font-semibold">Task</th>
              <th className="px-3 py-3.5 font-semibold">Owner</th>
              <th className="px-3 py-3.5 font-semibold">Hours</th>
              <th className="px-3 py-3.5 font-semibold">Complexity</th>
              <th className="hidden px-3 py-3.5 font-semibold sm:table-cell">Deadline</th>
              <th className="px-3 py-3.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                <td className="px-5 py-3">
                  <span className="font-medium">{t.title}</span>
                  {t.is_unplanned && (
                    <span className="ml-2 rounded-full border border-warning/25 bg-warning/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning">
                      unplanned
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-ink-muted">
                  {nameById.get(t.user_id) ?? `User #${t.user_id}`}
                </td>
                <td className="px-3 py-3 tabular-nums">{t.estimated_hours}h</td>
                <td className="px-3 py-3">
                  <span className="text-warning">{"●".repeat(t.complexity)}</span>
                  <span className="text-border">{"●".repeat(5 - t.complexity)}</span>
                </td>
                <td className="hidden px-3 py-3 text-xs tabular-nums text-ink-muted sm:table-cell">
                  {t.deadline ?? "—"}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      TASK_STATUS_STYLE[t.status] ?? TASK_STATUS_STYLE.TODO
                    }`}
                  >
                    {t.status.replace("_", " ").toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      )}

      <AddTaskModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={reload}
        nameById={nameById}
      />
    </div>
  );
}

/* Add-task modal: employees add their own; managers may assign. */
function AddTaskModal({
  open,
  onClose,
  onCreated,
  nameById,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  nameById: Map<number, string>;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const isManager = hasManagerAccess(user?.role ?? "");
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("4");
  const [complexity, setComplexity] = useState("3");
  const [deadline, setDeadline] = useState("");
  const [unplanned, setUnplanned] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) {
      toast("error", "Give the task a title.");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        estimated_hours: Number(hours) || 1,
        complexity: Number(complexity) || 1,
        is_unplanned: unplanned,
      };
      if (deadline) body.deadline = deadline;
      if (isManager && assignee) body.user_id = Number(assignee);
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 400));
        toast("success", "Task added (demo).");
      } else {
        await workloadApi("/api/workload/tasks/", { method: "POST", body });
        toast("success", "Task added.");
      }
      setTitle("");
      setDeadline("");
      onCreated();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not add task.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add task"
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton onClick={submit} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Add task
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Migrate legacy service" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Estimated hours">
            <TextInput type="number" min={0} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
          </Field>
          <Field label="Complexity (1–5)">
            <Select value={complexity} onChange={(e) => setComplexity(e.target.value)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Deadline">
          <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        {isManager && (
          <Field label="Assign to" hint="Leave blank to add to your own list">
            <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Myself</option>
              {[...nameById.entries()].map(([uid, name]) => (
                <option key={uid} value={uid}>{name}</option>
              ))}
            </Select>
          </Field>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={unplanned} onChange={(e) => setUnplanned(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Unplanned / interruption
        </label>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

const ALERT_STYLE: Record<string, string> = {
  BURNOUT_RISK: "text-danger",
  HIGH: "text-warning",
  MODERATE: "text-accent-3",
  LOW: "text-success",
};

function AlertsTab({ nameById }: { nameById: Map<number, string> }) {
  const toast = useToast();
  const { user } = useAuth();
  const canAck = hasManagerAccess(user?.role ?? "");
  const [reloadKey, setReloadKey] = useState(0);
  const [ackId, setAckId] = useState<number | null>(null);
  const { data, loading, error } = useData<WorkloadAlert[]>(
    () => workloadApi<WorkloadAlert[]>("/api/workload/alerts/"),
    mockAlerts,
    [reloadKey]
  );
  const list = Array.isArray(data) ? data : [];

  async function acknowledge(id: number) {
    setAckId(id);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 350));
      } else {
        await workloadApi(`/api/workload/alerts/${id}/acknowledge/`, { method: "POST" });
      }
      toast("success", "Alert acknowledged.");
      setReloadKey((k) => k + 1);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not acknowledge.";
      toast("error", msg);
    } finally {
      setAckId(null);
    }
  }

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>;
  if (list.length === 0)
    return <EmptyState title="No alerts" hint="Alerts are raised when computed scores cross thresholds." />;

  return (
    <div className="rise space-y-3">
      {list.map((a) => (
        <article key={a.id} className={`glass p-5 ${a.acknowledged ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center gap-3">
            <BellRing size={16} className={ALERT_STYLE[a.level] ?? "text-ink-muted"} />
            <div className="min-w-40 flex-1">
              <p className="text-sm font-semibold">
                {nameById.get(a.user_id) ?? `User #${a.user_id}`}
                <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider ${ALERT_STYLE[a.level] ?? ""}`}>
                  {a.level.replace("_", " ")}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">{a.message}</p>
            </div>
            {a.acknowledged ? (
              <span className="flex items-center gap-1 text-[11px] text-success">
                <CheckCircle2 size={13} /> acknowledged
              </span>
            ) : canAck ? (
              <button
                onClick={() => acknowledge(a.id)}
                disabled={ackId === a.id}
                className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
              >
                {ackId === a.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Acknowledge
              </button>
            ) : (
              <span className="text-[11px] text-ink-muted">
                {new Date(a.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {a.recommendations.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {a.recommendations.map((r, i) => (
                <li
                  key={i}
                  className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] text-accent"
                >
                  {r}
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* My trend — personal score history                                   */
/* ------------------------------------------------------------------ */

function TrendTab() {
  const [signalOpen, setSignalOpen] = useState(false);
  const { data, loading, demo, error } = useData<ScoreTrend>(
    () => workloadApi<ScoreTrend>("/api/workload/scores/trend/"),
    mockTrend
  );

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>;

  const series = data?.series ?? [];
  const max = Math.max(...series.map((p) => p.score), 100);
  const direction = data?.direction ?? null;

  return (
    <div className="rise space-y-4">{demo && null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-muted">
          Log a daily signal (meetings, interruptions, stress) — it feeds your next score.
        </p>
        <PrimaryButton onClick={() => setSignalOpen(true)}>
          <NotebookPen size={15} /> Log today&apos;s signal
        </PrimaryButton>
      </div>

      {series.length === 0 ? (
        <EmptyState title="No score history yet" hint="Log a signal and compute a score to start your trend." />
      ) : (
      <section className="glass p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Workload score — last {data?.points} computations</h2>
            <p className="text-xs text-ink-muted">Your own history (managers can query team members)</p>
          </div>
          {direction && (
            <span
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                direction === "worsening"
                  ? "border-danger/25 bg-danger/10 text-danger"
                  : direction === "improving"
                    ? "border-success/25 bg-success/10 text-success"
                    : "border-border text-ink-muted"
              }`}
            >
              {direction === "worsening" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {direction}
            </span>
          )}
        </div>
        <div className="mt-5 flex h-40 items-end gap-1.5">
          {series.map((p, i) => (
            <div key={i} className="group relative flex-1">
              <div
                className={`w-full rounded-t-md transition-all duration-700 ${
                  p.score >= 75
                    ? "bg-gradient-to-t from-danger/70 to-danger"
                    : p.score >= 55
                      ? "bg-gradient-to-t from-warning/70 to-warning"
                      : "bg-gradient-to-t from-accent/70 to-accent"
                }`}
                style={{ height: `${(p.score / max) * 160}px` }}
              />
              <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-2 py-1 text-[10px] group-hover:block">
                {p.score.toFixed(0)} · {new Date(p.computed_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-ink-muted">
          <span>{new Date(series[0].computed_at).toLocaleDateString()}</span>
          <span>{new Date(series[series.length - 1].computed_at).toLocaleDateString()}</span>
        </div>
      </section>
      )}

      <SignalModal open={signalOpen} onClose={() => setSignalOpen(false)} />
    </div>
  );
}

/* Daily signal entry (any role) */
function SignalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [meetings, setMeetings] = useState("3");
  const [interruptions, setInterruptions] = useState("4");
  const [stress, setStress] = useState("3");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const body = {
        date: new Date().toISOString().slice(0, 10),
        meetings_count: Number(meetings) || 0,
        interruptions_count: Number(interruptions) || 0,
        stress_level: Number(stress) || 1,
        comment: comment.trim(),
      };
      if (getAccessToken() !== "demo")
        await workloadApi("/api/workload/signals/", { method: "POST", body });
      toast("success", "Signal logged for today.");
      setComment("");
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ??
            (err.status === 400 ? "A signal for today already exists." : `Failed (${err.status}).`))
          : "Could not log signal.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log today's signal"
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton onClick={submit} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Log signal
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Meetings today">
            <TextInput type="number" min={0} value={meetings} onChange={(e) => setMeetings(e.target.value)} />
          </Field>
          <Field label="Interruptions">
            <TextInput type="number" min={0} value={interruptions} onChange={(e) => setInterruptions(e.target.value)} />
          </Field>
        </div>
        <Field label="Stress level (1–5)">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setStress(String(n))}
                className={`flex h-10 flex-1 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                  stress === String(n)
                    ? "border-accent bg-gradient-to-br from-accent to-accent-2 text-white"
                    : "border-border text-ink-muted hover:border-accent/50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Comment (optional)">
          <TextInput value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Sprint crunch" />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Rebalance — manager-only task redistribution suggestions            */
/* ------------------------------------------------------------------ */

function RebalanceTab({ nameById }: { nameById: Map<number, string> }) {
  const name = (uid: number | null) =>
    uid == null ? "—" : (nameById.get(uid) ?? `User #${uid}`);
  const { data, loading, demo, error } = useData<RebalanceResponse>(
    () => workloadApi<RebalanceResponse>("/api/workload/rebalancing/"),
    mockRebalance
  );
  const suggestions = data?.suggestions ?? [];

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return (
      <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">
        {error} — rebalancing needs a Manager, HR or Admin role.
      </p>
    );

  return (
    <div className="rise space-y-4">{demo && null}
      <p className="text-sm text-ink-muted">
        Suggested task moves from overloaded teammates to those with capacity
        (source: {data?.team_source}). Suggestions only — apply from the Tasks tab.
      </p>
      {suggestions.length === 0 ? (
        <EmptyState title="Team is balanced" hint="No one is overloaded right now." />
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <article key={s.overloaded_user_id} className="glass p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full border border-danger/25 bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
                  <Flame size={12} /> {name(s.overloaded_user_id)} · {s.open_hours}h open
                </span>
                <ArrowRightLeft size={16} className="text-ink-muted" />
                <span className="flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  {name(s.suggested_recipient_user_id)}
                  {s.recipient_open_hours != null && ` · ${s.recipient_open_hours}h open`}
                </span>
              </div>
              {s.tasks_to_move.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Suggested to move
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {s.tasks_to_move.map((t) => (
                      <span key={t.id} className="rounded-lg border border-border px-2.5 py-1 text-xs">
                        {t.title}{" "}
                        <span className="text-ink-muted">· {t.estimated_hours}h · cx{t.complexity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Import tasks — feed the burnout model with real workload data       */
/* ------------------------------------------------------------------ */

interface ParsedTaskRow {
  user_id: number;
  title: string;
  estimated_hours: number;
  complexity: number;
}

function parseTaskRows(raw: string): { rows: ParsedTaskRow[]; problems: string[] } {
  const rows: ParsedTaskRow[] = [];
  const problems: string[] = [];
  raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line, i) => {
      const p = line.split(",").map((x) => x.trim());
      const uid = Number(p[0]);
      const title = p[1] ?? "";
      if (!p[0] || Number.isNaN(uid)) {
        problems.push(`Line ${i + 1}: user_id must be a number.`);
        return;
      }
      if (!title) {
        problems.push(`Line ${i + 1}: title is required.`);
        return;
      }
      rows.push({
        user_id: uid,
        title,
        estimated_hours: Number(p[2]) || 1,
        complexity: Math.max(1, Math.min(Number(p[3]) || 2, 5)),
      });
    });
  return { rows, problems };
}

function ImportTasksModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { rows, problems } = parseTaskRows(text);

  async function submit() {
    if (rows.length === 0) {
      toast("error", "Add at least one valid task row.");
      return;
    }
    setBusy(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 600));
        toast("success", `Imported ${rows.length} tasks (demo).`);
      } else {
        const res = await workloadApi<{ created: number; errors: unknown[] }>(
          "/api/workload/tasks/import/",
          { method: "POST", body: { tasks: rows } }
        );
        toast("success", `Imported ${res.created} task${res.created === 1 ? "" : "s"}.`);
      }
      setText("");
      onDone();
      onClose();
    } catch (err) {
      toast("error", err instanceof ApiError ? `Failed (${err.status}).` : "Could not import tasks.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import tasks"
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>Close</GhostButton>
          <PrimaryButton onClick={submit} disabled={busy || rows.length === 0}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Import {rows.length > 0 ? `${rows.length} row${rows.length === 1 ? "" : "s"}` : ""}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-muted">
          One task per line:{" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11px]">user_id, title, estimated_hours, complexity</code>.
          Hours and complexity (1–5) are optional. This feeds the burnout model
          with real workload instead of seed data.
        </p>
        <Field label="Tasks">
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder={"5, Ship Q3 export, 12, 4\n5, Fix flaky test, 3, 2\n7, Onboarding doc, 4"}
            className="font-mono text-[12px]"
          />
        </Field>
        {rows.length > 0 && (
          <p className="text-[11px] text-success">{rows.length} valid row{rows.length === 1 ? "" : "s"} ready.</p>
        )}
        {problems.length > 0 && (
          <ul className="space-y-0.5 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-[11px] text-warning">
            {problems.slice(0, 5).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
            {problems.length > 5 && <li>…and {problems.length - 5} more.</li>}
          </ul>
        )}
      </div>
    </Modal>
  );
}
