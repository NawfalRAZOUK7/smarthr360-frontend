"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Eye, Inbox, LogOut, Menu, Search, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { coreHrApi, getAccessToken } from "@/lib/api";
import { isReadOnlyRole } from "@/lib/rbac";
import ThemeToggle from "./ThemeToggle";

type Notification = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  created_at: string;
};

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: -1,
    user_id: 0,
    type: "training",
    title: "Training plan assigned",
    body: "Your manager assigned the Future-ready leadership learning path.",
    link: "/actions",
    read: false,
    created_at: new Date(Date.now() - 18 * 60_000).toISOString(),
  },
  {
    id: -2,
    user_id: 0,
    type: "review",
    title: "Quarterly review ready",
    body: "Your review is ready for acknowledgment in the Action Center.",
    link: "/actions",
    read: false,
    created_at: new Date(Date.now() - 3 * 3_600_000).toISOString(),
  },
];

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Topbar({
  title,
  onMenu,
  onSearch,
}: {
  title: string;
  onMenu: () => void;
  onSearch?: () => void;
}) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const isDemo = typeof window !== "undefined" && getAccessToken() === "demo";

  const loadCount = useCallback(async () => {
    if (isDemo) {
      setUnreadCount((current) => current || DEMO_NOTIFICATIONS.length);
      return;
    }
    try {
      const result = await coreHrApi<{ unread_count: number }>("/api/hr/notifications/unread-count/");
      setUnreadCount(result.unread_count);
    } catch {
      // Notifications are supplementary; never disrupt the primary navigation.
    }
  }, [isDemo]);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const close = (event: MouseEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [notificationsOpen]);

  const openNotifications = async () => {
    setNotificationsOpen((open) => !open);
    if (notificationsOpen || notifications.length) return;
    setLoadingNotifications(true);
    try {
      const items = isDemo
        ? DEMO_NOTIFICATIONS
        : await coreHrApi<Notification[] | { results: Notification[] }>("/api/hr/notifications/");
      setNotifications(Array.isArray(items) ? items : items.results ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markRead = async (notification: Notification) => {
    if (notification.read) return;
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
    if (!isDemo) {
      try { await coreHrApi(`/api/hr/notifications/${notification.id}/read/`, { method: "POST" }); } catch { /* best effort */ }
    }
  };

  const markAllRead = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    if (!isDemo) {
      try { await coreHrApi("/api/hr/notifications/read-all/", { method: "POST" }); } catch { /* best effort */ }
    }
  };
  const initials = user
    ? `${user.first_name?.[0] ?? user.username[0] ?? "?"}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-canvas/70 px-6 py-3.5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open navigation"
          className="glass glass-hover flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:text-ink md:hidden"
        >
          <Menu size={16} />
        </button>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {user && isReadOnlyRole(user.role) && (
          <span className="hidden items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-[11px] font-semibold text-warning sm:inline-flex">
            <Eye size={12} /> Read-only
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onSearch && (
          <button
            onClick={onSearch}
            aria-label="Search"
            className="glass glass-hover hidden items-center gap-2 rounded-full py-1.5 pl-3 pr-2 text-xs text-ink-muted hover:text-ink sm:flex"
          >
            <Search size={14} /> Search
            <kbd className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
          </button>
        )}
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-controls="notification-center"
            onClick={() => void openNotifications()}
            className="glass glass-hover relative flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full border-2 border-canvas bg-accent px-1 text-center text-[9px] font-bold leading-4 text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <section
              id="notification-center"
              aria-labelledby="notification-center-title"
              className="glass absolute right-0 top-12 z-50 w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-canvas shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 id="notification-center-title" className="text-sm font-semibold text-ink">Notification center</h2>
                  <p className="mt-0.5 text-[11px] text-ink-muted">{unreadCount ? `${unreadCount} need your attention` : "You're all caught up"}</p>
                </div>
                <button type="button" onClick={() => void markAllRead()} disabled={unreadCount === 0} className="flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:text-ink-muted disabled:no-underline">
                  <CheckCheck size={14} /> Mark all read
                </button>
              </div>
              <div className="max-h-[min(26rem,60vh)] overflow-y-auto overscroll-contain">
                {loadingNotifications ? (
                  <div className="space-y-3 p-4" aria-label="Loading notifications">
                    {[0, 1].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-ink/5" />)}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-9 text-center"><Inbox size={24} className="mb-2 text-ink-muted" /><p className="text-sm font-medium">No notifications yet</p><p className="mt-1 text-xs text-ink-muted">New assignments and updates will appear here.</p></div>
                ) : notifications.map((notification) => (
                  <article key={notification.id} className={`group relative border-b border-border px-4 py-3 last:border-0 ${notification.read ? "" : "bg-accent/[0.06]"}`}>
                    {!notification.read && <span className="absolute left-1.5 top-5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />}
                    <div className="flex gap-3">
                      <Link href={notification.link || "/actions"} onClick={() => { void markRead(notification); setNotificationsOpen(false); }} className="min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        <div className="flex items-start justify-between gap-3"><h3 className={`truncate text-xs ${notification.read ? "font-medium" : "font-semibold"}`}>{notification.title}</h3><time className="shrink-0 text-[10px] text-ink-muted">{relativeTime(notification.created_at)}</time></div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">{notification.body}</p>
                      </Link>
                      {!notification.read && <button type="button" aria-label={`Mark ${notification.title} read`} title="Mark read" onClick={() => void markRead(notification)} className="mt-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted opacity-70 hover:bg-accent/10 hover:text-accent focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:opacity-0 sm:group-hover:opacity-100"><Check size={14} /></button>}
                    </div>
                  </article>
                ))}
              </div>
              <Link href="/actions" onClick={() => setNotificationsOpen(false)} className="flex items-center justify-center border-t border-border px-4 py-2.5 text-[11px] font-semibold text-ink-muted transition-colors hover:bg-ink/[0.03] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">Open Action Center</Link>
            </section>
          )}
        </div>
        <ThemeToggle />
        <div className="glass flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[11px] font-bold text-white">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium leading-tight">
              {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : ""}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">
              {user?.role}
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="glass glass-hover flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:text-ink"
        >
          <Settings size={15} />
        </Link>
        <button
          onClick={logout}
          aria-label="Log out"
          className="glass glass-hover flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:text-danger"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
