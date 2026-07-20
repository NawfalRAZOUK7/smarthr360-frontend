"use client";

import { useState } from "react";
import { Boxes, Building2, ChevronDown, Grid3x3, Loader2, Network, Pencil, Plus, Trash2 } from "lucide-react";
import { ApiError, coreHrApi, getAccessToken } from "@/lib/api";
import {
  mockDepartments,
  mockInteropCompetencyDefs,
  mockInteropPersonCompetencies,
  mockInteropPositionModels,
  mockSkillMatrix,
  mockSkillsCatalog,
} from "@/lib/mock";
import type {
  Department,
  InteropCompetencyDefinition,
  InteropPersonCompetency,
  InteropPositionModel,
  Skill,
  SkillMatrix,
} from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { hasHrAccess } from "@/lib/rbac";
import { DemoBanner, EmptyState, Skeleton } from "@/components/ui";
import Modal, { Field, GhostButton, PrimaryButton, Select, TextArea, TextInput } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";

export default function OrganizationPage() {
  return (
    <RoleGate rule={ACCESS.organization}>
      <OrgInner />
    </RoleGate>
  );
}

type Tab = "departments" | "skills" | "matrix" | "interop";

function OrgInner() {
  const { user } = useAuth();
  const canEditDepts = hasHrAccess(user?.role ?? ""); // departments = HR/Admin
  const [tab, setTab] = useState<Tab>("departments");

  return (
    <div className="space-y-6">
      <div className="rise flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          Manage the organization&apos;s departments and the skills catalog.
        </p>
        <div className="glass flex rounded-full p-1">
          <button
            onClick={() => setTab("departments")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              tab === "departments" ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Building2 size={13} /> Departments
          </button>
          <button
            onClick={() => setTab("skills")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              tab === "skills" ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Boxes size={13} /> Skills
          </button>
          <button
            onClick={() => setTab("matrix")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              tab === "matrix" ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Grid3x3 size={13} /> Skill matrix
          </button>
          <button
            onClick={() => setTab("interop")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              tab === "interop" ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Network size={13} /> Interop
          </button>
        </div>
      </div>

      {tab === "departments" && <DepartmentsTab canEdit={canEditDepts} />}
      {tab === "skills" && <SkillsTab canEdit />}
      {tab === "matrix" && <SkillMatrixTab />}
      {tab === "interop" && <InteropTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HR-Open interop browser — read-only standardized export             */
/* ------------------------------------------------------------------ */

type InteropResource = "definitions" | "persons" | "positions";

const INTEROP_RESOURCES: { id: InteropResource; label: string; path: string }[] = [
  { id: "definitions", label: "Competency definitions", path: "/api/hr/interop/competency-definitions/" },
  { id: "persons", label: "Person competencies", path: "/api/hr/interop/person-competencies/" },
  { id: "positions", label: "Position models", path: "/api/hr/interop/position-competency-models/" },
];

function InteropTab() {
  const [resource, setResource] = useState<InteropResource>("definitions");
  const active = INTEROP_RESOURCES.find((r) => r.id === resource)!;

  return (
    <div className="rise space-y-4">
      <div className="glass p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Network size={15} className="text-accent" /> HR-Open interoperability export
        </h2>
        <p className="mt-1.5 text-xs text-ink-muted">
          Competency data serialized in the{" "}
          <span className="font-medium text-ink">HR Open Standards</span> (HR-XML)
          vocabulary — {" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11px]">CompetencyDefinition</code>,{" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11px]">PersonCompetency</code>,{" "}
          <code className="rounded bg-canvas px-1 py-0.5 text-[11px]">PositionCompetencyModel</code>{" "}
          — for exchange with external HRIS / talent systems. Read-only.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {INTEROP_RESOURCES.map((r) => (
            <button
              key={r.id}
              onClick={() => setResource(r.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                resource === r.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-ink-muted hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-muted/80">GET {active.path}</p>
      </div>

      {resource === "definitions" && <InteropDefinitions />}
      {resource === "persons" && <InteropPersons />}
      {resource === "positions" && <InteropPositions />}
    </div>
  );
}

function RawJson({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-accent"
      >
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        {open ? "Hide" : "View"} raw HR-Open JSON
      </button>
      {open && (
        <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-border bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-muted">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

function InteropDefinitions() {
  const { data, loading, demo } = useData<InteropCompetencyDefinition[]>(
    () => coreHrApi<InteropCompetencyDefinition[]>(INTEROP_RESOURCES[0].path),
    mockInteropCompetencyDefs
  );
  const items = Array.isArray(data) ? data : [];
  if (loading) return <Skeleton className="h-48" />;

  return (
    <div className="space-y-4">
      <DemoBanner show={demo} />
      {items.length === 0 ? (
        <EmptyState title="No competency definitions" hint="Add skills to the catalog first." />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2">
            {items.map((c) => (
              <div key={c.id} className="glass p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{c.name}</p>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">{c.competencyId}</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{c.description || "—"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="rounded bg-canvas px-1.5 py-0.5 text-ink-muted">{c.competencyCategory}</span>
                  <span className={c.active ? "text-success" : "text-ink-muted"}>{c.active ? "active" : "inactive"}</span>
                  <span className="text-ink-muted/70">taxonomy: {c.taxonomy.name}</span>
                </div>
              </div>
            ))}
          </section>
          <RawJson value={items} />
        </>
      )}
    </div>
  );
}

function InteropPersons() {
  const { data, loading, demo } = useData<InteropPersonCompetency[]>(
    () => coreHrApi<InteropPersonCompetency[]>(INTEROP_RESOURCES[1].path),
    mockInteropPersonCompetencies
  );
  const items = Array.isArray(data) ? data : [];
  if (loading) return <Skeleton className="h-48" />;

  return (
    <div className="space-y-4">
      <DemoBanner show={demo} />
      {items.length === 0 ? (
        <EmptyState title="No person competencies" hint="Evaluate employee skills to populate this." />
      ) : (
        <>
          <section className="glass overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  <th className="px-5 py-3 font-semibold">Person</th>
                  <th className="px-3 py-3 font-semibold">Competency</th>
                  <th className="px-3 py-3 font-semibold">Score</th>
                  <th className="px-3 py-3 font-semibold">Target</th>
                  <th className="hidden px-3 py-3 font-semibold sm:table-cell">Effective from</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const dim = p.competencyDimensions[0];
                  return (
                    <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                      <td className="px-5 py-3">
                        <p className="font-medium">{p.person.name}</p>
                        <p className="text-[11px] text-ink-muted">{p.person.jobTitle ?? "—"} · {p.person.departmentCode ?? "—"}</p>
                      </td>
                      <td className="px-3 py-3">{p.competency.name}</td>
                      <td className="px-3 py-3 tabular-nums">
                        {dim?.score.value ?? "—"}<span className="text-ink-muted">/{dim?.score.maximumValue ?? 4}</span>
                        <span className="ml-1 text-[11px] text-ink-muted">{dim?.score.name}</span>
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {dim?.targetValue ?? "—"}
                        {dim?.targetGap != null && dim.targetGap > 0 && (
                          <span className="ml-1 text-[11px] text-danger">(−{dim.targetGap})</span>
                        )}
                      </td>
                      <td className="hidden px-3 py-3 text-xs text-ink-muted sm:table-cell">
                        {p.effectiveDateRange.startDate ? new Date(p.effectiveDateRange.startDate).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
          <RawJson value={items} />
        </>
      )}
    </div>
  );
}

function InteropPositions() {
  const { data, loading, demo } = useData<InteropPositionModel[]>(
    () => coreHrApi<InteropPositionModel[]>(INTEROP_RESOURCES[2].path),
    mockInteropPositionModels
  );
  const items = Array.isArray(data) ? data : [];
  if (loading) return <Skeleton className="h-48" />;

  return (
    <div className="space-y-4">
      <DemoBanner show={demo} />
      {items.length === 0 ? (
        <EmptyState title="No position models" hint="Departments with rated skills produce models." />
      ) : (
        <>
          <section className="space-y-3">
            {items.map((m) => (
              <div key={m.id} className="glass p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Org unit · {m.orgUnit.departmentCode}</p>
                  <span className="text-xs text-ink-muted">{m.headcount} people</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {m.competencies.map((e) => (
                    <div key={e.competency.id} className="flex items-center justify-between text-sm">
                      <span>{e.competency.name}</span>
                      <span className="flex items-center gap-3 text-xs text-ink-muted">
                        <span className="tabular-nums">avg {e.expectedProficiency.averageValue.toFixed(1)}/{e.expectedProficiency.maximumValue}</span>
                        <span className="tabular-nums">{e.coveragePercent}% cov</span>
                        {e.averageTargetGap != null && e.averageTargetGap > 0 && (
                          <span className="tabular-nums text-danger">−{e.averageTargetGap.toFixed(1)} gap</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
          <RawJson value={items} />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skill matrix — coverage heatmap                                     */
/* ------------------------------------------------------------------ */

function levelColor(level: number): string {
  // 1 (weak, red) -> 4 (strong, green)
  if (level >= 3.5) return "bg-success/80 text-white";
  if (level >= 2.75) return "bg-accent-3/70 text-white";
  if (level >= 2) return "bg-warning/70 text-white";
  return "bg-danger/70 text-white";
}

function SkillMatrixTab() {
  const { data, loading, demo, error } = useData<SkillMatrix>(
    () => coreHrApi<SkillMatrix>("/api/hr/skill-matrix/"),
    mockSkillMatrix
  );

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error} — Manager, HR or Admin only.</p>;

  const rows = [...(data?.skills ?? [])].sort((a, b) => b.average_level - a.average_level);

  return (
    <div className="rise space-y-4">
      <DemoBanner show={demo} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {data?.department === "ALL" ? "Organization-wide" : data?.department} skill
          coverage · {data?.headcount ?? 0} people. Colour = average proficiency (1–4).
        </p>
        <div className="hidden items-center gap-2 text-[10px] text-ink-muted sm:flex">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-danger/70" /> &lt;2</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-warning/70" /> 2–2.7</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-accent-3/70" /> 2.8–3.4</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-success/80" /> ≥3.5</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No skill evaluations yet" hint="Rate employee skills to build the matrix." />
      ) : (
        <section className="glass overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3 font-semibold">Skill</th>
                <th className="px-3 py-3 font-semibold">Avg level</th>
                <th className="px-3 py-3 font-semibold">Coverage</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">Evaluated</th>
                <th className="px-3 py-3 font-semibold">Target gap</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.skill_code} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                  <td className="px-5 py-3 font-medium">{r.skill}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex h-7 w-11 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${levelColor(r.average_level)}`}>
                      {r.average_level.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${r.coverage_percent}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-ink-muted">{r.coverage_percent}%</span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 tabular-nums text-ink-muted sm:table-cell">{r.evaluated_count}</td>
                  <td className={`px-3 py-3 font-semibold tabular-nums ${r.average_target_gap > 0.5 ? "text-danger" : "text-ink-muted"}`}>
                    {r.average_target_gap > 0 ? `−${r.average_target_gap.toFixed(1)}` : "0.0"}
                  </td>
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
/* Departments (HR/Admin)                                              */
/* ------------------------------------------------------------------ */

function DepartmentsTab({ canEdit }: { canEdit: boolean }) {
  const toast = useToast();
  const [key, setKey] = useState(0);
  const [edit, setEdit] = useState<Department | null | "new">(null);
  const { data, loading, demo } = useData<Department[]>(
    () => coreHrApi<Department[]>("/api/hr/departments/"),
    mockDepartments,
    [key]
  );
  const list = Array.isArray(data) ? data : [];

  async function remove(d: Department) {
    if (!confirm(`Delete department "${d.name}"? This cannot be undone.`)) return;
    try {
      if (getAccessToken() !== "demo")
        await coreHrApi(`/api/hr/departments/${d.id}/`, { method: "DELETE" });
      toast("success", "Department deleted.");
      setKey((k) => k + 1);
    } catch (err) {
      toast("error", err instanceof ApiError ? `Delete failed (${err.status}).` : "Delete failed.");
    }
  }

  return (
    <div className="rise space-y-4">
      <DemoBanner show={demo} />
      {canEdit && (
        <div className="flex justify-end">
          <PrimaryButton onClick={() => setEdit("new")}>
            <Plus size={15} /> New department
          </PrimaryButton>
        </div>
      )}
      {loading ? (
        <Skeleton className="h-64" />
      ) : list.length === 0 ? (
        <EmptyState title="No departments" hint="Create one to start." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <article key={d.id} className="glass glass-hover p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/10">
                  <Building2 size={15} className="text-accent" />
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  {d.code}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{d.name}</h3>
              {d.description && <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{d.description}</p>}
              {canEdit && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setEdit(d)} className="flex items-center gap-1 text-xs text-accent hover:underline">
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => remove(d)} className="flex items-center gap-1 text-xs text-danger hover:underline">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {edit !== null && (
        <DepartmentModal
          dept={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => setKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function DepartmentModal({ dept, onClose, onSaved }: { dept: Department | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(dept?.name ?? "");
  const [code, setCode] = useState(dept?.code ?? "");
  const [description, setDescription] = useState(dept?.description ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim() || !code.trim()) {
      toast("error", "Name and code are required.");
      return;
    }
    setBusy(true);
    try {
      const body = { name: name.trim(), code: code.trim().toUpperCase(), description: description.trim() };
      if (getAccessToken() !== "demo") {
        if (dept) await coreHrApi(`/api/hr/departments/${dept.id}/`, { method: "PATCH", body });
        else await coreHrApi("/api/hr/departments/", { method: "POST", body });
      }
      toast("success", dept ? "Department updated." : "Department created.");
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { code?: string[] })?.code?.[0] ?? `Failed (${err.status}).`) : "Failed.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={dept ? `Edit ${dept.name}` : "New department"}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            {dept ? "Save" : "Create"}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Engineering" /></Field>
          </div>
          <Field label="Code"><TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="ENG" /></Field>
        </div>
        <Field label="Description"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Skills (Manager+)                                                   */
/* ------------------------------------------------------------------ */

function SkillsTab({ canEdit }: { canEdit: boolean }) {
  const toast = useToast();
  const [key, setKey] = useState(0);
  const [edit, setEdit] = useState<Skill | null | "new">(null);
  const { data, loading, demo } = useData<Skill[]>(
    () => coreHrApi<Skill[]>("/api/hr/skills/?page_size=200"),
    mockSkillsCatalog,
    [key]
  );
  const list = Array.isArray(data) ? data : [];

  async function remove(s: Skill) {
    if (!confirm(`Delete skill "${s.name}"?`)) return;
    try {
      if (getAccessToken() !== "demo")
        await coreHrApi(`/api/hr/skills/${s.id}/`, { method: "DELETE" });
      toast("success", "Skill deleted.");
      setKey((k) => k + 1);
    } catch (err) {
      toast("error", err instanceof ApiError ? `Delete failed (${err.status}).` : "Delete failed.");
    }
  }

  return (
    <div className="rise space-y-4">
      <DemoBanner show={demo} />
      {canEdit && (
        <div className="flex justify-end">
          <PrimaryButton onClick={() => setEdit("new")}>
            <Plus size={15} /> New skill
          </PrimaryButton>
        </div>
      )}
      {loading ? (
        <Skeleton className="h-64" />
      ) : list.length === 0 ? (
        <EmptyState title="No skills" hint="Create one to start the catalog." />
      ) : (
        <section className="glass overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3 font-semibold">Skill</th>
                <th className="px-3 py-3 font-semibold">Code</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell">Category</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                {canEdit && <th className="px-3 py-3" />}
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-3 py-3 text-xs text-ink-muted">{s.code}</td>
                  <td className="hidden px-3 py-3 text-xs capitalize text-ink-muted sm:table-cell">{s.category ?? "—"}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      s.is_active !== false ? "border-success/25 bg-success/10 text-success" : "border-border text-ink-muted"
                    }`}>
                      {s.is_active !== false ? "active" : "inactive"}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEdit(s)} aria-label="Edit" className="text-ink-muted hover:text-accent"><Pencil size={14} /></button>
                        <button onClick={() => remove(s)} aria-label="Delete" className="text-ink-muted hover:text-danger"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {edit !== null && (
        <SkillModal skill={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSaved={() => setKey((k) => k + 1)} />
      )}
    </div>
  );
}

function SkillModal({ skill, onClose, onSaved }: { skill: Skill | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(skill?.name ?? "");
  const [code, setCode] = useState(skill?.code ?? "");
  const [category, setCategory] = useState(skill?.category ?? "tech");
  const [description, setDescription] = useState(skill?.description ?? "");
  const [isActive, setIsActive] = useState(skill?.is_active !== false);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim() || !code.trim()) {
      toast("error", "Name and code are required.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        name: name.trim(), code: code.trim().toUpperCase(),
        category, description: description.trim(), is_active: isActive,
      };
      if (getAccessToken() !== "demo") {
        if (skill) await coreHrApi(`/api/hr/skills/${skill.id}/`, { method: "PATCH", body });
        else await coreHrApi("/api/hr/skills/", { method: "POST", body });
      }
      toast("success", skill ? "Skill updated." : "Skill created.");
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { code?: string[] })?.code?.[0] ?? `Failed (${err.status}).`) : "Failed.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={skill ? `Edit ${skill.name}` : "New skill"}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            {skill ? "Save" : "Create"}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Kubernetes" /></Field>
          </div>
          <Field label="Code"><TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="K8S" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="tech">Tech</option>
              <option value="business">Business</option>
              <option value="soft">Soft</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")}>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </Select>
          </Field>
        </div>
        <Field label="Description"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></Field>
      </div>
    </Modal>
  );
}
