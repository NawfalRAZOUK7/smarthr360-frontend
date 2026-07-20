"use client";

import { useMemo, useState } from "react";
import { CircleCheck, History, Loader2, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { ApiError, authApi, getAccessToken } from "@/lib/api";
import { mockAuditLog, mockUsers } from "@/lib/mock";
import type { AuditLog, User } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { DemoBanner, EmptyState, Skeleton } from "@/components/ui";
import RoleGate from "@/components/RoleGate";
import { ACCESS } from "@/lib/rbac";

export default function AdminPage() {
  return (
    <RoleGate rule={ACCESS.admin}>
      <AdminInner />
    </RoleGate>
  );
}

const ROLES = ["EMPLOYEE", "MANAGER", "HR", "ADMIN"] as const;

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "border-danger/25 bg-danger/10 text-danger",
  HR: "border-accent-2/25 bg-accent-2/10 text-accent-2",
  MANAGER: "border-accent-3/25 bg-accent-3/10 text-accent-3",
  EMPLOYEE: "border-border text-ink-muted",
};

function AdminInner() {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localRoles, setLocalRoles] = useState<Record<number, string>>({});

  const users = useData<User[]>(
    () => authApi<User[]>("/api/auth/users/"),
    mockUsers as User[],
    [refreshKey]
  );
  const list = useMemo(() => {
    const all = Array.isArray(users.data) ? users.data : [];
    const needle = q.trim().toLowerCase();
    return all.filter(
      (u) =>
        !needle ||
        [u.email, u.username, u.first_name, u.last_name].join(" ").toLowerCase().includes(needle)
    );
  }, [users.data, q]);

  async function changeRole(target: User, role: string) {
    if (role === (localRoles[target.id] ?? target.role)) return;
    setBusyId(target.id);
    setError(null);
    try {
      if (getAccessToken() === "demo") {
        await new Promise((r) => setTimeout(r, 350));
        setLocalRoles((m) => ({ ...m, [target.id]: role }));
        return;
      }
      await authApi(`/api/auth/users/${target.id}/role/`, {
        method: "PATCH",
        body: { role },
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string } | null;
        setError(body?.detail ?? `Role change failed (${err.status}).`);
      } else {
        setError("Role change failed.");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <DemoBanner show={users.demo} />

      <div className="rise flex flex-wrap items-center gap-3">
        <div className="glass flex flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 min-w-56">
          <Search size={15} className="text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users by name, email, username…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted/60"
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <ShieldCheck size={13} className="text-accent" />
          Role changes are audited server-side
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-xs text-danger">
          {error}
        </p>
      )}

      {users.loading ? (
        <Skeleton className="h-72" />
      ) : list.length === 0 ? (
        <EmptyState title="No users match" hint="Try a different search." />
      ) : (
        <section className="glass rise rise-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-5 py-3.5 font-semibold">User</th>
                <th className="px-3 py-3.5 font-semibold">Username</th>
                <th className="hidden px-3 py-3.5 font-semibold sm:table-cell">Verified</th>
                <th className="px-3 py-3.5 font-semibold">Role</th>
                <th className="px-3 py-3.5 font-semibold">Change role</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => {
                const effectiveRole = localRoles[u.id] ?? u.role;
                const isMe = me?.id === u.id;
                return (
                  <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-accent/5">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[10px] font-bold text-white">
                          {(u.first_name?.[0] ?? u.username?.[0] ?? "?").toUpperCase()}
                          {(u.last_name?.[0] ?? "").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {`${u.first_name} ${u.last_name}`.trim() || u.username}
                            {isMe && <span className="ml-1.5 text-[10px] text-accent">(you)</span>}
                          </p>
                          <p className="truncate text-[11px] text-ink-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-muted">{u.username}</td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      {u.email_verified_at ? (
                        <CircleCheck size={15} className="text-success" />
                      ) : (
                        <span className="text-[11px] text-ink-muted">pending</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          ROLE_STYLE[effectiveRole] ?? ROLE_STYLE.EMPLOYEE
                        }`}
                      >
                        {effectiveRole}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={effectiveRole}
                          disabled={isMe || busyId === u.id}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="rounded-lg border border-border bg-canvas px-2 py-1 text-xs outline-none focus:border-accent disabled:opacity-40"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        {busyId === u.id && (
                          <Loader2 size={13} className="animate-spin text-accent" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <p className="text-right text-[11px] text-ink-muted">{list.length} users</p>

      <div className="pt-2">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={15} className="text-accent" /> Audit trail
        </h2>
        <AuditLogPanel />
      </div>
    </div>
  );
}

function AuditLogPanel() {
  const audit = useData<AuditLog>(
    () => authApi<AuditLog>("/api/auth/audit/"),
    mockAuditLog as AuditLog,
    []
  );
  const roleChanges = audit.data?.role_changes ?? [];
  const loginEvents = audit.data?.login_events ?? [];

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="glass">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <History size={15} className="text-accent" />
          <h3 className="text-sm font-semibold">Role change history</h3>
        </div>
        {audit.loading ? (
          <div className="p-5"><Skeleton className="h-32" /></div>
        ) : roleChanges.length === 0 ? (
          <div className="p-5"><EmptyState title="No role changes yet" hint="Assign a role to see it recorded here." /></div>
        ) : (
          <ul className="divide-y divide-border/60">
            {roleChanges.slice(0, 8).map((r) => (
              <li key={r.id} className="px-5 py-3 text-sm">
                <p className="truncate">
                  <span className="font-medium">{r.target_email ?? `user ${r.target_user_id}`}</span>{" "}
                  <span className="text-ink-muted">{r.old_role} → </span>
                  <span className="font-semibold text-accent">{r.new_role}</span>
                </p>
                <p className="text-[11px] text-ink-muted">
                  by {r.actor_email} · {new Date(r.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <TriangleAlert size={15} className="text-warning" />
          <h3 className="text-sm font-semibold">Login security events</h3>
        </div>
        {audit.loading ? (
          <div className="p-5"><Skeleton className="h-32" /></div>
        ) : loginEvents.length === 0 ? (
          <div className="p-5"><EmptyState title="No failed logins" hint="Failed sign-ins and lockouts appear here." /></div>
        ) : (
          <ul className="divide-y divide-border/60">
            {loginEvents.slice(0, 8).map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.username || "—"}</p>
                  <p className="text-[11px] text-ink-muted">
                    {e.ip_address ?? "—"} · {e.at ? new Date(e.at).toLocaleString() : "—"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
                  {e.failures} fail{e.failures === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
