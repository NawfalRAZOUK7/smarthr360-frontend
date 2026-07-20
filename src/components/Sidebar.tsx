"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  GitCompareArrows,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  LineChart,
  Lock,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Telescope,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ACCESS, type AccessRule } from "@/lib/rbac";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  access: AccessRule;
}

const nav: { section: string; items: NavItem[] }[] = [
  { section: "Overview", items: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, access: ACCESS.dashboard },
    { href: "/me", label: "My Hub", icon: UserRound, access: ACCESS.me },
    { href: "/actions", label: "Action Center", icon: Inbox, access: ACCESS.actions },
  ]},
  { section: "Core HR", items: [
    { href: "/employees", label: "Employees", icon: Users, access: ACCESS.employees },
    { href: "/skill-gaps", label: "Skill Gaps", icon: BrainCircuit, access: ACCESS.skillGaps },
    { href: "/wellbeing", label: "Wellbeing", icon: HeartPulse, access: ACCESS.wellbeing },
    { href: "/reviews", label: "Reviews", icon: ClipboardCheck, access: ACCESS.reviews },
  ]},
  { section: "Modules", items: [
    { href: "/modules/workload", label: "Workload", icon: Activity, access: ACCESS.workload },
    { href: "/modules/retention", label: "Retention", icon: LineChart, access: ACCESS.retention },
    { href: "/modules/career-sim", label: "Career Sim", icon: GitCompareArrows, access: ACCESS.careerSim },
    { href: "/modules/future-skills", label: "Future Skills", icon: Telescope, access: ACCESS.futureSkills },
    { href: "/modules/policy-gen", label: "Policy Gen", icon: ScrollText, access: ACCESS.policyGen },
  ]},
  { section: "Administration", items: [
    { href: "/organization", label: "Organization", icon: Building2, access: ACCESS.organization },
    { href: "/admin", label: "Users & Roles", icon: ShieldCheck, access: ACCESS.admin },
  ]},
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "";

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-[transform,background-color] duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 shadow-lg shadow-accent/30">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-sidebar-strong">
              SmartHR<span className="gradient-text">360</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-sidebar-ink/70">
              HR Analytics Suite
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto text-sidebar-ink hover:text-sidebar-strong md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {nav.map((group) => (
            <div key={group.section}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-ink/60">
                {group.section}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const allowed = item.access.check(role);
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  if (!allowed) {
                    return (
                      <li key={item.href}>
                        <span
                          title={`Requires ${item.access.required}`}
                          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-ink/40"
                        >
                          <item.icon size={16} />
                          {item.label}
                          <Lock size={11} className="ml-auto" />
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                          active
                            ? "bg-gradient-to-r from-accent/20 to-accent-2/10 text-sidebar-strong"
                            : "text-sidebar-ink hover:bg-sidebar-hover hover:text-sidebar-strong"
                        }`}
                      >
                        <item.icon
                          size={16}
                          className={active ? "text-accent" : ""}
                        />
                        {item.label}
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="text-[10px] text-sidebar-ink/60">
            6 microservices · JWT RS256 · SCD2
          </p>
        </div>
      </aside>
    </>
  );
}
