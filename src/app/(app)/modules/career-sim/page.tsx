"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Compass, GitCompareArrows, History, Loader2, ShieldCheck, Trophy, UserRound } from "lucide-react";
import { ApiError, careerSimApi, getAccessToken } from "@/lib/api";
import {
  mockCareerCompare,
  mockCareerMobility,
  mockCareerProfile,
  mockCareerSimHistory,
  mockPositions,
} from "@/lib/mock";
import type {
  CareerCompareResponse,
  CareerMobility,
  CareerPosition,
  CareerProfile,
  CareerSimHistory,
  CareerSuccession,
} from "@/lib/types";
import { useData } from "@/lib/use-data";
import { DemoBanner, EmptyState, Skeleton } from "@/components/ui";

const BAND_STYLE: Record<string, string> = {
  READY: "text-success",
  READY_SOON: "text-accent-3",
  DEVELOPING: "text-warning",
  EARLY: "text-danger",
};

type Tab = "compare" | "mobility" | "succession" | "profile" | "history";

const TABS: { id: Tab; label: string; icon: typeof GitCompareArrows }[] = [
  { id: "compare", label: "Compare", icon: GitCompareArrows },
  { id: "mobility", label: "Mobility", icon: Compass },
  { id: "succession", label: "Succession", icon: ShieldCheck },
  { id: "profile", label: "My profile", icon: UserRound },
  { id: "history", label: "History", icon: History },
];

export default function CareerSimPage() {
  const [tab, setTab] = useState<Tab>("compare");
  return (
    <div className="space-y-6">
      <div className="rise flex justify-end">
        <div className="glass flex rounded-full p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                tab === t.id ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow" : "text-ink-muted hover:text-ink"
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "compare" && <CompareTab />}
      {tab === "mobility" && <MobilityTab />}
      {tab === "succession" && <SuccessionTab />}
      {tab === "profile" && <ProfileTab />}
      {tab === "history" && <HistoryTab />}
    </div>
  );
}

function SuccessionTab() {
  const succession = useData<CareerSuccession>(
    () => careerSimApi("/api/career/succession/"),
    { ready_threshold: 70, roles: [] }
  );
  if (succession.loading) return <div className="space-y-3"><div className="glass p-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={15} className="text-accent" /> Critical-role coverage</h2></div><Skeleton className="h-64" /></div>;
  if (succession.error) return <div className="space-y-3"><div className="glass p-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={15} className="text-accent" /> Critical-role coverage</h2></div><p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{succession.error}</p></div>;
  const data = succession.data ?? { ready_threshold: 70, roles: [] };
  return (
    <div className="rise space-y-4">
      <div className="glass p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={15} className="text-accent" /> Critical-role coverage</h2>
        <p className="mt-1 text-xs text-ink-muted">Internal candidates at or above {data.ready_threshold}% readiness.</p>
      </div>
      {data.roles.length === 0 ? <EmptyState title="No active target roles" hint="Create target positions to assess succession coverage." /> : data.roles.map((role) => (
        <article key={role.target_position_id} className="glass p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-semibold">{role.target_position}</p><p className="text-[11px] text-ink-muted">{role.department || "All departments"}</p></div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${role.ready_count ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>{role.ready_count} ready</span>
          </div>
          {role.candidates.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{role.candidates.map((candidate) => <span key={candidate.user_id} className="rounded-full border border-border px-2.5 py-1 text-xs">{candidate.name} · {Math.round(candidate.readiness_percent)}%</span>)}</div>}
        </article>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobility — the roles you're most ready for right now                */
/* ------------------------------------------------------------------ */

function MobilityTab() {
  const { data, loading, demo, error } = useData<CareerMobility>(
    () => careerSimApi<CareerMobility>("/api/career/mobility/"),
    mockCareerMobility
  );

  if (loading) return <div className="space-y-3"><div className="glass p-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><Compass size={15} className="text-accent" /> Roles you&apos;re most ready for</h2></div><Skeleton className="h-64" /></div>;
  if (error)
    return <div className="space-y-3"><div className="glass p-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><Compass size={15} className="text-accent" /> Roles you&apos;re most ready for</h2></div><p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p></div>;

  const m = data ?? mockCareerMobility;
  const positions = Array.isArray(m.positions) ? m.positions : [];

  return (
    <div className="rise space-y-4">
      <DemoBanner show={demo} />
      <div className="glass p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Compass size={15} className="text-accent" /> Roles you&apos;re most ready for
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Every open position ranked by how reachable it is for you now —{" "}
          <span className="font-semibold text-success">{m.ready_count}</span> role
          {m.ready_count === 1 ? "" : "s"} at ≥{Math.round(m.ready_threshold)}% readiness.
        </p>
      </div>

      {positions.length === 0 ? (
        <EmptyState title="No open positions" hint="Add target positions to see mobility options." />
      ) : (
        <div className="space-y-3">
          {positions.map((p) => (
            <div key={p.target_position_id} className="glass glass-hover p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {p.target_position}
                    {p.department ? <span className="text-xs text-ink-muted"> · {p.department}</span> : null}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {p.missing_skills} skill{p.missing_skills === 1 ? "" : "s"} to close
                    {p.estimated_years_to_ready != null ? ` · ~${p.estimated_years_to_ready}y to ready` : ""}
                    {" · "}
                    {Math.round(p.success_probability * 100)}% success odds
                  </p>
                </div>
                <span className={`text-2xl font-bold tabular-nums ${BAND_STYLE[p.readiness_band] ?? "text-ink"}`}>
                  {Math.round(p.readiness_percent)}%
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-700"
                  style={{ width: `${Math.min(p.readiness_percent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareTab() {
  const positions = useData<{ positions: CareerPosition[] } | CareerPosition[]>(
    () => careerSimApi("/api/career/positions/"),
    { positions: mockPositions }
  );
  const list: CareerPosition[] = Array.isArray(positions.data)
    ? positions.data
    : positions.data?.positions ?? [];

  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<CareerCompareResponse | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultDemo, setResultDemo] = useState(false);

  // Preselect the first three positions once loaded.
  useEffect(() => {
    if (list.length > 0 && selected.length === 0) {
      setSelected(list.slice(0, 3).map((p) => p.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  function toggle(id: number) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < 10 ? [...s, id] : s
    );
  }

  async function compare() {
    setComparing(true);
    setError(null);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 500));
        setResult(mockCareerCompare);
        setResultDemo(true);
        return;
      }
      const res = await careerSimApi<CareerCompareResponse>("/api/career/compare/", {
        method: "POST",
        body: { target_position_ids: selected },
      });
      setResult(res);
      setResultDemo(false);
    } catch (err) {
      if (err instanceof TypeError) {
        setResult(mockCareerCompare);
        setResultDemo(true);
      } else if (err instanceof ApiError) {
        const body = err.body as { detail?: string } | null;
        setError(body?.detail ?? `Comparison failed (${err.status}).`);
      } else {
        setError("Comparison failed.");
      }
    } finally {
      setComparing(false);
    }
  }

  return (
    <div className="space-y-6">
      <DemoBanner show={positions.demo || resultDemo} />

      <div className="rise">
        <p className="text-sm text-ink-muted">
          Pick up to 10 target positions — the engine ranks them by how reachable
          they are for you, using your live skills profile from core-hr.
        </p>
      </div>

      {positions.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="No target positions defined" hint="Create positions in the career-sim service first." />
      ) : (
        <div className="rise rise-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const active = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`glass glass-hover p-4 text-left transition-all ${
                  active ? "ring-2 ring-accent/60" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <span
                    className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                      active
                        ? "border-accent bg-gradient-to-br from-accent to-accent-2"
                        : "border-border"
                    }`}
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-muted">
                  {p.department} · {p.level}
                </p>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-muted/80">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <div className="rise rise-2 flex items-center gap-3">
        <button
          onClick={compare}
          disabled={selected.length < 2 || comparing}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:brightness-110 disabled:opacity-50"
        >
          {comparing ? <Loader2 size={15} className="animate-spin" /> : <GitCompareArrows size={15} />}
          Compare {selected.length} trajectories
        </button>
        {selected.length < 2 && (
          <p className="text-xs text-ink-muted">Select at least 2 positions.</p>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      {result && (
        <section className="rise space-y-3">
          <div className="glass flex items-center gap-3 border-accent/30 bg-gradient-to-r from-accent/10 to-accent-2/5 p-4">
            <Trophy size={18} className="text-accent" />
            <p className="text-sm">
              Recommended next move:{" "}
              <span className="font-bold gradient-text">{result.recommended ?? "—"}</span>
            </p>
          </div>

          <div className="space-y-3">
            {result.ranking.map((r) => (
              <article key={r.target_position_id} className="glass glass-hover p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      r.rank === 1
                        ? "bg-gradient-to-br from-accent to-accent-2 text-white shadow-lg shadow-accent/30"
                        : "border border-border text-ink-muted"
                    }`}
                  >
                    {r.rank}
                  </span>
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-semibold">{r.target_position}</p>
                    <p className="text-[11px] text-ink-muted">{r.department}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-muted">Readiness</p>
                      <p className={`text-lg font-bold tabular-nums ${BAND_STYLE[r.readiness_band] ?? ""}`}>
                        {r.readiness_percent.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-muted">Success odds</p>
                      <p className="text-lg font-bold tabular-nums">
                        {(r.success_probability * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-muted">Time to ready</p>
                      <p className="text-lg font-bold tabular-nums">
                        {r.estimated_years_to_ready !== null ? `${r.estimated_years_to_ready}y` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-muted">Missing skills</p>
                      <p className="text-lg font-bold tabular-nums">{r.missing_skills}</p>
                      {r.missing_skill_names?.[0] && (
                        <Link href={`/skill-gaps?skill=${encodeURIComponent(r.missing_skill_names[0])}&title=${encodeURIComponent(`Training for ${r.target_position}`)}`} className="mt-1 block text-[10px] font-semibold text-accent hover:underline">Create training</Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent via-accent-2 to-accent-3 transition-all duration-1000"
                    style={{ width: `${r.readiness_percent}%` }}
                  />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-muted">
                  <Award size={11} /> {r.readiness_band.replace("_", " ").toLowerCase()}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* My profile — declared competencies, languages                       */
/* ------------------------------------------------------------------ */

function ProfileTab() {
  const { data, loading, demo, error } = useData<CareerProfile>(
    () => careerSimApi<CareerProfile>("/api/career/profile/"),
    mockCareerProfile
  );

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>;

  const comps = data?.competencies ?? [];
  const langs = data?.languages ?? [];

  return (
    <div className="rise space-y-5">
      <DemoBanner show={demo} />
      <p className="text-sm text-ink-muted">
        Your declared career profile — the competencies and languages the
        engine uses to score reachability. {data?.simulations_count ?? 0} simulations run.
      </p>

      <section className="glass p-5">
        <h2 className="text-sm font-semibold">Competencies</h2>
        {comps.length === 0 ? (
          <p className="mt-2 text-xs text-ink-muted">No competencies declared yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {comps.map((c) => (
              <div key={c.code} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 font-medium">{c.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-700"
                    style={{ width: `${(c.current_level / 4) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-ink-muted">{c.current_level}/4</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass p-5">
        <h2 className="text-sm font-semibold">Languages</h2>
        {langs.length === 0 ? (
          <p className="mt-2 text-xs text-ink-muted">No languages declared.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {langs.map((l, i) => (
              <span key={i} className="rounded-full border border-border px-3 py-1 text-xs">{l}</span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* History — past trajectory simulations                               */
/* ------------------------------------------------------------------ */

function HistoryTab() {
  const { data, loading, demo, error } = useData<CareerSimHistory>(
    () => careerSimApi<CareerSimHistory>("/api/career/simulations/"),
    mockCareerSimHistory
  );

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>;

  const runs = data?.simulations ?? [];

  return (
    <div className="rise space-y-4">
      <DemoBanner show={demo} />
      {runs.length === 0 ? (
        <EmptyState title="No simulations yet" hint="Run a comparison to build your history." />
      ) : (
        <section className="glass overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3 font-semibold">Target position</th>
                <th className="px-3 py-3 font-semibold">Match</th>
                <th className="px-3 py-3 font-semibold">Success odds</th>
                <th className="px-3 py-3 font-semibold">ETA</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                  <td className="px-5 py-3 font-medium">{s.target_position}</td>
                  <td className="px-3 py-3 tabular-nums">{s.score_matching != null ? `${s.score_matching}%` : "—"}</td>
                  <td className="px-3 py-3 tabular-nums">{s.success_probability != null ? `${(s.success_probability * 100).toFixed(0)}%` : "—"}</td>
                  <td className="px-3 py-3 tabular-nums">{s.estimated_duration != null ? `${s.estimated_duration}y` : "—"}</td>
                  <td className="hidden px-3 py-3 text-xs text-ink-muted sm:table-cell">{new Date(s.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
