"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BadgeDollarSign,
  BrainCog,
  CheckCircle2,
  Database,
  Landmark,
  Loader2,
  Radar,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";
import { ApiError, futureSkillsApi, getAccessToken } from "@/lib/api";
import {
  mockEconomicReports,
  mockDriftStatus,
  mockFuturePredictions,
  mockHrRecommendations,
  mockMarketTrends,
  mockServiceMetrics,
  mockTrainingRuns,
} from "@/lib/mock";
import type {
  BulkImportResult,
  DriftStatus,
  EconomicReport,
  FutureSkillPrediction,
  HRRecommendation,
  MarketTrend,
  ServiceMetrics,
  TrainingRun,
} from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { hasHrAccess } from "@/lib/rbac";
import { DemoBanner, EmptyState, SeverityBadge, Skeleton } from "@/components/ui";
import Modal, { Field, GhostButton, PrimaryButton, TextArea, TextInput } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";

export default function FutureSkillsPage() {
  return (
    <RoleGate rule={ACCESS.futureSkills}>
      <FutureSkillsInner />
    </RoleGate>
  );
}

type Tab =
  | "predictions"
  | "trends"
  | "recommendations"
  | "training"
  | "economic"
  | "monitoring";

const TABS: { id: Tab; label: string; icon: typeof Radar }[] = [
  { id: "predictions", label: "Predictions", icon: Radar },
  { id: "trends", label: "Market trends", icon: TrendingUp },
  { id: "recommendations", label: "HR investments", icon: BadgeDollarSign },
  { id: "training", label: "ML training", icon: BrainCog },
  { id: "economic", label: "Economic data", icon: Landmark },
  { id: "monitoring", label: "Monitoring", icon: Activity },
];

function FutureSkillsInner() {
  const [tab, setTab] = useState<Tab>("predictions");
  const [level, setLevel] = useState<string>("ALL");

  const predictions = useData<FutureSkillPrediction[]>(
    () => futureSkillsApi<FutureSkillPrediction[]>("/api/future-skills/"),
    mockFuturePredictions
  );
  const trends = useData<MarketTrend[]>(
    () => futureSkillsApi<MarketTrend[]>("/api/market-trends/"),
    mockMarketTrends
  );
  const recommendations = useData<HRRecommendation[]>(
    () => futureSkillsApi<HRRecommendation[]>("/api/hr-investment-recommendations/"),
    mockHrRecommendations
  );

  const preds = useMemo(() => {
    const all = Array.isArray(predictions.data) ? predictions.data : [];
    const filtered = level === "ALL" ? all : all.filter((p) => p.level === level);
    return [...filtered].sort((a, b) => b.score - a.score);
  }, [predictions.data, level]);

  const demo = predictions.demo || trends.demo || recommendations.demo;
  const loading = predictions.loading;

  return (
    <div className="space-y-6">
      <DemoBanner show={demo} />

      <div className="rise flex min-w-0 flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-ink-muted">
          ML-predicted future skill demand per job role, grounded in market
          trends — with investment recommendations for HR.
        </p>
        <div className="w-full min-w-0 max-w-full overflow-x-auto pb-1 lg:w-auto" aria-label="Future skills sections">
          <div className="glass flex w-max min-w-full rounded-full p-1 lg:min-w-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
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
      </div>

      {tab === "predictions" && (
        <>
          <div className="rise flex items-center gap-2">
            {["ALL", "HIGH", "MEDIUM", "LOW"].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  level === l
                    ? "glass text-ink ring-1 ring-accent/50"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {l.toLowerCase()}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-ink-muted">
              {preds.length} predictions
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : preds.length === 0 ? (
            <EmptyState
              title="No predictions"
              hint="Run the prediction engine in the future-skills service first."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {preds.map((p, i) => (
                <article
                  key={p.id}
                  className={`glass glass-hover rise rise-${Math.min((i % 4) + 1, 4)} p-5`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">{p.skill.name}</h3>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {p.job_role.name}
                        {p.job_role.department ? ` · ${p.job_role.department}` : ""} ·{" "}
                        {p.horizon_years}y horizon
                      </p>
                    </div>
                    <SeverityBadge severity={p.level} />
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent via-accent-2 to-danger transition-all duration-700"
                        style={{ width: `${Math.min(p.score, 100)}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold tabular-nums">
                      {p.score.toFixed(0)}
                    </span>
                  </div>
                  {p.rationale && (
                    <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
                      {p.rationale}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "trends" && (
        <div className="rise grid gap-4 sm:grid-cols-2">
          {(Array.isArray(trends.data) ? trends.data : []).map((t) => (
            <article key={t.id} className="glass glass-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{t.title}</h3>
                <span className="shrink-0 rounded-full border border-accent-3/30 bg-accent-3/10 px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-accent-3">
                  {(t.trend_score * 100).toFixed(0)}
                </span>
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-muted">
                {t.sector} · {t.source_name} · {t.year}
              </p>
              {t.description && (
                <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">
                  {t.description}
                </p>
              )}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-3 to-accent transition-all duration-700"
                  style={{ width: `${t.trend_score * 100}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "recommendations" && (
        <div className="rise space-y-4">
          {(Array.isArray(recommendations.data) ? recommendations.data : []).map(
            (r) => (
              <article key={r.id} className="glass glass-hover p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/10">
                    <Sparkles size={15} className="text-accent" />
                  </div>
                  <div className="min-w-40 flex-1">
                    <h3 className="text-sm font-semibold">
                      {r.skill.name} — {r.job_role.name}
                    </h3>
                    <p className="text-[11px] text-ink-muted">
                      {r.horizon_years}y horizon
                      {r.budget_hint ? ` · ${r.budget_hint}` : ""}
                    </p>
                  </div>
                  <SeverityBadge severity={r.priority_level} />
                </div>
                <p className="mt-3 text-sm leading-relaxed">{r.recommended_action}</p>
                {r.rationale && (
                  <p className="mt-2 border-t border-border/60 pt-2 text-xs leading-relaxed text-ink-muted">
                    {r.rationale}
                  </p>
                )}
              </article>
            )
          )}
        </div>
      )}

      {tab === "training" && <TrainingTab />}
      {tab === "economic" && <EconomicTab />}
      {tab === "monitoring" && <MonitoringTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Economic indicators — read-only list feeding the demand model       */
/* ------------------------------------------------------------------ */

function EconomicTab() {
  const { data, demo } = useData<EconomicReport[]>(
    () => futureSkillsApi<EconomicReport[]>("/api/economic-reports/"),
    mockEconomicReports
  );
  // Render the fallback immediately (never a blank/invisible skeleton) and let
  // real data replace it once it arrives.
  const source = Array.isArray(data) ? data : mockEconomicReports;
  const rows = [...source].sort((a, b) => b.year - a.year);

  return (
    <div className="rise space-y-4">
      <DemoBanner show={demo} />
      <p className="text-sm text-ink-muted">
        Macro-economic indicators (labour market, AI investment, sector trends)
        that ground the skill-demand model in external reality.
      </p>
      {rows.length === 0 ? (
        <EmptyState title="No economic reports" hint="Load indicators into the future-skills service." />
      ) : (
        <section className="glass overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3 font-semibold">Indicator</th>
                <th className="px-3 py-3 font-semibold">Value</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">Sector</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">Source</th>
                <th className="px-3 py-3 font-semibold">Year</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                  <td className="px-5 py-3">
                    <p className="font-medium">{r.indicator}</p>
                    <p className="text-[11px] text-ink-muted">{r.title}</p>
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums gradient-text">{r.value}</td>
                  <td className="hidden px-3 py-3 text-ink-muted sm:table-cell">{r.sector ?? "—"}</td>
                  <td className="hidden px-3 py-3 text-xs text-ink-muted sm:table-cell">{r.source_name}</td>
                  <td className="px-3 py-3 tabular-nums text-ink-muted">{r.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Monitoring — future-skills service health & model metrics           */
/* ------------------------------------------------------------------ */

function statusColor(status: string): string {
  const ok = ["connected", "available", "ok", "healthy"].includes(status.toLowerCase());
  return ok ? "text-success" : "text-danger";
}

function MonitoringTab() {
  const { data, demo, error } = useData<ServiceMetrics>(
    () => futureSkillsApi<ServiceMetrics>("/api/metrics/"),
    mockServiceMetrics
  );
  // The metrics endpoint is staff-only; for non-staff it 403s and we render a
  // representative sample. Always paint immediately — never a blank skeleton.
  const m = data ?? mockServiceMetrics;
  const drift = useData<DriftStatus>(
    () => futureSkillsApi<DriftStatus>("/api/future-skills/drift/"),
    mockDriftStatus
  );
  const d = drift.data ?? mockDriftStatus;

  return (
    <div className="rise space-y-5">
      {error && !demo && (
        <p className="rounded-lg border border-border bg-canvas px-3.5 py-2 text-[11px] text-ink-muted">
          Live metrics require staff access — showing a representative sample.
        </p>
      )}
      <p className="text-sm text-ink-muted">
        Live health and model inventory for the future-skills service
        {m.timestamp ? ` · as of ${new Date(m.timestamp).toLocaleString()}` : ""}.
      </p>

      <DriftDiagnostic drift={d} unavailable={drift.demo || Boolean(drift.error)} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Skills" value={m.api.models.skills} icon={<Sparkles size={14} className="text-accent" />} />
        <StatCard label="Job roles" value={m.api.models.job_roles} icon={<BadgeDollarSign size={14} className="text-accent" />} />
        <StatCard label="Predictions" value={m.api.models.predictions} icon={<Radar size={14} className="text-accent" />} />
        <StatCard label="Employees" value={m.api.models.employees} icon={<Upload size={14} className="text-accent" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="glass p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Database size={15} className="text-accent" /> Infrastructure
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Database">
              <span className={statusColor(m.database.status)}>{m.database.status}</span>
              {m.database.engine ? <span className="text-ink-muted"> · {m.database.engine.split(".").pop()}</span> : null}
            </Row>
            <Row label="Cache">
              <span className={statusColor(m.cache.status)}>{m.cache.status}</span>
              {m.cache.backend ? <span className="text-ink-muted"> · {m.cache.backend.split(".").pop()}</span> : null}
            </Row>
            <Row label="Tables">
              <span className="tabular-nums">{m.database.table_count ?? "—"}</span>
            </Row>
            <Row label="Platform">
              <span className="text-xs text-ink-muted">{m.system.platform}</span>
            </Row>
          </dl>
        </section>

        <section className="glass p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Activity size={15} className="text-accent" /> Rate limits
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            {Object.entries(m.api.rate_limits).length === 0 ? (
              <p className="text-xs text-ink-muted">No throttles configured.</p>
            ) : (
              Object.entries(m.api.rate_limits).map(([k, v]) => (
                <Row key={k} label={k}>
                  <span className="tabular-nums text-ink-muted">{v}</span>
                </Row>
              ))
            )}
          </dl>
        </section>
      </div>
    </div>
  );
}

function DriftDiagnostic({ drift, unavailable }: { drift: DriftStatus; unavailable: boolean }) {
  const presentation = {
    STABLE: { label: "Stable", style: "border-success/30 bg-success/10 text-success" },
    WARNING: { label: "Warning", style: "border-warning/30 bg-warning/10 text-warning" },
    DRIFTED: { label: "Drifted", style: "border-danger/30 bg-danger/10 text-danger" },
    NO_DATA: { label: "No data", style: "border-border bg-canvas text-ink-muted" },
  }[drift.status];
  const deltaPoints = drift.delta;

  return (
    <section className="glass p-5" aria-labelledby="prediction-drift-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="prediction-drift-title" className="flex items-center gap-2 text-sm font-semibold">
            <Activity size={15} className="text-accent" /> Prediction drift
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            {unavailable
              ? "Live drift data is unavailable — showing a representative sample."
              : drift.status === "NO_DATA"
                ? "Run predictions at least twice to establish a comparison."
                : `Latest run compared with the previous prediction-score distribution${drift.last_run_at ? ` · ${new Date(drift.last_run_at).toLocaleString()}` : ""}.`}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${presentation.style}`}>
          {presentation.label}
        </span>
      </div>
      <dl className="mt-4 grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-3">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Last-run delta</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums">
            {deltaPoints === null ? "—" : `${deltaPoints >= 0 ? "+" : ""}${deltaPoints.toFixed(1)} points`}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Mean score</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{drift.mean_score === null ? "—" : drift.mean_score.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Sample size</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{drift.sample_size || "—"}</dd>
        </div>
      </dl>
    </section>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="glass p-5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {icon} {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums gradient-text">{value}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ML training — trigger a run, watch the runs history                 */
/* ------------------------------------------------------------------ */

function TrainingTab() {
  const toast = useToast();
  const { user } = useAuth();
  const canImport = hasHrAccess(user?.role ?? "");
  const [reloadKey, setReloadKey] = useState(0);
  const [version, setVersion] = useState("v3.1");
  const [notes, setNotes] = useState("");
  const [datasetPath, setDatasetPath] = useState("ml/data/future_skills_dataset.csv");
  const [training, setTraining] = useState(false);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [uploadingDataset, setUploadingDataset] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const runs = useData<TrainingRun[]>(
    () => futureSkillsApi<TrainingRun[]>("/api/future-skills/training/runs/"),
    mockTrainingRuns,
    [reloadKey]
  );
  const list = Array.isArray(runs.data) ? runs.data : [];
  const best = list.reduce<TrainingRun | null>(
    (b, r) => ((r.accuracy ?? 0) > (b?.accuracy ?? 0) ? r : b),
    null
  );

  async function train() {
    setTraining(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 900));
        toast("success", `Training complete: ${version} — accuracy 0.986 (demo).`);
      } else {
        const res = await futureSkillsApi<{ status: string; model_version: string; metrics?: { accuracy?: number } }>(
          "/api/future-skills/training/train/",
          {
            method: "POST",
            body: {
              model_version: version,
              notes: notes.trim(),
              async_training: false,
              dataset_path: datasetPath.trim(),
            },
          }
        );
        const acc = res.metrics?.accuracy;
        toast(
          "success",
          `Training ${res.status.toLowerCase()}: ${res.model_version}${acc ? ` — accuracy ${acc.toFixed(3)}` : ""}`
        );
      }
      setNotes("");
      setReloadKey((k) => k + 1);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string; error?: string })?.detail ??
            (err.body as { error?: string })?.error ??
            `Failed (${err.status}).`)
          : "Could not start training.";
      toast("error", msg);
    } finally {
      setTraining(false);
    }
  }

  async function bulkPredict() {
    setPredicting(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 700));
        toast("success", "Predictions regenerated for all employees (demo).");
      } else {
        await futureSkillsApi("/api/future-skills/bulk-predict/", {
          method: "POST",
          body: { employee_ids: [] },
        });
        toast("success", "Bulk prediction requested — check the Predictions tab.");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string; error?: string })?.detail ??
            (err.body as { error?: string })?.error ??
            `Failed (${err.status}).`)
          : "Could not run bulk predict.";
      toast("error", msg);
    } finally {
      setPredicting(false);
    }
  }

  async function uploadDataset() {
    if (!datasetFile) return;
    setUploadingDataset(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 500));
        setDatasetPath(`media/future_skills/datasets/${datasetFile.name}`);
        toast("success", `Uploaded ${datasetFile.name} (demo).`);
      } else {
        const form = new FormData();
        form.append("file", datasetFile);
        const res = await futureSkillsApi<{ dataset_path: string; filename: string; rows: number }>(
          "/api/future-skills/training/dataset/",
          { method: "POST", body: form }
        );
        setDatasetPath(res.dataset_path);
        toast("success", `Uploaded ${res.filename} — ${res.rows} rows ready for training.`);
      }
      setDatasetFile(null);
    } catch (err) {
      const msg = err instanceof ApiError
        ? ((err.body as { detail?: string; error?: string })?.detail ?? (err.body as { error?: string })?.error ?? `Upload failed (${err.status}).`)
        : "Could not upload the training dataset.";
      toast("error", msg);
    } finally {
      setUploadingDataset(false);
    }
  }

  return (
    <div className="rise space-y-5">
      <section className="glass p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <BrainCog size={15} className="text-accent" /> Train a new model
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Kicks off the RandomForest training pipeline on the skill-demand
          dataset, then you can regenerate predictions from it.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Model version">
            <TextInput value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v3.1" />
          </Field>
          <Field label="Notes">
            <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional run notes" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Dataset path" hint="Path inside the future-skills container">
              <TextInput value={datasetPath} onChange={(e) => setDatasetPath(e.target.value)} />
            </Field>
          </div>
          {canImport && (
            <div className="sm:col-span-2 border-t border-border/60 pt-4">
              <label htmlFor="training-dataset-csv" className="text-xs font-medium text-ink">Training dataset CSV</label>
              <p className="mt-0.5 text-[11px] text-ink-muted">Upload a validated CSV to replace the dataset used by the next training run.</p>
              <div className="mt-2 flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <input
                  id="training-dataset-csv"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setDatasetFile(e.target.files?.[0] ?? null)}
                  className="w-full min-w-0 max-w-full flex-1 text-xs text-ink-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-canvas file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink hover:file:border-accent/50"
                />
                <GhostButton onClick={uploadDataset} disabled={!datasetFile || uploadingDataset}>
                  {uploadingDataset ? <Loader2 size={14} className="inline animate-spin" /> : <Upload size={14} className="inline" />} {uploadingDataset ? "Uploading…" : "Upload dataset"}
                </GhostButton>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <PrimaryButton onClick={train} disabled={training}>
            {training ? <Loader2 size={14} className="animate-spin" /> : <BrainCog size={14} />}
            {training ? "Training…" : "Start training"}
          </PrimaryButton>
          <GhostButton onClick={bulkPredict} disabled={predicting}>
            {predicting ? <Loader2 size={14} className="inline animate-spin" /> : <Radar size={14} className="inline" />}{" "}
            Regenerate predictions
          </GhostButton>
          {canImport && (
            <GhostButton onClick={() => setImportOpen(true)}>
              <Upload size={14} className="inline" /> Import employees
            </GhostButton>
          )}
        </div>
      </section>

      <ImportEmployeesModal open={importOpen} onClose={() => setImportOpen(false)} />

      {best && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Best accuracy" value={best.accuracy} />
          <MetricCard label="Precision" value={best.precision} />
          <MetricCard label="Recall" value={best.recall} />
          <MetricCard label="F1 score" value={best.f1_score} />
        </div>
      )}

      <section className="glass overflow-x-auto">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Training runs</h2>
        </div>
        {runs.loading ? (
          <div className="p-5"><Skeleton className="h-40" /></div>
        ) : list.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No training runs yet" hint="Start a run above to populate the model." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3 font-semibold">Version</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Accuracy</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">F1</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">Duration</th>
                <th className="px-3 py-3 font-semibold">By</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                  <td className="px-5 py-3 font-medium">{r.model_version}</td>
                  <td className="px-3 py-3 text-xs text-ink-muted">
                    {new Date(r.run_date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {r.accuracy !== null ? r.accuracy.toFixed(3) : "—"}
                  </td>
                  <td className="hidden px-3 py-3 tabular-nums sm:table-cell">
                    {r.f1_score !== null ? r.f1_score.toFixed(3) : "—"}
                  </td>
                  <td className="hidden px-3 py-3 text-xs tabular-nums text-ink-muted sm:table-cell">
                    {r.training_duration_seconds !== null ? `${r.training_duration_seconds}s` : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-ink-muted">{r.trained_by_username ?? "—"}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-success">
                      <CheckCircle2 size={12} /> {r.status.toLowerCase()}
                    </span>
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

function MetricCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="glass p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums gradient-text">
        {value !== null ? `${(value * 100).toFixed(1)}%` : "—"}
      </p>
    </div>
  );
}

/* Bulk employee import (HR only) --------------------------------------- */

const IMPORT_PLACEHOLDER = `Amina Karimi, a.karimi@acme.dev, ENG, Engineering Manager, Python;Kubernetes;MLOps
Sophie Leroy, s.leroy@acme.dev, DATA, Data Scientist, Python;MLOps
Youssef Ben Ali, y.benali@acme.dev, ENG, Backend Engineer, Python;REST API`;

interface ParsedRow {
  name: string;
  email: string;
  department: string;
  position: string;
  current_skills: string[];
}

function parseImportRows(raw: string): { rows: ParsedRow[]; problems: string[] } {
  const rows: ParsedRow[] = [];
  const problems: string[] = [];
  raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line, i) => {
      const parts = line.split(",").map((p) => p.trim());
      const [name, email, department, position, skills] = parts;
      if (!name || !email) {
        problems.push(`Line ${i + 1}: needs at least "name, email".`);
        return;
      }
      if (!email.includes("@")) {
        problems.push(`Line ${i + 1}: "${email}" is not a valid email.`);
        return;
      }
      rows.push({
        name,
        email,
        // department and position are required by the backend model — default
        // them so a minimal "name, email" row still imports cleanly.
        department: department || "Unspecified",
        position: position || "Unspecified",
        current_skills: skills ? skills.split(/[;|]/).map((s) => s.trim()).filter(Boolean) : [],
      });
    });
  return { rows, problems };
}

function ImportEmployeesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [autoPredict, setAutoPredict] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const { rows, problems } = useMemo(() => parseImportRows(text), [text]);

  function reset() {
    setText("");
    setResult(null);
    setAutoPredict(true);
  }

  async function submit() {
    if (rows.length === 0) {
      toast("error", "Add at least one valid employee row.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 800));
        setResult({ status: "success", created: rows.length, updated: 0, errors: [], predictions_generated: autoPredict });
        toast("success", `Imported ${rows.length} employee${rows.length === 1 ? "" : "s"} (demo).`);
      } else {
        const res = await futureSkillsApi<BulkImportResult>("/api/future-skills/bulk-import/employees/", {
          method: "POST",
          body: { employees: rows, auto_predict: autoPredict, horizon_years: 3 },
        });
        setResult(res);
        toast("success", `Imported: ${res.created} created, ${res.updated} updated.`);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string; error?: string })?.detail ??
            (err.body as { error?: string })?.error ??
            `Failed (${err.status}).`)
          : "Could not import employees.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import employees"
      footer={
        <>
          <GhostButton onClick={() => { reset(); onClose(); }} disabled={busy}>Close</GhostButton>
          <PrimaryButton onClick={submit} disabled={busy || rows.length === 0}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Import {rows.length > 0 ? `${rows.length} row${rows.length === 1 ? "" : "s"}` : ""}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-muted">
          One employee per line:{" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11px]">name, email, department, position, skill1;skill2</code>.
          Department, position and skills are optional. Existing employees
          (matched by email) are updated.
        </p>
        <Field label="Employees">
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder={IMPORT_PLACEHOLDER}
            className="font-mono text-[12px]"
          />
        </Field>

        <label className="flex items-center gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={autoPredict}
            onChange={(e) => setAutoPredict(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[var(--accent)]"
          />
          Generate skill predictions after import (3-year horizon)
        </label>

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

        {result && (
          <div className="rounded-lg border border-success/25 bg-success/10 px-3.5 py-3 text-xs">
            <p className="font-semibold text-success">
              {result.created} created · {result.updated} updated
              {result.predictions_generated ? " · predictions generated" : ""}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 text-danger">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e.email ? `${e.email}: ` : ""}{e.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
