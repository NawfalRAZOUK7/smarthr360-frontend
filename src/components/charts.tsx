"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SkillGapForecast } from "@/lib/types";

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: "var(--danger)",
  MEDIUM: "var(--warning)",
  LOW: "var(--success)",
};

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--ink)",
};

/** Horizontal risk bars for the top-N most at-risk skills. */
export function RiskBarChart({ forecasts }: { forecasts: SkillGapForecast[] }) {
  const data = [...forecasts]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 8)
    .map((f) => ({
      // Skill only on the axis (keeps ticks on one line); dept shown in tooltip.
      name: f.skill_name,
      full: `${f.skill_name} · ${f.department_code}`,
      risk: f.risk_score,
      severity: f.severity,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fill: "var(--ink)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => (v.length > 21 ? `${v.slice(0, 20)}…` : v)}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--glow)" }}
          formatter={(v) => [`${v}`, "Risk score"]}
          labelFormatter={(_, payload) =>
            (payload?.[0]?.payload as { full?: string })?.full ?? ""
          }
        />
        <Bar dataKey="risk" radius={[0, 6, 6, 0]} barSize={16} animationDuration={900}>
          {data.map((d, i) => (
            <Cell key={i} fill={SEVERITY_COLOR[d.severity]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Supply vs demand at horizon, grouped by department (averages). */
export function SupplyDemandChart({ forecasts }: { forecasts: SkillGapForecast[] }) {
  const byDept = new Map<string, { supply: number[]; demand: number[] }>();
  for (const f of forecasts) {
    const entry = byDept.get(f.department_code) ?? { supply: [], demand: [] };
    entry.supply.push(f.projected_level);
    entry.demand.push(f.demand_level);
    byDept.set(f.department_code, entry);
  }
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const data = [...byDept.entries()].map(([dept, v]) => ({
    dept,
    supply: +avg(v.supply).toFixed(2),
    demand: +avg(v.demand).toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ right: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="dept" tick={{ fill: "var(--ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 4]} tick={{ fill: "var(--ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--glow)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar name="Projected supply" dataKey="supply" fill="var(--accent)" radius={[6, 6, 0, 0]} barSize={18} animationDuration={900} />
        <Bar name="Demand" dataKey="demand" fill="var(--accent-2)" fillOpacity={0.55} radius={[6, 6, 0, 0]} barSize={18} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Coverage radar per department. */
export function CoverageRadar({ forecasts }: { forecasts: SkillGapForecast[] }) {
  const byDept = new Map<string, number[]>();
  for (const f of forecasts) {
    byDept.set(f.department_code, [...(byDept.get(f.department_code) ?? []), f.coverage]);
  }
  const data = [...byDept.entries()].map(([dept, xs]) => ({
    dept,
    coverage: +((xs.reduce((a, b) => a + b, 0) / xs.length) * 100).toFixed(0),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="dept" tick={{ fill: "var(--ink-muted)", fontSize: 11 }} />
        <Radar
          name="Coverage %"
          dataKey="coverage"
          stroke="var(--accent-3)"
          fill="var(--accent-3)"
          fillOpacity={0.25}
          animationDuration={900}
        />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
