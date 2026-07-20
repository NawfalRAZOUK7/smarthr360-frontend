"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  Bot,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  HeartPulse,
  LineChart,
  Loader2,
  MessagesSquare,
  Radar as RadarIcon,
  SendHorizontal,
  ShieldCheck,
  Siren,
  Trophy,
  User as UserIcon,
  Wallet,
  X as XIcon,
} from "lucide-react";
import { ApiError, downloadFile, getAccessToken, retentionApi } from "@/lib/api";
import { SERVICES } from "@/lib/config";
import { mockActions, mockAttrition, mockConversations, mockOutcomes, mockRetentionRoi } from "@/lib/mock";
import type {
  AttritionForecast,
  AttritionResponse,
  OutcomeStats,
  RetentionAction,
  RetentionConversation,
  RetentionROI,
} from "@/lib/types";
import { useData } from "@/lib/use-data";
import { DemoBanner, EmptyState, KpiCard, Skeleton } from "@/components/ui";
import Modal, { Field, GhostButton, PrimaryButton, TextArea } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";

export default function RetentionPage() {
  return (
    <RoleGate rule={ACCESS.retention}>
      <RetentionInner />
    </RoleGate>
  );
}

const LEVELS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

const LEVEL_STYLE: Record<AttritionForecast["level"], string> = {
  CRITICAL: "bg-danger/12 text-danger border-danger/25",
  HIGH: "bg-warning/12 text-warning border-warning/25",
  MEDIUM: "bg-accent-3/12 text-accent-3 border-accent-3/25",
  LOW: "bg-success/12 text-success border-success/25",
};

const FACTOR_LABELS: Record<string, string> = {
  engagement: "Engagement",
  performance: "Performance",
  absence: "Absence",
  signal_pressure: "Signal pressure",
  trend: "Trend",
};

function FactorBars({ f }: { f: AttritionForecast }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-5">
      {Object.entries(f.factors).map(([k, v]) => (
        <div key={k}>
          <div className="flex items-center justify-between text-[10px] text-ink-muted">
            <span className={f.top_drivers.includes(k) ? "font-bold text-danger" : ""}>
              {FACTOR_LABELS[k] ?? k}
            </span>
            <span className="tabular-nums">{(v * 100).toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                f.top_drivers.includes(k)
                  ? "bg-gradient-to-r from-warning to-danger"
                  : "bg-accent/60"
              }`}
              style={{ width: `${Math.min(v * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type Tab = "predictions" | "conversations" | "actions" | "outcomes";

const TABS: { id: Tab; label: string; icon: typeof Bot }[] = [
  { id: "predictions", label: "Predictions", icon: LineChart },
  { id: "conversations", label: "Conversations", icon: MessagesSquare },
  { id: "actions", label: "Actions", icon: ClipboardList },
  { id: "outcomes", label: "Outcomes", icon: Trophy },
];

function RetentionInner() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("predictions");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    if (getAccessToken() === "demo") {
      toast("error", "Connect the backend to export the report.");
      return;
    }
    setExporting(true);
    try {
      const ok = await downloadFile(SERVICES.retention, "/api/retention/export/", "attrition_report.csv");
      toast(ok ? "success" : "error", ok ? "Attrition report downloaded." : "Could not export the report.");
    } finally {
      setExporting(false);
    }
  }

  const { data, loading, error, demo } = useData<AttritionResponse>(
    () => retentionApi<AttritionResponse>("/api/retention/attrition/"),
    mockAttrition
  );
  const roi = useData<RetentionROI>(
    () => retentionApi<RetentionROI>("/api/retention/roi/"),
    mockRetentionRoi
  );

  async function runDetection() {
    setDetecting(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 600));
        toast("success", "Detection ran: 2 at-risk, conversations opened (demo).");
      } else {
        const res = await retentionApi<{ at_risk_count?: number }>(
          "/api/retention/detect/",
          { method: "POST" }
        );
        toast("success", `Detection complete: ${res.at_risk_count ?? 0} at-risk, conversations opened.`);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not run detection.";
      toast("error", msg);
    } finally {
      setDetecting(false);
    }
  }

  const forecasts = useMemo(() => {
    const all = data?.forecasts ?? [];
    return level === "ALL" ? all : all.filter((f) => f.level === level);
  }, [data, level]);

  const s = data?.level_summary;

  return (
    <div className="space-y-6">
      <DemoBanner show={demo} />
      {error && (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">
          {error} — attrition prediction requires an HR or Admin role.
        </p>
      )}

      <div className="rise flex flex-wrap items-center justify-end gap-2">
        <GhostButton onClick={exportCsv} disabled={exporting}>
          {exporting ? <Loader2 size={14} className="inline animate-spin" /> : <Download size={14} className="inline" />}{" "}
          Export CSV
        </GhostButton>
        <PrimaryButton onClick={runDetection} disabled={detecting}>
          {detecting ? <Loader2 size={14} className="animate-spin" /> : <RadarIcon size={14} />}
          Run detection
        </PrimaryButton>
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
      </div>

      {tab === "conversations" && <ConversationsTab />}
      {tab === "actions" && <ActionsTab />}
      {tab === "outcomes" && <OutcomesTab />}

      {tab !== "predictions" ? null : loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Critical" value={s?.critical ?? 0} sub="act this week" icon={<Siren size={18} />} tone="danger" delay={1} />
            <KpiCard label="High risk" value={s?.high ?? 0} sub="open a conversation" icon={<AlertOctagon size={18} />} tone="warning" delay={2} />
            <KpiCard label="Medium" value={s?.medium ?? 0} sub="monitor" icon={<HeartPulse size={18} />} delay={3} />
            <KpiCard label="Low risk" value={s?.low ?? 0} sub="healthy" icon={<ShieldCheck size={18} />} tone="success" delay={4} />
          </div>

          <RoiPanel roi={roi.data ?? mockRetentionRoi} />

          <div className="rise flex items-center gap-2">
            {LEVELS.map((l) => (
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
              run {data?.run_id === "demo" ? "demo" : data?.run_id?.slice(0, 8)} ·{" "}
              {forecasts.length} employees
            </span>
          </div>

          {forecasts.length === 0 ? (
            <EmptyState title="No employees at this level" hint="Adjust the level filter." />
          ) : (
            <div className="space-y-3">
              {forecasts.map((f, i) => {
                const isOpen = open === f.employee_id;
                return (
                  <article
                    key={f.employee_id}
                    className={`glass rise rise-${Math.min((i % 4) + 1, 4)} cursor-pointer p-5 transition-colors hover:border-accent/40`}
                    onClick={() => setOpen(isOpen ? null : f.employee_id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                        <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
                          <circle cx="22" cy="22" r="19" fill="none" stroke="var(--border)" strokeWidth="4" />
                          <circle
                            cx="22" cy="22" r="19" fill="none"
                            stroke={f.risk_score >= 75 ? "var(--danger)" : f.risk_score >= 50 ? "var(--warning)" : "var(--success)"}
                            strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={`${(f.risk_score / 100) * 119.4} 119.4`}
                            className="transition-all duration-700"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-bold tabular-nums">
                          {f.risk_score.toFixed(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="truncate text-sm font-semibold">{f.name}</h3>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${LEVEL_STYLE[f.level]}`}>
                            {f.level}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {f.employee_id} · {f.rationale}
                        </p>
                      </div>
                      <ChevronDown
                        size={15}
                        className={`shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>

                    {isOpen && (
                      <div className="rise mt-5 border-t border-border/60 pt-4">
                        <FactorBars f={f} />
                        <p className="mt-3 text-[11px] text-ink-muted">
                          Signal trend {f.signal_trend_per_day >= 0 ? "+" : ""}
                          {f.signal_trend_per_day.toFixed(3)}/day
                          {f.top_drivers.length > 0 &&
                            ` · top drivers: ${f.top_drivers.map((d) => FACTOR_LABELS[d] ?? d).join(", ")}`}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Conversations — proactive chatbot transcripts                       */
/* ------------------------------------------------------------------ */

type ChatMsg = { from?: string; role?: string; text?: string; content?: string };

function ConversationsTab() {
  const [open, setOpen] = useState<number | null>(null);
  const { data, loading, demo, error } = useData<RetentionConversation[]>(
    () => retentionApi<RetentionConversation[]>("/api/retention/conversations/"),
    mockConversations
  );
  const list = Array.isArray(data) ? data : [];

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>;
  if (list.length === 0)
    return <EmptyState title="No conversations yet" hint="Run risk detection to open proactive conversations." />;

  return (
    <div className="rise space-y-3">{demo && null}
      {list.map((c) => (
        <ConversationCard
          key={c.id}
          conversation={c}
          isOpen={open === c.id}
          onToggle={() => setOpen(open === c.id ? null : c.id)}
        />
      ))}
    </div>
  );
}

function ConversationCard({
  conversation,
  isOpen,
  onToggle,
}: {
  conversation: RetentionConversation;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>(conversation.messages);
  const [completed, setCompleted] = useState(conversation.completed);
  const [need, setNeed] = useState(conversation.identified_need);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    // optimistic append of the employee message
    setMessages((m) => [...m, { role: "employee", content: text }]);
    setReply("");
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 500));
        const botReply = "Merci du partage — je transmets une action à l'équipe RH.";
        setMessages((m) => [...m, { role: "assistant", content: botReply }]);
        setCompleted(true);
        setNeed("workload");
        toast("success", "Conversation completed — action generated (demo).");
      } else {
        const res = await retentionApi<{
          bot_reply: string;
          completed: boolean;
          identified_need: string | null;
          action: unknown;
          messages: ChatMsg[];
        }>(`/api/retention/conversations/${conversation.id}/respond/`, {
          method: "POST",
          body: { message: text },
        });
        setMessages(res.messages);
        setCompleted(res.completed);
        setNeed(res.identified_need);
        if (res.completed && res.action) {
          toast("success", `Need identified (${res.identified_need}) — pending action created.`);
        }
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not send.";
      toast("error", msg);
      // roll back optimistic message
      setMessages(conversation.messages);
    } finally {
      setSending(false);
    }
  }

  return (
    <article className="glass p-5 transition-colors hover:border-accent/40">
      <div className="flex cursor-pointer flex-wrap items-center gap-3" onClick={onToggle}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/10">
          <Bot size={15} className="text-accent" />
        </div>
        <div className="min-w-40 flex-1">
          <h3 className="text-sm font-semibold">Conversation #{conversation.id}</h3>
          <p className="text-[11px] text-ink-muted">
            Started {new Date(conversation.started_at).toLocaleDateString()} ·{" "}
            {messages.length} messages
            {need && ` · need: ${need.replace("_", " ")}`}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
            completed
              ? "border-success/25 bg-success/10 text-success"
              : "border-warning/25 bg-warning/10 text-warning"
          }`}
        >
          {completed ? "completed" : "ongoing"}
        </span>
        <ChevronDown size={15} className={`text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="rise mt-4 space-y-2.5 border-t border-border/60 pt-4">
          {messages.map((m, i) => {
            const fromBot = (m.from ?? m.role) !== "employee";
            return (
              <div key={i} className={`flex gap-2.5 ${fromBot ? "" : "flex-row-reverse"}`}>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    fromBot ? "bg-gradient-to-br from-accent to-accent-2 text-white" : "border border-border text-ink-muted"
                  }`}
                >
                  {fromBot ? <Bot size={13} /> : <UserIcon size={13} />}
                </div>
                <p
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    fromBot ? "rounded-tl-sm bg-accent/10" : "rounded-tr-sm border border-border/70"
                  }`}
                >
                  {m.text ?? m.content ?? ""}
                </p>
              </div>
            );
          })}

          {completed ? (
            <p className="pt-1 text-center text-[11px] text-ink-muted">
              Conversation completed — a pending action was generated on the Actions tab.
            </p>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !sending && send()}
                placeholder="Reply as the employee…"
                className="flex-1 rounded-lg border border-border bg-canvas px-3.5 py-2 text-sm outline-none placeholder:text-ink-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                onClick={send}
                disabled={sending || !reply.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent-2 text-white transition-all hover:brightness-110 disabled:opacity-50"
                aria-label="Send"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Actions — HR follow-ups born from conversations                     */
/* ------------------------------------------------------------------ */

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: "border-danger/25 bg-danger/10 text-danger",
  MEDIUM: "border-warning/25 bg-warning/10 text-warning",
  LOW: "border-success/25 bg-success/10 text-success",
};

function ActionsTab() {
  const toast = useToast();
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [outcomeFor, setOutcomeFor] = useState<RetentionAction | null>(null);
  const { data, loading, error } = useData<RetentionAction[]>(
    () => retentionApi<RetentionAction[]>("/api/retention/actions/"),
    mockActions,
    [reloadKey]
  );
  const list = Array.isArray(data) ? data : [];
  const reload = () => setReloadKey((k) => k + 1);
  const isDemo = getAccessToken() === "demo";

  async function review(a: RetentionAction, decision: "approved" | "rejected" | "completed") {
    setBusyId(a.id);
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 300));
      } else {
        await retentionApi(`/api/retention/actions/${a.id}/review/`, {
          method: "POST",
          body: { status: decision },
        });
      }
      toast("success", `Action ${decision}.`);
      reload();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not update action.";
      toast("error", msg);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>;
  if (list.length === 0)
    return <EmptyState title="No actions yet" hint="Run detection on the Predictions tab to open conversations that create actions." />;

  const columns: [string, RetentionAction[]][] = [
    ["pending", list.filter((a) => a.status === "pending")],
    ["approved", list.filter((a) => a.status === "approved")],
    ["completed", list.filter((a) => a.status === "completed" || a.status === "rejected")],
  ];

  return (
    <div className="rise space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map(([status, actions]) => (
          <div key={status}>
            <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {status} · {actions.length}
            </p>
            <div className="space-y-3">
              {actions.map((a) => (
                <article key={a.id} className="glass glass-hover p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold">{a.employee_name}</p>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        PRIORITY_STYLE[a.priority] ?? PRIORITY_STYLE.LOW
                      }`}
                    >
                      {a.priority}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{a.description}</p>

                  {a.employee_retained !== null ? (
                    <p
                      className={`mt-2 text-[11px] font-semibold ${
                        a.employee_retained ? "text-success" : "text-danger"
                      }`}
                    >
                      {a.employee_retained ? "✓ Employee retained" : "✗ Employee left"}
                      {a.outcome_note && (
                        <span className="font-normal text-ink-muted"> — {a.outcome_note}</span>
                      )}
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {a.status === "pending" && (
                        <>
                          <ActionBtn onClick={() => review(a, "approved")} busy={busyId === a.id} tone="accent">
                            <Check size={12} /> Approve
                          </ActionBtn>
                          <ActionBtn onClick={() => review(a, "rejected")} busy={busyId === a.id} tone="danger">
                            <XIcon size={12} /> Reject
                          </ActionBtn>
                        </>
                      )}
                      {a.status === "approved" && (
                        <>
                          <ActionBtn onClick={() => review(a, "completed")} busy={busyId === a.id} tone="accent">
                            <Check size={12} /> Complete
                          </ActionBtn>
                          <ActionBtn onClick={() => setOutcomeFor(a)} busy={false} tone="success">
                            <Trophy size={12} /> Record outcome
                          </ActionBtn>
                        </>
                      )}
                      {a.status === "completed" && (
                        <ActionBtn onClick={() => setOutcomeFor(a)} busy={false} tone="success">
                          <Trophy size={12} /> Record outcome
                        </ActionBtn>
                      )}
                    </div>
                  )}
                </article>
              ))}
              {actions.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-[11px] text-ink-muted">
                  empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <OutcomeModal
        action={outcomeFor}
        onClose={() => setOutcomeFor(null)}
        onSaved={reload}
      />
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  busy,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  tone: "accent" | "danger" | "success";
}) {
  const tones = {
    accent: "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20",
    danger: "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
    success: "border-success/30 bg-success/10 text-success hover:bg-success/20",
  } as const;
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${tones[tone]}`}
    >
      {busy ? <Loader2 size={11} className="animate-spin" /> : children}
    </button>
  );
}

/* Outcome modal: record whether the action retained the employee. */
function OutcomeModal({
  action,
  onClose,
  onSaved,
}: {
  action: RetentionAction | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(retained: boolean) {
    if (!action) return;
    setBusy(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 350));
      } else {
        await retentionApi(`/api/retention/actions/${action.id}/outcome/`, {
          method: "POST",
          body: { retained, note: note.trim() },
        });
      }
      toast("success", retained ? "Recorded: employee retained." : "Recorded: employee left.");
      setNote("");
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not record outcome.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={action !== null}
      onClose={onClose}
      title={action ? `Outcome — ${action.employee_name}` : ""}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <button
            onClick={() => save(false)}
            disabled={busy}
            className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
          >
            Employee left
          </button>
          <PrimaryButton onClick={() => save(true)} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Retained ✓
          </PrimaryButton>
        </>
      }
    >
      <Field label="Note (optional)">
        <TextArea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="What happened? Any context for the outcome."
        />
      </Field>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Outcomes — does it actually work?                                   */
/* ------------------------------------------------------------------ */

function OutcomesTab() {
  const { data, loading, demo, error } = useData<OutcomeStats>(
    () => retentionApi<OutcomeStats>("/api/retention/outcomes/"),
    mockOutcomes
  );

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">{error}</p>;
  if (!data) return null;

  return (
    <div className="rise space-y-5">{demo && null}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total actions" value={data.actions_total} icon={<ClipboardList size={18} />} delay={1} />
        <KpiCard label="Outcomes recorded" value={data.outcomes_recorded} icon={<LineChart size={18} />} delay={2} />
        <KpiCard label="Employees retained" value={data.employees_retained} icon={<HeartPulse size={18} />} tone="success" delay={3} />
        <KpiCard
          label="Success rate"
          value={data.success_rate_percent !== null ? `${data.success_rate_percent}%` : "—"}
          icon={<Trophy size={18} />}
          tone={data.success_rate_percent !== null && data.success_rate_percent >= 50 ? "success" : "warning"}
          delay={4}
        />
      </div>

      <section className="glass p-5">
        <h2 className="text-sm font-semibold">Success rate by identified need</h2>
        <div className="mt-4 space-y-3">
          {Object.entries(data.by_need).map(([need, b]) => (
            <div key={need} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 text-xs capitalize text-ink-muted">
                {need.replace(/_/g, " ")}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    b.success_rate >= 50
                      ? "bg-gradient-to-r from-accent-3 to-success"
                      : "bg-gradient-to-r from-warning to-danger"
                  }`}
                  style={{ width: `${b.success_rate}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs tabular-nums text-ink-muted">
                {b.retained}/{b.recorded} · {b.success_rate}%
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cost of attrition & retention ROI (loop-closer)                     */
/* ------------------------------------------------------------------ */

function eur(n: number): string {
  return "€" + Math.round(n).toLocaleString("en-US");
}

function RoiPanel({ roi }: { roi: RetentionROI }) {
  const f = roi.forward;
  const r = roi.realized;
  return (
    <section className="rise glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Wallet size={15} className="text-accent" /> Cost of attrition &amp; retention ROI
        </h3>
        <span className="text-[11px] text-ink-muted">
          assumes {eur(roi.assumptions.avg_replacement_cost)} avg replacement cost
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">Risk exposure</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-danger">{eur(f.total_exposure)}</p>
          <p className="text-[11px] text-ink-muted">expected loss, all employees</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">At-risk exposure</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-warning">{eur(f.at_risk_exposure)}</p>
          <p className="text-[11px] text-ink-muted">{f.at_risk_count} high/critical</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">Potential savings</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-accent">{eur(f.potential_savings)}</p>
          <p className="text-[11px] text-ink-muted">if you act now</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">Realized savings</p>
          <p className="mt-1 text-2xl font-bold tabular-nums gradient-text">{eur(r.realized_savings)}</p>
          <p className="text-[11px] text-ink-muted">
            {r.retained}/{r.actions_with_outcome} retained
            {r.retention_rate != null ? ` · ${Math.round(r.retention_rate * 100)}%` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
