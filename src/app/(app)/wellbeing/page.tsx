"use client";

import { useState } from "react";
import {
  BarChart3,
  CircleCheck,
  CircleOff,
  HeartPulse,
  Loader2,
  MessageSquareText,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { ApiError, coreHrApi, getAccessToken } from "@/lib/api";
import { mockSurveys, mockSurveyStats } from "@/lib/mock";
import type { SurveyQuestion, SurveyStats, WellbeingSurvey } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { hasHrAccess } from "@/lib/rbac";
import { DemoBanner, EmptyState, Skeleton } from "@/components/ui";
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

export default function WellbeingPage() {
  return (
    <RoleGate rule={ACCESS.wellbeing}>
      <WellbeingInner />
    </RoleGate>
  );
}

function StatsPanel({ surveyId, demo }: { surveyId: number; demo: boolean }) {
  const stats = useData<SurveyStats>(
    () => coreHrApi<SurveyStats>(`/api/wellbeing/surveys/${surveyId}/stats/`),
    mockSurveyStats,
    [surveyId]
  );
  const s = stats.data;

  if (stats.loading) return <Skeleton className="h-48" />;
  if (stats.error)
    return (
      <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">
        {stats.error}
      </p>
    );
  if (s?.suppressed)
    return (
      <div className="glass p-6 text-center">
        <p className="text-sm font-medium">Statistics suppressed</p>
        <p className="mt-1 text-xs text-ink-muted">{s.detail}</p>
      </div>
    );

  return (
    <div className="rise space-y-4">
      <p className="text-xs text-ink-muted">
        {s?.count_responses} responses · anonymised aggregates
      </p>
      {(s?.questions ?? []).map((q) => (
        <div key={q.id} className="glass p-5">
          <p className="text-sm font-medium">{q.text}</p>

          {q.type === "SCALE_1_5" && q.distribution && (
            <div className="mt-4">
              <div className="flex items-end gap-2">
                {Object.entries(q.distribution).map(([k, v]) => {
                  const max = Math.max(...Object.values(q.distribution!), 1);
                  return (
                    <div key={k} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-24 w-full items-end">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-accent to-accent-2 transition-all duration-700"
                          style={{ height: `${(v / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-ink-muted">{k}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Average: <span className="font-bold text-ink">{q.avg?.toFixed(1) ?? "—"}</span> / 5
              </p>
            </div>
          )}

          {q.type === "YES_NO" && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-success">
                <CircleCheck size={15} /> {q.yes} yes
              </span>
              <span className="flex items-center gap-1.5 text-danger">
                <CircleOff size={15} /> {q.no} no
              </span>
              <div className="ml-2 h-2 flex-1 overflow-hidden rounded-full bg-danger/40">
                <div
                  className="h-full rounded-full bg-success transition-all duration-700"
                  style={{
                    width: `${((q.yes ?? 0) / Math.max((q.yes ?? 0) + (q.no ?? 0), 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {q.type === "TEXT" && (
            <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
              <MessageSquareText size={13} /> {q.count_text} free-text answers
              (visible in the service admin only)
            </p>
          )}
        </div>
      ))}
      {demo && null}
    </div>
  );
}

function WellbeingInner() {
  const { user } = useAuth();
  const canSeeStats = hasHrAccess(user?.role ?? "");
  const [selected, setSelected] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [answer, setAnswer] = useState<WellbeingSurvey | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const surveys = useData<WellbeingSurvey[]>(
    () => coreHrApi<WellbeingSurvey[]>("/api/wellbeing/surveys/"),
    mockSurveys,
    [reloadKey]
  );
  const list = Array.isArray(surveys.data) ? surveys.data : [];
  const reload = () => setReloadKey((k) => k + 1);

  return (
    <div className="space-y-6">
      <DemoBanner show={surveys.demo} />

      <div className="rise flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-muted">
          Anonymous wellbeing surveys.{" "}
          {canSeeStats
            ? "Create surveys, and select one to see aggregated results (suppressed under 5 responses for anonymity)."
            : "Answer the active surveys — your responses are aggregated anonymously and never shown individually."}
        </p>
        {canSeeStats && (
          <PrimaryButton onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> New survey
          </PrimaryButton>
        )}
      </div>

      {surveys.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="No surveys yet" hint="HR can create surveys via the API or admin." />
      ) : (
        <div className="rise rise-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <div
              key={s.id}
              className={`glass glass-hover p-5 ${
                selected === s.id ? "ring-2 ring-accent/60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/10">
                  <HeartPulse size={15} className="text-accent" />
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    s.is_active
                      ? "border-success/25 bg-success/10 text-success"
                      : "border-border text-ink-muted"
                  }`}
                >
                  {s.is_active ? "active" : "closed"}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{s.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{s.description}</p>
              <p className="mt-2 text-[11px] text-ink-muted">
                {s.questions.length} question{s.questions.length === 1 ? "" : "s"}
              </p>
              <div className="mt-4 flex gap-2">
                {s.is_active && s.questions.length > 0 && (
                  <button
                    onClick={() => setAnswer(s)}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-accent-2 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110"
                  >
                    <Send size={12} /> Answer
                  </button>
                )}
                {canSeeStats && (
                  <button
                    onClick={() => setSelected(selected === s.id ? null : s.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
                  >
                    <BarChart3 size={12} /> {selected === s.id ? "Hide" : "Results"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected !== null && canSeeStats && (
        <section className="rise space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 size={15} className="text-accent" />
            Results — {list.find((s) => s.id === selected)?.title}
          </h2>
          <StatsPanel surveyId={selected} demo={surveys.demo} />
        </section>
      )}

      <CreateSurveyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={reload}
      />
      <AnswerSurveyModal
        survey={answer}
        onClose={() => setAnswer(null)}
        onSubmitted={reload}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create survey (HR/Admin) — survey + its questions                   */
/* ------------------------------------------------------------------ */

type DraftQuestion = { text: string; type: SurveyQuestion["type"] };

function CreateSurveyModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { text: "", type: "SCALE_1_5" },
  ]);
  const [busy, setBusy] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setQuestions([{ text: "", type: "SCALE_1_5" }]);
  }

  async function submit() {
    if (!title.trim() || questions.every((q) => !q.text.trim())) {
      toast("error", "Add a title and at least one question.");
      return;
    }
    setBusy(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 500));
        toast("success", "Survey created (demo).");
      } else {
        const survey = await coreHrApi<{ id: number }>("/api/wellbeing/surveys/", {
          method: "POST",
          body: { title: title.trim(), description: description.trim() },
        });
        let order = 1;
        for (const q of questions.filter((x) => x.text.trim())) {
          await coreHrApi(`/api/wellbeing/surveys/${survey.id}/questions/`, {
            method: "POST",
            body: { text: q.text.trim(), type: q.type, order: order++ },
          });
        }
        toast("success", "Survey created.");
      }
      reset();
      onCreated();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ?? `Failed (${err.status}).`)
          : "Could not create survey.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New wellbeing survey"
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>
            Cancel
          </GhostButton>
          <PrimaryButton onClick={submit} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Create survey
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pulse Q4 2026"
            autoFocus
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short context shown to respondents"
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Questions
            </span>
            <button
              onClick={() => setQuestions((q) => [...q, { text: "", type: "SCALE_1_5" }])}
              className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <TextInput
                    value={q.text}
                    onChange={(e) =>
                      setQuestions((qs) =>
                        qs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x))
                      )
                    }
                    placeholder={`Question ${i + 1}`}
                  />
                </div>
                <div className="w-28 shrink-0">
                  <Select
                    value={q.type}
                    onChange={(e) =>
                      setQuestions((qs) =>
                        qs.map((x, j) =>
                          j === i
                            ? { ...x, type: e.target.value as SurveyQuestion["type"] }
                            : x
                        )
                      )
                    }
                  >
                    <option value="SCALE_1_5">Scale 1–5</option>
                    <option value="YES_NO">Yes / No</option>
                    <option value="TEXT">Text</option>
                  </Select>
                </div>
                {questions.length > 1 && (
                  <button
                    onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                    aria-label="Remove question"
                    className="shrink-0 text-ink-muted hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Answer survey (any role) — anonymous submission                     */
/* ------------------------------------------------------------------ */

function AnswerSurveyModal({
  survey,
  onClose,
  onSubmitted,
}: {
  survey: WellbeingSurvey | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const toast = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!survey) return;
    const missing = survey.questions.some((q) => !answers[String(q.id)]);
    if (missing) {
      toast("error", "Please answer every question.");
      return;
    }
    setBusy(true);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 400));
        toast("success", "Response submitted (demo).");
      } else {
        await coreHrApi(`/api/wellbeing/surveys/${survey.id}/submit/`, {
          method: "POST",
          body: { answers },
        });
        toast("success", "Thanks — your anonymous response was recorded.");
      }
      setAnswers({});
      onSubmitted();
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.body as { detail?: string })?.detail ??
            (err.status === 409 ? "You already answered this survey." : `Failed (${err.status}).`))
          : "Could not submit.";
      toast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={survey !== null}
      onClose={onClose}
      title={survey ? survey.title : ""}
      footer={
        <>
          <GhostButton onClick={onClose} disabled={busy}>
            Cancel
          </GhostButton>
          <PrimaryButton onClick={submit} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Submit anonymously
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-5">
        {survey?.questions.map((q) => (
          <div key={q.id}>
            <p className="mb-2 text-sm font-medium">{q.text}</p>
            {q.type === "SCALE_1_5" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [String(q.id)]: String(n) }))
                    }
                    className={`flex h-10 flex-1 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                      answers[String(q.id)] === String(n)
                        ? "border-accent bg-gradient-to-br from-accent to-accent-2 text-white"
                        : "border-border text-ink-muted hover:border-accent/50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q.type === "YES_NO" && (
              <div className="flex gap-2">
                {["yes", "no"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAnswers((a) => ({ ...a, [String(q.id)]: v }))}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold capitalize transition-all ${
                      answers[String(q.id)] === v
                        ? "border-accent bg-gradient-to-br from-accent to-accent-2 text-white"
                        : "border-border text-ink-muted hover:border-accent/50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
            {q.type === "TEXT" && (
              <TextArea
                value={answers[String(q.id)] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [String(q.id)]: e.target.value }))
                }
                rows={2}
                placeholder="Your answer"
              />
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
