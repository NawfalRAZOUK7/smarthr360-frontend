"use client";

import { useMemo, useState } from "react";
import { Download, FileText, LayoutGrid, Loader2, Network, Plus, Search } from "lucide-react";
import { coreHrApi, downloadFile, getAccessToken } from "@/lib/api";
import { SERVICES } from "@/lib/config";
import { mockEmployees, mockOrgChart } from "@/lib/mock";
import type { EmployeeDocument, EmployeeProfile, OrgChart, OrgNode } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { hasHrAccess } from "@/lib/rbac";
import { DemoBanner, EmptyState, Skeleton } from "@/components/ui";
import { useToast } from "@/components/Toast";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";
import Modal, { Field, GhostButton, PrimaryButton, Select, TextInput } from "@/components/Modal";

export default function EmployeesPage() {
  return (
    <RoleGate rule={ACCESS.employees}>
      <EmployeesInner />
    </RoleGate>
  );
}

const DEPT_COLORS = [
  "from-accent to-accent-2",
  "from-accent-3 to-accent",
  "from-accent-2 to-danger",
  "from-success to-accent-3",
  "from-warning to-accent-2",
];

function deptColor(code: string) {
  let h = 0;
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) % DEPT_COLORS.length;
  return DEPT_COLORS[h];
}

function EmployeesInner() {
  const { user } = useAuth();
  const toast = useToast();
  const canExport = hasHrAccess(user?.role ?? "");
  const [view, setView] = useState<"directory" | "orgchart">("directory");
  const [exporting, setExporting] = useState(false);
  const { data, loading, error, demo } = useData<EmployeeProfile[]>(
    () => coreHrApi<EmployeeProfile[]>("/api/hr/employees/?page_size=100"),
    mockEmployees
  );
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("ALL");

  async function exportCsv() {
    setExporting(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 400));
        toast("success", "Export ready (demo — no file in demo mode).");
      } else {
        const ok = await downloadFile(SERVICES.coreHr, "/api/hr/employees/export/", "employees.csv");
        toast(ok ? "success" : "error", ok ? "employees.csv downloaded." : "Export failed (HR/Admin only).");
      }
    } finally {
      setExporting(false);
    }
  }

  const employees = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department?.code).filter(Boolean))] as string[],
    [employees]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return employees.filter((e) => {
      if (dept !== "ALL" && e.department?.code !== dept) return false;
      if (!needle) return true;
      return [e.first_name, e.last_name, e.email, e.job_title]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [employees, q, dept]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DemoBanner show={demo} />
      {error && (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">
          {error} — your role may not permit listing employees.
        </p>
      )}

      <div className="rise flex flex-wrap items-center justify-between gap-3">
        <div className="glass flex rounded-full p-1">
          <button
            onClick={() => setView("directory")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              view === "directory" ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow" : "text-ink-muted hover:text-ink"
            }`}
          >
            <LayoutGrid size={13} /> Directory
          </button>
          <button
            onClick={() => setView("orgchart")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              view === "orgchart" ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Network size={13} /> Org chart
          </button>
        </div>
        {canExport && (
          <button
            onClick={exportCsv}
            disabled={exporting}
            className="glass glass-hover flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export CSV
          </button>
        )}
      </div>

      {view === "orgchart" ? (
        <OrgChartView />
      ) : (
        <>
      <div className="rise flex flex-wrap items-center gap-3">
        <div className="glass flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 min-w-56">
          <Search size={15} className="text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, job title…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted/60"
          />
        </div>
        <div className="flex gap-1.5">
          {["ALL", ...departments].map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                dept === d
                  ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow-md shadow-accent/25"
                  : "glass text-ink-muted hover:text-ink"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No employees match" hint="Try a different search or department filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e, i) => (
            <article
              key={e.id}
              className={`glass glass-hover rise rise-${Math.min(i % 4 + 1, 4)} p-5`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${deptColor(
                    e.department?.code ?? "?"
                  )}`}
                >
                  {(e.first_name?.[0] ?? "?") + (e.last_name?.[0] ?? "")}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">
                    {e.first_name} {e.last_name}
                  </h3>
                  <p className="truncate text-xs text-ink-muted">{e.job_title || "—"}</p>
                  <p className="mt-0.5 truncate text-[11px] text-ink-muted/80">{e.email}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px]">
                <span className="rounded-full border border-border px-2 py-0.5 font-semibold uppercase tracking-wider text-ink-muted">
                  {e.department?.code ?? "N/A"}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 uppercase tracking-wider text-ink-muted">
                  {e.employment_type?.replace("_", " ").toLowerCase()}
                </span>
                <span
                  className={`ml-auto flex items-center gap-1.5 font-semibold uppercase tracking-wider ${
                    e.is_active ? "text-success" : "text-ink-muted"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      e.is_active ? "bg-success shadow-[0_0_6px_var(--success)]" : "bg-ink-muted"
                    }`}
                  />
                  {e.is_active ? "active" : "inactive"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-right text-[11px] text-ink-muted">
        {filtered.length} of {employees.length} employees
      </p>
      {canExport && employees.length > 0 && <DocumentsSection employees={employees} />}
        </>
      )}
    </div>
  );
}

function DocumentsSection({ employees }: { employees: EmployeeProfile[] }) {
  const toast = useToast();
  const [employeeId, setEmployeeId] = useState(String(employees[0].id));
  const [reload, setReload] = useState(0);
  const [adding, setAdding] = useState(false);
  const documents = useData<EmployeeDocument[]>(
    () => coreHrApi<EmployeeDocument[]>(`/api/hr/employees/${employeeId}/documents/`),
    [],
    [employeeId, reload]
  );
  const list = Array.isArray(documents.data) ? documents.data : [];

  return (
    <section className="glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><FileText size={16} /> Documents</h2>
          <p className="mt-1 text-xs text-ink-muted">Employee document references and expiry dates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} aria-label="Document employee">
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</option>)}
          </Select>
          <PrimaryButton onClick={() => setAdding(true)}><Plus size={14} /> Add document</PrimaryButton>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {list.length === 0 ? <p className="text-xs text-ink-muted">No documents for this employee.</p> : list.map((document) => (
          <a key={document.id} href={document.reference_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-xs">
            <span className="font-semibold">{document.title}</span>
            <span className="text-ink-muted">{document.doc_type.replace("_", " ")}</span>
            {document.is_expiring_soon && <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 font-semibold text-warning">Expiring soon</span>}
          </a>
        ))}
      </div>
      {adding && <AddDocumentModal employeeId={employeeId} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); setReload((value) => value + 1); toast("success", "Document added."); }} />}
    </section>
  );
}

function AddDocumentModal({ employeeId, onClose, onSaved }: { employeeId: string; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [docType, setDocType] = useState("CONTRACT");
  const [title, setTitle] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!title || !referenceUrl || !issueDate) return toast("error", "Title, reference and issue date are required.");
    setBusy(true);
    try {
      await coreHrApi(`/api/hr/employees/${employeeId}/documents/`, { method: "POST", body: { doc_type: docType, title, reference_url: referenceUrl, issue_date: issueDate, expiry_date: expiryDate || null } });
      onSaved();
    } catch { toast("error", "Could not add document."); } finally { setBusy(false); }
  }
  return <Modal open onClose={onClose} title="Add employee document" footer={<><GhostButton onClick={onClose}>Cancel</GhostButton><PrimaryButton onClick={save} disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />} Add</PrimaryButton></>}>
    <div className="space-y-4">
      <Field label="Document type"><Select value={docType} onChange={(e) => setDocType(e.target.value)}>{["CONTRACT", "ID", "CERTIFICATION", "POLICY_ACK", "OTHER"].map((type) => <option key={type}>{type.replace("_", " ")}</option>)}</Select></Field>
      <Field label="Title"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Reference URL"><TextInput value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Issue date"><TextInput type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></Field><Field label="Expiry date" hint="Optional"><TextInput type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></Field></div>
    </div>
  </Modal>;
}

/* ------------------------------------------------------------------ */
/* Org chart — recursive reporting tree                                */
/* ------------------------------------------------------------------ */

function OrgChartView() {
  const { data, loading, demo, error } = useData<OrgChart>(
    () => coreHrApi<OrgChart>("/api/hr/org-chart/"),
    mockOrgChart
  );

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>;

  const roots = data?.roots ?? [];

  return (
    <div className="rise space-y-4">
      <DemoBanner show={demo} />
      <p className="text-sm text-ink-muted">
        Reporting structure · {data?.headcount ?? 0} people
      </p>
      <div className="glass overflow-x-auto p-6">
        <div className="flex flex-col gap-6">
          {roots.map((n) => (
            <OrgNodeView key={n.id} node={n} depth={0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrgNodeView({ node, depth }: { node: OrgNode; depth: number }) {
  const initials =
    node.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return (
    <div className="flex flex-col gap-3">
      <div className="glass glass-hover flex items-center gap-3 self-start p-3 pr-5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${deptColor(node.department ?? "?")}`}>
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold">{node.name}</p>
          <p className="text-[11px] text-ink-muted">
            {node.job_title || "—"}
            {node.department ? ` · ${node.department}` : ""}
            {node.reports.length > 0 && ` · ${node.reports.length} report${node.reports.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
      {node.reports.length > 0 && (
        <div className="ml-5 flex flex-col gap-3 border-l border-border/60 pl-4">
          {node.reports.map((r) => (
            <OrgNodeView key={r.id} node={r} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
