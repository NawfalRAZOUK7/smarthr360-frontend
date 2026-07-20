export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  /** JWT group names (e.g. AUDITOR, SUPPORT) — read-only roles live here. */
  groups?: string[];
  email_verified_at: string | null;
}

export interface SearchResult {
  type: "employee" | "skill" | "department" | string;
  id: number;
  label: string;
  sublabel: string;
  href: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export interface AuditRoleChange {
  id: number;
  target_user_id: number;
  target_email: string | null;
  actor_email: string;
  old_role: string;
  new_role: string;
  at: string;
}

export interface AuditLoginEvent {
  username: string;
  ip_address: string | null;
  failures: number;
  at: string | null;
}

export interface AuditLog {
  role_changes: AuditRoleChange[];
  login_events: AuditLoginEvent[];
  counts: { role_changes: number; login_events: number };
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Skill {
  id: number;
  name: string;
  code: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export interface OrgNode {
  id: number;
  user_id: number | null;
  name: string;
  job_title: string;
  department: string | null;
  reports: OrgNode[];
}

export interface OrgChart {
  headcount: number;
  roots: OrgNode[];
}

export interface SkillMatrixRow {
  skill: string;
  skill_code: string;
  average_level: number;
  evaluated_count: number;
  coverage_percent: number;
  average_target_gap: number;
}

export interface SkillMatrix {
  department: string;
  headcount: number;
  skills: SkillMatrixRow[];
}

export interface EmployeeProfile {
  id: number;
  user: {
    user_id: number | null;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  email: string;
  first_name: string;
  last_name: string;
  user_role: string;
  department: Department | null;
  job_title: string;
  employment_type: string;
  hire_date: string | null;
  phone_number: string;
  is_active: boolean;
}

export interface SkillGapForecast {
  department_code: string;
  skill_code: string;
  skill_name: string;
  horizon_months: number;
  current_avg_level: number;
  velocity_per_month: number;
  projected_level: number;
  demand_level: number;
  gap: number;
  coverage: number;
  attrition_rate: number;
  importance: number;
  risk_score: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
  rationale: string;
}

export interface SkillGapResponse {
  run_id: string;
  horizon_months: number;
  severity_summary: { high: number; medium: number; low: number };
  forecasts: SkillGapForecast[];
}

/* ---------------- workload ---------------- */

export interface BurnoutForecast {
  user_id: number;
  horizon_days: number;
  current_score: number | null;
  slope_per_day: number;
  projected_score: number | null;
  projected_level: "LOW" | "MODERATE" | "HIGH" | "BURNOUT_RISK" | null;
  trending_to_burnout: boolean;
  confidence: string;
  rationale: string;
}

export interface TeamBurnoutResponse {
  horizon_days: number;
  team_size: number;
  projected_at_risk: number;
  forecasts: BurnoutForecast[];
}

/* ---------------- retention ---------------- */

export interface AttritionForecast {
  employee_id: string;
  name: string;
  risk_score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: {
    engagement: number;
    performance: number;
    absence: number;
    signal_pressure: number;
    trend: number;
  };
  signal_trend_per_day: number;
  top_drivers: string[];
  rationale: string;
}

export interface AttritionResponse {
  run_id: string;
  count: number;
  level_summary: { critical: number; high: number; medium: number; low: number };
  forecasts: AttritionForecast[];
}

/* ---------------- career-sim ---------------- */

export interface CareerPosition {
  id: number;
  title: string;
  level: string;
  department: string;
  description: string;
}

export interface CareerComparisonRow {
  rank: number;
  target_position_id: number;
  target_position: string;
  department: string;
  readiness_percent: number;
  readiness_band: string;
  success_probability: number;
  estimated_years_to_ready: number | null;
  missing_skills: number;
  missing_skill_names?: string[];
}

export interface CareerCompareResponse {
  compared: number;
  recommended: string | null;
  ranking: CareerComparisonRow[];
}

export interface CareerMobility {
  ready_threshold: number;
  ready_count: number;
  compared: number;
  positions: CareerComparisonRow[];
}

export interface CareerSuccession {
  ready_threshold: number;
  roles: {
    target_position_id: number;
    target_position: string;
    department: string;
    ready_count: number;
    candidates: { employee_id: number; user_id: number; name: string; readiness_percent: number }[];
  }[];
}

export interface CareerProfile {
  user_id: number;
  competencies: { name: string; code: string; current_level: number; category?: string }[];
  languages: string[];
  simulations_count: number;
}

export interface CareerSimHistoryItem {
  id: number;
  target_position: string;
  date: string;
  score_matching: number | null;
  success_probability: number | null;
  estimated_duration: number | null;
}

export interface CareerSimHistory {
  simulations: CareerSimHistoryItem[];
}

/* ---------------- wellbeing (core-hr) ---------------- */

export interface SurveyQuestion {
  id: number;
  text: string;
  type: "SCALE_1_5" | "YES_NO" | "TEXT";
  order: number;
}

export interface WellbeingSurvey {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  questions: SurveyQuestion[];
}

export interface SurveyQuestionStats {
  id: number;
  text: string;
  type: string;
  avg?: number | null;
  distribution?: Record<string, number>;
  yes?: number;
  no?: number;
  count_text?: number;
}

export interface SurveyStats {
  suppressed?: boolean;
  detail?: string;
  responses_count?: number;
  min_responses?: number;
  count_responses?: number;
  questions?: SurveyQuestionStats[];
}

/* ---------------- reviews (core-hr) ---------------- */

export interface ReviewCycle {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ReviewItem {
  id: number;
  criteria: string;
  score: number;
  comment: string;
}

export interface MiniEmployee {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  department?: string | null;
}

export interface PerformanceReview {
  id: number;
  employee: MiniEmployee | null;
  manager: MiniEmployee | null;
  cycle: ReviewCycle | null;
  status: string;
  overall_score: number | null;
  employee_comment: string;
  manager_comment: string;
  items: ReviewItem[];
  created_at: string;
}

export interface Goal {
  id: number;
  employee: MiniEmployee | null;
  cycle: ReviewCycle | null;
  title: string;
  description: string;
  status: string;
  progress_percent: number;
  training_actions_count?: number;
}

export interface EmployeeDocument {
  id: number;
  employee: number;
  doc_type: "CONTRACT" | "ID" | "CERTIFICATION" | "POLICY_ACK" | "OTHER";
  title: string;
  reference_url: string;
  issue_date: string;
  expiry_date: string | null;
  is_expiring_soon: boolean;
  created_at: string;
}

export interface PeerFeedback {
  review_id: number;
  count: number;
  average_rating: number | null;
  by_relationship: Record<string, number>;
  comments: { relationship: string; rating: number; comment: string }[];
}

/* ---------------- retention ops ---------------- */

export interface RetentionConversation {
  id: number;
  employee: number;
  signal: number | null;
  started_at: string;
  completed: boolean;
  identified_need: string | null;
  messages: { from?: string; role?: string; text?: string; content?: string }[];
}

export interface RetentionAction {
  id: number;
  conversation: number;
  employee: number;
  employee_name: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  status: string;
  created_at: string;
  employee_retained: boolean | null;
  outcome_note: string | null;
}

export interface OutcomeStats {
  actions_total: number;
  by_status: Record<string, number>;
  outcomes_recorded: number;
  employees_retained: number;
  success_rate_percent: number | null;
  by_need: Record<string, { recorded: number; retained: number; success_rate: number }>;
}

/* ---------------- workload ops ---------------- */

export interface WorkloadTask {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: string;
  estimated_hours: number;
  complexity: number;
  deadline: string | null;
  is_unplanned: boolean;
}

export interface WorkloadAlert {
  id: number;
  user_id: number;
  level: string;
  message: string;
  recommendations: string[];
  acknowledged: boolean;
  created_at: string;
}

export interface ScoreTrend {
  user_id: number;
  points: number;
  direction: "worsening" | "improving" | "stable" | null;
  series: { computed_at: string; score: number; level: string }[];
}

export interface RebalanceSuggestion {
  overloaded_user_id: number;
  open_hours: number;
  suggested_recipient_user_id: number | null;
  recipient_open_hours: number | null;
  tasks_to_move: { id: number; title: string; estimated_hours: number; complexity: number }[];
}

export interface RebalanceResponse {
  team_source: string;
  suggestions: RebalanceSuggestion[];
}

/* ---------------- policy extras ---------------- */

export interface PolicyAnalytics {
  source: string;
  turnover_rate: number;
  avg_performance: number;
  headcount?: number;
  active?: number;
  retention_stats?: Record<string, number>;
}

export interface PortfolioEntry {
  policy_type: string;
  cost: number;
  benefit: number;
  reason: string;
  impact: { turnover_change: number; performance_change: number; cost_estimate: number };
}

export interface OptimizeResponse {
  budget: number;
  budget_used: number;
  budget_remaining: number;
  magnitude: number;
  expected_turnover_change: number;
  expected_performance_change: number;
  selected: PortfolioEntry[];
  skipped?: PortfolioEntry[];
  data_source?: string;
}

export interface AiRecommendation {
  policy: string;
  reason: string;
  priority: string;
  budget_estimate: string;
  estimated_cost_mad: number;
}

export interface PolicyImpact {
  turnover_change: number;
  performance_change: number;
  cost_estimate: number;
}

export interface SimulateResult {
  simulation_id: string;
  policy_type: string;
  magnitude: number;
  impact: PolicyImpact;
  data_source?: string;
}

export interface SimulationRun {
  id: string;
  created_at: string;
  scenario: { policy_type?: string; magnitude?: number; data_source?: string };
  result: PolicyImpact;
}

export interface SimulationHistory {
  count: number;
  simulations: SimulationRun[];
}

export interface PolicyOutcome {
  observed_turnover_change: number | null;
  observed_cost: number | null;
  note?: string;
}

export interface PolicyVariance {
  turnover_variance?: number;
  delivered?: boolean;
  cost_variance?: number;
}

export interface AppliedPolicy {
  applied_id: string;
  policy_type: string;
  magnitude: number;
  applied_at: string;
  source_simulation_id?: string | null;
  predicted: PolicyImpact | null;
  outcome: PolicyOutcome | null;
  variance: PolicyVariance | null;
}

export interface AppliedPolicies {
  count: number;
  tracked_count: number;
  applied: AppliedPolicy[];
}

export interface PolicyOutcomeTypeRow {
  policy_type: string;
  applied: number;
  tracked: number;
  delivered: number;
  delivered_rate: number | null;
  avg_predicted_turnover: number | null;
  avg_observed_turnover: number | null;
  total_cost_variance: number | null;
}

export interface PolicyOutcomesSummary {
  applied_count: number;
  tracked_count: number;
  delivered_count: number;
  delivered_rate: number | null;
  by_policy_type: PolicyOutcomeTypeRow[];
}

/* ---------------- future-skills (m3) ---------------- */

export interface FsSkill {
  id: number;
  name: string;
  category?: string;
}

export interface FsJobRole {
  id: number;
  name: string;
  department?: string;
}

export interface FutureSkillPrediction {
  id: number;
  job_role: FsJobRole;
  skill: FsSkill;
  horizon_years: number;
  score: number; // 0-100
  level: "LOW" | "MEDIUM" | "HIGH";
  rationale: string | null;
  created_at: string;
}

export interface MarketTrend {
  id: number;
  title: string;
  source_name: string;
  year: number;
  sector: string;
  trend_score: number; // 0-1
  description: string | null;
}

export interface HRRecommendation {
  id: number;
  skill: FsSkill;
  job_role: FsJobRole;
  horizon_years: number;
  priority_level: "LOW" | "MEDIUM" | "HIGH";
  recommended_action: string;
  budget_hint: string | null;
  rationale: string | null;
}

export interface TrainingRun {
  id: number;
  run_date: string;
  model_version: string;
  status: string;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  training_duration_seconds: number | null;
  trained_by_username: string | null;
}

export interface TrainResult {
  training_run_id: number;
  status: string;
  message: string;
  model_version: string;
  metrics?: { accuracy?: number; f1_score?: number };
  task_id?: string;
}

/* training actions — close the skill-gap loop (core-hr) */
export type TrainingActionStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface TrainingAction {
  id: number;
  title: string;
  provider: string;
  skill: { id: number; name: string; code: string } | null;
  department: { id: number; name: string } | null;
  employee: { id: number; name: string } | null;
  goal?: { id: number; title: string; status: string } | null;
  owner_user_id: number | null;
  target_level: number | null;
  due_date: string | null;
  budget: string | null;
  status: TrainingActionStatus;
  progress_percent: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

/* retention cost-of-attrition / ROI */
export interface RetentionROI {
  assumptions: { avg_replacement_cost: number; action_cost: number; action_effectiveness: number };
  forward: {
    total_exposure: number;
    at_risk_count: number;
    at_risk_exposure: number;
    potential_savings: number;
    by_level: { level: string; count: number; exposure: number }[];
  };
  realized: {
    actions_with_outcome: number;
    retained: number;
    retention_rate: number | null;
    realized_savings: number;
  };
}

/* policy-gen document generation */
export interface PolicyEmployee {
  id: string;
  name: string;
  employee_number: string | null;
  email: string | null;
  department: string | null;
  job_title: string | null;
  status: string;
}

export interface PolicyDocTemplate {
  policy_type: string;
  title: string;
}

/* Economic indicators feeding the demand model */
export interface EconomicReport {
  id: number;
  title: string;
  source_name: string;
  year: number;
  indicator: string;
  value: number;
  sector: string | null;
  created_at: string;
}

/* Future-skills service health & metrics (ops monitoring) */
export interface ServiceMetrics {
  timestamp: string;
  system: { platform: string; python_version: string; cpu_count: string };
  database: { status: string; engine?: string; table_count?: number; error?: string };
  cache: { status: string; backend?: string; error?: string };
  api: {
    models: { skills: number; job_roles: number; predictions: number; employees: number };
    rate_limits: Record<string, string>;
  };
}

export interface DriftStatus {
  status: "STABLE" | "WARNING" | "DRIFTED" | "NO_DATA";
  delta: number | null;
  mean_score: number | null;
  previous_mean_score: number | null;
  sample_size: number;
  distribution: Record<string, number>;
  last_run_id: number | null;
  last_run_at: string | null;
}

/* Bulk employee import (HR-only) */
export interface BulkImportEmployee {
  name: string;
  email: string;
  department: string;
  position: string;
  current_skills: string[];
}

export interface BulkImportResult {
  status: string;
  created: number;
  updated: number;
  errors: { index?: number; email?: string; error: string }[];
  predictions_generated: boolean;
}

/* ---------------- HR-Open interop (read-only, standardized) ---------------- */

export interface InteropTaxonomy {
  id: string;
  name: string;
}

export interface InteropCompetencyDefinition {
  type: string;
  id: string;
  competencyId: string;
  name: string;
  description: string;
  competencyCategory: string;
  active: boolean;
  taxonomyId: string;
  taxonomy: InteropTaxonomy;
}

export interface InteropCompetencyDimension {
  score: { value: number | null; maximumValue: number; name: string; scaleId: string };
  targetValue: number | null;
  targetGap: number | null;
}

export interface InteropPersonCompetency {
  type: string;
  id: string;
  person: {
    id: number;
    employeeId: string | null;
    name: string;
    departmentCode: string | null;
    jobTitle: string | null;
  };
  competency: { id: string; competencyId: string; name: string; category: string };
  competencyDimensions: InteropCompetencyDimension[];
  effectiveDateRange: { startDate: string | null; endDate: string | null };
}

export interface InteropModelEntry {
  competency: { id: string; name: string };
  expectedProficiency: { averageValue: number; maximumValue: number; scaleId: string };
  assessedHeadcount: number;
  coveragePercent: number;
  averageTargetGap: number | null;
}

export interface InteropPositionModel {
  type: string;
  id: string;
  orgUnit: { departmentCode: string };
  headcount: number;
  competencies: InteropModelEntry[];
}

/* ---------------- policy-gen ---------------- */

export const POLICY_TYPES = [
  "salary_increase",
  "remote_work",
  "training_budget",
  "wellness_program",
  "flexible_hours",
  "mentorship",
] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export interface PolicyComparisonRow {
  policy_type: string;
  magnitude: number;
  turnover_change: number | null;
  performance_change: number | null;
  cost_estimate: number;
  benefit_score: number;
  cost_efficiency: number;
  zero_cost: boolean;
}

export interface PolicyCompareResponse {
  ranking: PolicyComparisonRow[];
  recommended: string | null;
  most_cost_efficient: string | null;
  data_source?: string;
}
