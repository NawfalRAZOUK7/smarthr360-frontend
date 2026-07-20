export const SERVICES = {
  auth: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8000",
  coreHr: process.env.NEXT_PUBLIC_CORE_HR_URL ?? "http://localhost:8001",
  careerSim: process.env.NEXT_PUBLIC_CAREER_SIM_URL ?? "http://localhost:8003",
  futureSkills: process.env.NEXT_PUBLIC_FUTURE_SKILLS_URL ?? "http://localhost:8004",
  workload: process.env.NEXT_PUBLIC_WORKLOAD_URL ?? "http://localhost:8005",
  policyGen: process.env.NEXT_PUBLIC_POLICY_GEN_URL ?? "http://localhost:8006",
  retention: process.env.NEXT_PUBLIC_RETENTION_URL ?? "http://localhost:8007",
} as const;
