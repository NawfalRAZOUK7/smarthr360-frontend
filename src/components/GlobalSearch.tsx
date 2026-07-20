"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, BrainCircuit, Loader2, Search, Users, X } from "lucide-react";
import { coreHrApi, getAccessToken } from "@/lib/api";
import { mockSearch } from "@/lib/mock";
import type { SearchResponse, SearchResult } from "@/lib/types";

const ICON: Record<string, typeof Users> = {
  employee: Users,
  skill: BrainCircuit,
  department: Building2,
};

/**
 * Command-palette style global search (⌘K). Role-scoped results come from
 * core-hr's /api/hr/search endpoint; demo mode uses a small local dataset.
 */
export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const needle = q.trim();
    if (needle.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        if (getAccessToken() === "demo") {
          if (!cancelled) setResults(mockSearch(needle));
        } else {
          const res = await coreHrApi<SearchResponse>(`/api/hr/search/?q=${encodeURIComponent(needle)}`);
          if (!cancelled) setResults(res.results ?? []);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="glass w-full max-w-xl overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search size={16} className="text-ink-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, skills, departments…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted/60"
          />
          {loading && <Loader2 size={14} className="animate-spin text-accent" />}
          <button onClick={onClose} aria-label="Close search" className="text-ink-muted hover:text-ink">
            <X size={15} />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {q.trim().length < 2 ? (
            <p className="px-4 py-6 text-center text-xs text-ink-muted">Type at least 2 characters to search.</p>
          ) : results.length === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-xs text-ink-muted">No matches for &ldquo;{q}&rdquo;.</p>
          ) : (
            <ul className="py-1">
              {results.map((r) => {
                const Icon = ICON[r.type] ?? Search;
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      onClick={() => go(r.href)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/5"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{r.label}</span>
                        <span className="block truncate text-[11px] text-ink-muted">{r.sublabel}</span>
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-muted">{r.type}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
