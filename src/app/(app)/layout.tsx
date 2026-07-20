"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import GlobalSearch from "@/components/GlobalSearch";
import { useAuth } from "@/lib/auth-context";

const titles: [string, string][] = [
  ["/employees", "Employees"],
  ["/skill-gaps", "Skill Gap Predictions"],
  ["/wellbeing", "Wellbeing Surveys"],
  ["/reviews", "Performance Reviews"],
  ["/organization", "Organization — Departments & Skills"],
  ["/admin", "Administration — Users & Roles"],
  ["/settings", "Settings"],
  ["/modules/future-skills", "Future Skills — Demand Prediction"],
  ["/modules/workload", "Workload — Burnout Forecast"],
  ["/modules/retention", "Retention — Attrition Prediction"],
  ["/modules/career-sim", "Career Simulator — Trajectory Comparison"],
  ["/modules/future-skills", "Future Skills — Demand Prediction"],
  ["/modules/policy-gen", "Policy Generator — A/B Comparison"],
  ["/me", "My Hub"],
  ["/actions", "Action Center"],
  ["/", "Executive Dashboard"],
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // ⌘K / Ctrl+K opens global search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </div>
    );
  }

  const title =
    titles.find(([p]) => (p === "/" ? pathname === "/" : pathname.startsWith(p)))?.[1] ??
    "SmartHR360";

  return (
    <div className="min-h-screen">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="md:pl-60">
        <Topbar title={title} onMenu={() => setNavOpen(true)} onSearch={() => setSearchOpen(true)} />
        <main className="mx-auto max-w-6xl px-6 py-7">{children}</main>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
