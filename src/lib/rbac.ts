/**
 * Frontend mirror of the backend role rules (smarthr360_jwt_auth.access).
 * The backend remains the source of truth — this only shapes the UI
 * (locked nav items, friendly gates) so users never hit raw 403s.
 *
 * Roles: EMPLOYEE, MANAGER, HR, ADMIN, plus two read-only roles:
 *   - AUDITOR: read-only visibility across the platform (no writes).
 *   - SUPPORT: limited read-only lookup (people & org).
 * Write helpers deliberately exclude AUDITOR/SUPPORT, so any control gated
 * on hasManagerAccess/hasHrAccess/hasAdminAccess stays hidden for them —
 * read-only falls out for free.
 */

export type Role = "EMPLOYEE" | "MANAGER" | "HR" | "ADMIN" | "AUDITOR" | "SUPPORT" | string;

export const hasAdminAccess = (role: Role) => role === "ADMIN";

export const hasHrAccess = (role: Role) => role === "HR" || role === "ADMIN";

export const hasManagerAccess = (role: Role) =>
  role === "MANAGER" || hasHrAccess(role);

/** Read-only roles — can view, never write. */
export const isAuditor = (role: Role) => role === "AUDITOR";
export const isSupport = (role: Role) => role === "SUPPORT";
export const isReadOnlyRole = (role: Role) => isAuditor(role) || isSupport(role);

/** Compose access checks: passes if ANY of the given checks passes. */
const anyOf =
  (...checks: ((r: Role) => boolean)[]) =>
  (role: Role) =>
    checks.some((c) => c(role));

export interface AccessRule {
  check: (role: Role) => boolean;
  /** Human label shown on locked screens/tooltips. */
  required: string;
}

// Auditors get read-only view of the operational/analytics modules;
// support gets read-only lookup of people & org.
export const ACCESS: Record<string, AccessRule> = {
  dashboard: { check: anyOf(hasManagerAccess, isAuditor), required: "Manager, HR, Admin or Auditor" },
  me: { check: () => true, required: "Any role" },
  actions: { check: () => true, required: "Any role" },
  employees: { check: anyOf(hasHrAccess, isAuditor, isSupport), required: "HR, Admin, Auditor or Support" },
  skillGaps: { check: anyOf(hasManagerAccess, isAuditor), required: "Manager, HR, Admin or Auditor" },
  workload: { check: anyOf(hasManagerAccess, isAuditor), required: "Manager, HR, Admin or Auditor" },
  retention: { check: anyOf(hasHrAccess, isAuditor), required: "HR, Admin or Auditor" },
  careerSim: { check: () => true, required: "Any role" },
  futureSkills: { check: anyOf(hasManagerAccess, isAuditor), required: "Manager, HR, Admin or Auditor" },
  policyGen: { check: anyOf(hasHrAccess, isAuditor), required: "HR, Admin or Auditor" },
  wellbeing: { check: () => true, required: "Any role" },
  reviews: { check: () => true, required: "Any role" },
  admin: { check: hasAdminAccess, required: "Admin" },
  organization: { check: anyOf(hasManagerAccess, isAuditor, isSupport), required: "Manager, HR, Admin, Auditor or Support" },
};
