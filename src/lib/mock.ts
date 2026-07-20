import type {
  AiRecommendation,
  AttritionResponse,
  Goal,
  OptimizeResponse,
  OutcomeStats,
  PerformanceReview,
  PolicyAnalytics,
  RetentionAction,
  RetentionConversation,
  ReviewCycle,
  ScoreTrend,
  SurveyStats,
  WellbeingSurvey,
  WorkloadAlert,
  WorkloadTask,
  CareerCompareResponse,
  CareerPosition,
  EmployeeProfile,
  FutureSkillPrediction,
  HRRecommendation,
  MarketTrend,
  PolicyCompareResponse,
  SkillGapResponse,
  TeamBurnoutResponse,
  InteropCompetencyDefinition,
  InteropPersonCompetency,
  InteropPositionModel,
  EconomicReport,
  ServiceMetrics,
  PolicyEmployee,
  PolicyDocTemplate,
} from "./types";

/**
 * Demo data used when the backend services are unreachable, so the UI is
 * fully explorable without docker-compose running. Screens display a
 * "demo data" banner whenever this is served.
 */

export const mockSkillGaps: SkillGapResponse = {
  run_id: "demo",
  horizon_months: 6,
  severity_summary: { high: 3, medium: 4, low: 5 },
  forecasts: [
    { department_code: "ENG", skill_code: "K8S", skill_name: "Kubernetes", horizon_months: 6, current_avg_level: 2.1, velocity_per_month: 0.02, projected_level: 2.1, demand_level: 3.5, gap: -1.4, coverage: 0.45, attrition_rate: 0.12, importance: 5, risk_score: 84.2, severity: "HIGH", rationale: "Low coverage and flat progression against a critical demand." },
    { department_code: "DATA", skill_code: "MLOPS", skill_name: "MLOps", horizon_months: 6, current_avg_level: 1.8, velocity_per_month: 0.05, projected_level: 2.0, demand_level: 3.2, gap: -1.2, coverage: 0.38, attrition_rate: 0.08, importance: 5, risk_score: 78.6, severity: "HIGH", rationale: "Demand grows faster than observed upskilling velocity." },
    { department_code: "ENG", skill_code: "SEC", skill_name: "Security Engineering", horizon_months: 6, current_avg_level: 2.4, velocity_per_month: 0.03, projected_level: 2.5, demand_level: 3.4, gap: -0.9, coverage: 0.52, attrition_rate: 0.1, importance: 4, risk_score: 69.1, severity: "HIGH", rationale: "Attrition among assessed staff erodes projected supply." },
    { department_code: "HR", skill_code: "PA", skill_name: "People Analytics", horizon_months: 6, current_avg_level: 2.2, velocity_per_month: 0.08, projected_level: 2.6, demand_level: 3.2, gap: -0.6, coverage: 0.6, attrition_rate: 0.04, importance: 4, risk_score: 55.4, severity: "MEDIUM", rationale: "Positive velocity narrows but does not close the gap." },
    { department_code: "FIN", skill_code: "AUTO", skill_name: "Process Automation", horizon_months: 6, current_avg_level: 2.5, velocity_per_month: 0.06, projected_level: 2.8, demand_level: 3.3, gap: -0.5, coverage: 0.55, attrition_rate: 0.05, importance: 3, risk_score: 48.9, severity: "MEDIUM", rationale: "Moderate gap with acceptable coverage." },
    { department_code: "ENG", skill_code: "PY", skill_name: "Python", horizon_months: 6, current_avg_level: 3.1, velocity_per_month: 0.04, projected_level: 3.3, demand_level: 3.6, gap: -0.3, coverage: 0.82, attrition_rate: 0.06, importance: 4, risk_score: 41.2, severity: "MEDIUM", rationale: "Strong base, small residual gap at horizon." },
    { department_code: "SALES", skill_code: "CRM", skill_name: "CRM Mastery", horizon_months: 6, current_avg_level: 2.9, velocity_per_month: 0.07, projected_level: 3.3, demand_level: 3.4, gap: -0.1, coverage: 0.7, attrition_rate: 0.09, importance: 3, risk_score: 33.8, severity: "MEDIUM", rationale: "Nearly closed by current upskilling trend." },
    { department_code: "DATA", skill_code: "SQL", skill_name: "SQL", horizon_months: 6, current_avg_level: 3.4, velocity_per_month: 0.03, projected_level: 3.5, demand_level: 3.5, gap: 0.0, coverage: 0.9, attrition_rate: 0.03, importance: 3, risk_score: 18.5, severity: "LOW", rationale: "Supply meets demand at horizon." },
    { department_code: "HR", skill_code: "COM", skill_name: "Communication", horizon_months: 6, current_avg_level: 3.6, velocity_per_month: 0.02, projected_level: 3.7, demand_level: 3.4, gap: 0.3, coverage: 0.88, attrition_rate: 0.02, importance: 2, risk_score: 8.1, severity: "LOW", rationale: "Surplus maintained." },
    { department_code: "ENG", skill_code: "GIT", skill_name: "Git & CI/CD", horizon_months: 6, current_avg_level: 3.5, velocity_per_month: 0.03, projected_level: 3.7, demand_level: 3.3, gap: 0.4, coverage: 0.93, attrition_rate: 0.04, importance: 2, risk_score: 6.4, severity: "LOW", rationale: "Healthy surplus with high coverage." },
    { department_code: "FIN", skill_code: "XLS", skill_name: "Financial Modelling", horizon_months: 6, current_avg_level: 3.2, velocity_per_month: 0.05, projected_level: 3.5, demand_level: 3.1, gap: 0.4, coverage: 0.8, attrition_rate: 0.03, importance: 2, risk_score: 5.9, severity: "LOW", rationale: "Stable supply above demand." },
    { department_code: "SALES", skill_code: "NEG", skill_name: "Negotiation", horizon_months: 6, current_avg_level: 3.3, velocity_per_month: 0.04, projected_level: 3.5, demand_level: 3.0, gap: 0.5, coverage: 0.85, attrition_rate: 0.05, importance: 2, risk_score: 4.2, severity: "LOW", rationale: "Comfortable margin." },
  ],
};

export const mockTeamBurnout: TeamBurnoutResponse = {
  horizon_days: 14,
  team_size: 6,
  projected_at_risk: 2,
  forecasts: [
    { user_id: 2, horizon_days: 14, current_score: 78.4, slope_per_day: 0.9, projected_score: 91.0, projected_level: "BURNOUT_RISK", trending_to_burnout: true, confidence: "HIGH", rationale: "Sustained overtime and rising unresolved task load over the last 3 weeks." },
    { user_id: 3, horizon_days: 14, current_score: 66.2, slope_per_day: 0.6, projected_score: 74.6, projected_level: "HIGH", trending_to_burnout: true, confidence: "MEDIUM", rationale: "Score climbing steadily; meeting load doubled since sprint start." },
    { user_id: 5, horizon_days: 14, current_score: 52.8, slope_per_day: 0.1, projected_score: 54.2, projected_level: "MODERATE", trending_to_burnout: false, confidence: "HIGH", rationale: "Stable plateau within normal range." },
    { user_id: 4, horizon_days: 14, current_score: 44.1, slope_per_day: -0.3, projected_score: 39.9, projected_level: "MODERATE", trending_to_burnout: false, confidence: "MEDIUM", rationale: "Recovering after workload rebalancing action." },
    { user_id: 6, horizon_days: 14, current_score: 31.5, slope_per_day: -0.1, projected_score: 30.1, projected_level: "LOW", trending_to_burnout: false, confidence: "HIGH", rationale: "Healthy signal mix, regular breaks observed." },
    { user_id: 1, horizon_days: 14, current_score: 27.0, slope_per_day: 0.0, projected_score: 27.0, projected_level: "LOW", trending_to_burnout: false, confidence: "LOW", rationale: "Sparse signal history; low confidence." },
  ],
};

export const mockAttrition: AttritionResponse = {
  run_id: "demo",
  count: 6,
  level_summary: { critical: 1, high: 1, medium: 2, low: 2 },
  forecasts: [
    { employee_id: "E102", name: "Youssef Ben Ali", risk_score: 82.5, level: "CRITICAL", factors: { engagement: 0.31, performance: 0.72, absence: 0.4, signal_pressure: 0.85, trend: 0.7 }, signal_trend_per_day: 0.12, top_drivers: ["signal_pressure", "engagement"], rationale: "Unresolved burnout signal plus engagement collapse over 60 days." },
    { employee_id: "E205", name: "Sophie Leroy", risk_score: 68.9, level: "HIGH", factors: { engagement: 0.45, performance: 0.88, absence: 0.2, signal_pressure: 0.6, trend: 0.5 }, signal_trend_per_day: 0.08, top_drivers: ["signal_pressure", "trend"], rationale: "High performer with rising signal intensity — classic flight-risk profile." },
    { employee_id: "E318", name: "Lucie Moreau", risk_score: 51.2, level: "MEDIUM", factors: { engagement: 0.58, performance: 0.61, absence: 0.55, signal_pressure: 0.3, trend: 0.2 }, signal_trend_per_day: 0.02, top_drivers: ["absence"], rationale: "Absence days trending above department norm." },
    { employee_id: "E410", name: "Omar Haddad", risk_score: 44.0, level: "MEDIUM", factors: { engagement: 0.6, performance: 0.55, absence: 0.3, signal_pressure: 0.35, trend: 0.1 }, signal_trend_per_day: 0.01, top_drivers: ["performance"], rationale: "Mild disengagement, stable otherwise." },
    { employee_id: "E501", name: "Amina Karimi", risk_score: 22.7, level: "LOW", factors: { engagement: 0.85, performance: 0.9, absence: 0.1, signal_pressure: 0.1, trend: 0.0 }, signal_trend_per_day: 0.0, top_drivers: [], rationale: "Strong engagement and performance, no active signals." },
    { employee_id: "E602", name: "Mamadou Diallo", risk_score: 15.3, level: "LOW", factors: { engagement: 0.9, performance: 0.82, absence: 0.05, signal_pressure: 0.05, trend: -0.1 }, signal_trend_per_day: -0.01, top_drivers: [], rationale: "Signals resolving; risk decreasing." },
  ],
};

export const mockPositions: CareerPosition[] = [
  { id: 1, title: "Senior Backend Engineer", level: "Senior", department: "ENG", description: "Own service design and mentoring within a squad." },
  { id: 2, title: "Engineering Manager", level: "Manager", department: "ENG", description: "Lead a squad of 6-8 engineers." },
  { id: 3, title: "Data Science Lead", level: "Lead", department: "DATA", description: "Drive the ML roadmap and model governance." },
  { id: 4, title: "HR Analytics Specialist", level: "Senior", department: "HR", description: "Own people-analytics reporting and forecasting." },
  { id: 5, title: "Product Manager", level: "Senior", department: "PRODUCT", description: "Own discovery-to-delivery for one product area." },
];

export const mockCareerProfile = {
  user_id: 2,
  competencies: [
    { name: "Python", code: "PY", current_level: 4, category: "tech" },
    { name: "Django", code: "DJ", current_level: 3, category: "tech" },
    { name: "SQL", code: "SQL", current_level: 3, category: "tech" },
    { name: "Communication", code: "COMM", current_level: 3, category: "soft" },
    { name: "Kubernetes", code: "K8S", current_level: 2, category: "tech" },
  ],
  languages: ["French (native)", "English (fluent)", "Arabic (conversational)"],
  simulations_count: 3,
};

export const mockCareerSimHistory = {
  simulations: [
    { id: 3, target_position: "Senior Backend Engineer", date: "2026-07-12T10:00:00Z", score_matching: 78, success_probability: 0.82, estimated_duration: 0.5 },
    { id: 2, target_position: "Engineering Manager", date: "2026-07-08T14:30:00Z", score_matching: 54, success_probability: 0.61, estimated_duration: 1.5 },
    { id: 1, target_position: "Data Science Lead", date: "2026-06-30T09:15:00Z", score_matching: 31, success_probability: 0.38, estimated_duration: 3.0 },
  ],
};

export const mockCareerCompare: CareerCompareResponse = {
  compared: 3,
  recommended: "Senior Backend Engineer",
  ranking: [
    { rank: 1, target_position_id: 1, target_position: "Senior Backend Engineer", department: "ENG", readiness_percent: 78, readiness_band: "READY_SOON", success_probability: 0.82, estimated_years_to_ready: 0.5, missing_skills: 2 },
    { rank: 2, target_position_id: 2, target_position: "Engineering Manager", department: "ENG", readiness_percent: 54, readiness_band: "DEVELOPING", success_probability: 0.61, estimated_years_to_ready: 1.5, missing_skills: 4 },
    { rank: 3, target_position_id: 3, target_position: "Data Science Lead", department: "DATA", readiness_percent: 31, readiness_band: "EARLY", success_probability: 0.38, estimated_years_to_ready: 3.0, missing_skills: 7 },
  ],
};

export const mockCareerMobility = {
  ready_threshold: 70,
  ready_count: 1,
  compared: 3,
  positions: [
    { rank: 1, target_position_id: 1, target_position: "Senior Backend Engineer", department: "ENG", readiness_percent: 78, readiness_band: "READY_SOON", success_probability: 0.82, estimated_years_to_ready: 0.5, missing_skills: 2 },
    { rank: 2, target_position_id: 2, target_position: "Engineering Manager", department: "ENG", readiness_percent: 54, readiness_band: "DEVELOPING", success_probability: 0.61, estimated_years_to_ready: 1.5, missing_skills: 4 },
    { rank: 3, target_position_id: 3, target_position: "Data Science Lead", department: "DATA", readiness_percent: 31, readiness_band: "EARLY", success_probability: 0.38, estimated_years_to_ready: 3.0, missing_skills: 7 },
  ],
};

export const mockPolicyCompare: PolicyCompareResponse = {
  recommended: "flexible_hours",
  most_cost_efficient: "flexible_hours",
  data_source: "demo analytical store",
  ranking: [
    { policy_type: "flexible_hours", magnitude: 1, turnover_change: -2.8, performance_change: 1.9, cost_estimate: 0, benefit_score: 4.7, cost_efficiency: 4.7, zero_cost: true },
    { policy_type: "salary_increase", magnitude: 1, turnover_change: -3.5, performance_change: 1.2, cost_estimate: 180000, benefit_score: 4.7, cost_efficiency: 0.026, zero_cost: false },
    { policy_type: "training_budget", magnitude: 1, turnover_change: -1.6, performance_change: 2.4, cost_estimate: 60000, benefit_score: 4.0, cost_efficiency: 0.067, zero_cost: false },
    { policy_type: "remote_work", magnitude: 1, turnover_change: -2.1, performance_change: 0.8, cost_estimate: 15000, benefit_score: 2.9, cost_efficiency: 0.193, zero_cost: false },
    { policy_type: "wellness_program", magnitude: 1, turnover_change: -1.2, performance_change: 1.1, cost_estimate: 45000, benefit_score: 2.3, cost_efficiency: 0.051, zero_cost: false },
    { policy_type: "mentorship", magnitude: 1, turnover_change: -0.9, performance_change: 1.3, cost_estimate: 8000, benefit_score: 2.2, cost_efficiency: 0.275, zero_cost: false },
  ],
};

export const mockSurveys: WellbeingSurvey[] = [
  { id: 1, title: "Pulse Q3 2026", description: "Quarterly wellbeing pulse.", is_active: true, created_at: "2026-07-01T08:00:00Z", questions: [
    { id: 1, text: "How is your work-life balance?", type: "SCALE_1_5", order: 1 },
    { id: 2, text: "Do you feel supported by your manager?", type: "YES_NO", order: 2 },
    { id: 3, text: "Anything else you want to share?", type: "TEXT", order: 3 },
  ]},
  { id: 2, title: "Remote work check-in", description: "How is hybrid working going?", is_active: true, created_at: "2026-05-12T08:00:00Z", questions: [
    { id: 4, text: "Rate your home-office setup", type: "SCALE_1_5", order: 1 },
    { id: 5, text: "Do you have enough social contact with the team?", type: "YES_NO", order: 2 },
  ]},
  { id: 3, title: "Onboarding feedback 2025", description: "Closed survey.", is_active: false, created_at: "2025-11-02T08:00:00Z", questions: [] },
];

export const mockSurveyStats: SurveyStats = {
  count_responses: 18,
  questions: [
    { id: 1, text: "How is your work-life balance?", type: "SCALE_1_5", avg: 3.4, distribution: { "1": 1, "2": 3, "3": 5, "4": 6, "5": 3 } },
    { id: 2, text: "Do you feel supported by your manager?", type: "YES_NO", yes: 13, no: 5 },
    { id: 3, text: "Anything else you want to share?", type: "TEXT", count_text: 7 },
  ],
};

export const mockCycles: ReviewCycle[] = [
  { id: 1, name: "Annual Review 2026", start_date: "2026-01-01", end_date: "2026-12-31", is_active: true },
  { id: 2, name: "Mid-year Check 2026", start_date: "2026-06-01", end_date: "2026-07-31", is_active: true },
  { id: 3, name: "Annual Review 2025", start_date: "2025-01-01", end_date: "2025-12-31", is_active: false },
];

export const mockReviews: PerformanceReview[] = [
  { id: 1, employee: { id: 2, first_name: "Youssef", last_name: "Ben Ali", department: "ENG" }, manager: { id: 1, first_name: "Amina", last_name: "Karimi" }, cycle: mockCycles[0], status: "SUBMITTED", overall_score: 4.2, employee_comment: "Strong year, want to grow toward lead role.", manager_comment: "Consistently exceeds expectations on delivery.", created_at: "2026-06-20T10:00:00Z", items: [
    { id: 1, criteria: "Technical delivery", score: 5, comment: "Owns complex migrations end to end." },
    { id: 2, criteria: "Collaboration", score: 4, comment: "Great in code reviews." },
    { id: 3, criteria: "Autonomy", score: 4, comment: "" },
  ]},
  { id: 2, employee: { id: 3, first_name: "Sophie", last_name: "Leroy", department: "DATA" }, manager: { id: 1, first_name: "Amina", last_name: "Karimi" }, cycle: mockCycles[0], status: "DRAFT", overall_score: null, employee_comment: "", manager_comment: "", created_at: "2026-06-25T10:00:00Z", items: [] },
  { id: 3, employee: { id: 5, first_name: "Lucie", last_name: "Moreau", department: "FIN" }, manager: { id: 4, first_name: "Mamadou", last_name: "Diallo" }, cycle: mockCycles[1], status: "ACKNOWLEDGED", overall_score: 3.6, employee_comment: "Agreed on the development plan.", manager_comment: "Solid contributor, focus on automation skills.", created_at: "2026-07-02T10:00:00Z", items: [
    { id: 4, criteria: "Analysis quality", score: 4, comment: "" },
    { id: 5, criteria: "Deadline reliability", score: 3, comment: "Improving." },
  ]},
];

export const mockPeerFeedback = {
  review_id: 1,
  count: 3,
  average_rating: 4.3,
  by_relationship: { PEER: 2, REPORT: 1 },
  comments: [
    { relationship: "PEER", rating: 5, comment: "Reliable and always shares knowledge in reviews." },
    { relationship: "REPORT", rating: 4, comment: "Clear direction, could delegate a bit more." },
  ],
};

export const mockGoals: Goal[] = [
  { id: 1, employee: { id: 2, first_name: "Youssef", last_name: "Ben Ali" }, cycle: mockCycles[0], title: "Reach Lead Developer readiness 80%", description: "Close the skills gap identified by career-sim.", status: "IN_PROGRESS", progress_percent: 55 },
  { id: 2, employee: { id: 3, first_name: "Sophie", last_name: "Leroy" }, cycle: mockCycles[0], title: "Ship MLOps pipeline v1", description: "Production-grade model deployment.", status: "IN_PROGRESS", progress_percent: 30 },
  { id: 3, employee: { id: 5, first_name: "Lucie", last_name: "Moreau" }, cycle: mockCycles[1], title: "Automate monthly reporting", description: "Reduce manual closing time by 40%.", status: "DONE", progress_percent: 100 },
];

export const mockConversations: RetentionConversation[] = [
  { id: 1, employee: 1, signal: 1, started_at: "2026-07-05T09:12:00Z", completed: true, identified_need: "workload_relief", messages: [
    { from: "bot", text: "Hi Youssef — I noticed some signals suggesting things might be tough lately. How are you feeling about your workload?" },
    { from: "employee", text: "Honestly it's been a lot. Two releases plus the incident on-call rotation." },
    { from: "bot", text: "Thanks for sharing. Would rebalancing some tasks or a short recovery period help most?" },
    { from: "employee", text: "Rebalancing the on-call would help a lot." },
    { from: "bot", text: "Noted — I'm flagging a workload-relief action for HR with high priority." },
  ]},
  { id: 2, employee: 2, signal: null, started_at: "2026-07-08T14:30:00Z", completed: false, identified_need: null, messages: [
    { from: "bot", text: "Hi Sophie — quick check-in: how satisfied are you with your growth opportunities?" },
    { from: "employee", text: "I feel a bit stuck since the ML project was paused." },
  ]},
];

export const mockActions: RetentionAction[] = [
  { id: 1, conversation: 1, employee: 1, employee_name: "Youssef Ben Ali", description: "Rebalance on-call rotation; move 2 tasks to next sprint.", priority: "HIGH", status: "approved", created_at: "2026-07-05T09:40:00Z", employee_retained: null, outcome_note: null },
  { id: 2, conversation: 2, employee: 2, employee_name: "Sophie Leroy", description: "Schedule career conversation about ML roadmap ownership.", priority: "MEDIUM", status: "pending", created_at: "2026-07-08T15:00:00Z", employee_retained: null, outcome_note: null },
  { id: 3, conversation: 1, employee: 3, employee_name: "Omar Haddad", description: "Offer sales-engineering rotation (flight-risk mitigation).", priority: "HIGH", status: "completed", created_at: "2026-05-15T11:00:00Z", employee_retained: true, outcome_note: "Accepted rotation; engagement back up." },
];

export const mockOutcomes: OutcomeStats = {
  actions_total: 9,
  by_status: { pending: 2, approved: 3, completed: 4 },
  outcomes_recorded: 4,
  employees_retained: 3,
  success_rate_percent: 75,
  by_need: {
    workload_relief: { recorded: 2, retained: 2, success_rate: 100 },
    career_growth: { recorded: 1, retained: 1, success_rate: 100 },
    compensation: { recorded: 1, retained: 0, success_rate: 0 },
  },
};

export const mockTasks: WorkloadTask[] = [
  { id: 1, user_id: 2, title: "Migrate legacy shared repo", description: "", status: "IN_PROGRESS", estimated_hours: 12, complexity: 5, deadline: "2026-07-11", is_unplanned: false },
  { id: 2, user_id: 2, title: "Fix production incident", description: "", status: "IN_PROGRESS", estimated_hours: 6, complexity: 5, deadline: "2026-07-10", is_unplanned: true },
  { id: 3, user_id: 2, title: "Implement RS256 key rotation", description: "", status: "TODO", estimated_hours: 8, complexity: 4, deadline: "2026-07-12", is_unplanned: false },
  { id: 4, user_id: 2, title: "Code reviews backlog", description: "", status: "TODO", estimated_hours: 6, complexity: 3, deadline: "2026-07-13", is_unplanned: false },
  { id: 5, user_id: 2, title: "Prepare sprint demo", description: "", status: "DONE", estimated_hours: 3, complexity: 2, deadline: "2026-07-09", is_unplanned: false },
];

export const mockAlerts: WorkloadAlert[] = [
  { id: 1, user_id: 2, level: "BURNOUT_RISK", message: "Sustained overload: 78/100 with rising trend over 3 weeks.", recommendations: ["Rebalance 2 tasks to teammates", "Block 2 focus half-days", "Manager 1:1 within 48h"], acknowledged: false, created_at: "2026-07-09T08:00:00Z" },
  { id: 2, user_id: 3, level: "HIGH", message: "Meeting load doubled since sprint start; stress signals elevated.", recommendations: ["Decline non-critical meetings", "Review sprint commitment"], acknowledged: false, created_at: "2026-07-08T16:20:00Z" },
  { id: 3, user_id: 5, level: "MODERATE", message: "Score recovering after rebalancing; keep monitoring.", recommendations: [], acknowledged: true, created_at: "2026-07-01T10:00:00Z" },
];

export const mockTrend: ScoreTrend = {
  user_id: 2,
  points: 10,
  direction: "worsening",
  series: [
    { computed_at: "2026-06-01T08:00:00Z", score: 48, level: "MODERATE" },
    { computed_at: "2026-06-05T08:00:00Z", score: 52, level: "MODERATE" },
    { computed_at: "2026-06-09T08:00:00Z", score: 55, level: "MODERATE" },
    { computed_at: "2026-06-13T08:00:00Z", score: 60, level: "HIGH" },
    { computed_at: "2026-06-17T08:00:00Z", score: 58, level: "HIGH" },
    { computed_at: "2026-06-21T08:00:00Z", score: 64, level: "HIGH" },
    { computed_at: "2026-06-25T08:00:00Z", score: 69, level: "HIGH" },
    { computed_at: "2026-06-29T08:00:00Z", score: 71, level: "HIGH" },
    { computed_at: "2026-07-03T08:00:00Z", score: 75, level: "BURNOUT_RISK" },
    { computed_at: "2026-07-07T08:00:00Z", score: 78, level: "BURNOUT_RISK" },
  ],
};

export const mockRebalance = {
  team_source: "demo",
  suggestions: [
    {
      overloaded_user_id: 2,
      open_hours: 31,
      suggested_recipient_user_id: 6,
      recipient_open_hours: 6,
      tasks_to_move: [
        { id: 4, title: "Code reviews backlog", estimated_hours: 6, complexity: 3 },
        { id: 5, title: "Onboard new intern", estimated_hours: 4, complexity: 2 },
      ],
    },
    {
      overloaded_user_id: 3,
      open_hours: 26,
      suggested_recipient_user_id: 5,
      recipient_open_hours: 8,
      tasks_to_move: [{ id: 9, title: "Quarterly report", estimated_hours: 5, complexity: 3 }],
    },
  ],
};

export const mockPolicyAnalytics: PolicyAnalytics = {
  source: "demo analytical store",
  turnover_rate: 12.4,
  avg_performance: 3.7,
  headcount: 128,
  active: 121,
};

export const mockOptimize: OptimizeResponse = {
  budget: 100000,
  budget_used: 83000,
  budget_remaining: 17000,
  magnitude: 5,
  expected_turnover_change: -5.6,
  expected_performance_change: 4.1,
  data_source: "demo analytical store",
  selected: [
    { policy_type: "flexible_hours", cost: 0, benefit: 4.7, reason: "zero cost — always beneficial", impact: { turnover_change: -2.8, performance_change: 1.9, cost_estimate: 0 } },
    { policy_type: "mentorship", cost: 8000, benefit: 2.2, reason: "best benefit/cost ratio within remaining budget", impact: { turnover_change: -0.9, performance_change: 1.3, cost_estimate: 8000 } },
    { policy_type: "training_budget", cost: 60000, benefit: 4.0, reason: "fits remaining budget with strong performance gain", impact: { turnover_change: -1.6, performance_change: 2.4, cost_estimate: 60000 } },
    { policy_type: "remote_work", cost: 15000, benefit: 2.9, reason: "affordable turnover reduction", impact: { turnover_change: -2.1, performance_change: 0.8, cost_estimate: 15000 } },
  ],
  skipped: [
    { policy_type: "salary_increase", cost: 180000, benefit: 4.7, reason: "exceeds remaining budget (17,000 left)", impact: { turnover_change: -3.5, performance_change: 1.2, cost_estimate: 180000 } },
  ],
};

export const mockSimHistory = {
  count: 3,
  simulations: [
    { id: "sim-3", created_at: "2026-07-12T14:00:00Z", scenario: { policy_type: "remote_work", magnitude: 5 }, result: { turnover_change: -1.5, performance_change: 0.1, cost_estimate: 15000 } },
    { id: "sim-2", created_at: "2026-07-11T10:30:00Z", scenario: { policy_type: "flexible_hours", magnitude: 7 }, result: { turnover_change: -2.8, performance_change: 1.9, cost_estimate: 0 } },
    { id: "sim-1", created_at: "2026-07-10T09:15:00Z", scenario: { policy_type: "training_budget", magnitude: 4 }, result: { turnover_change: -1.6, performance_change: 2.4, cost_estimate: 60000 } },
  ],
};

export const mockAppliedPolicies = {
  count: 2,
  tracked_count: 1,
  applied: [
    {
      applied_id: "app-2",
      policy_type: "flexible_hours",
      magnitude: 7,
      applied_at: "2026-06-15T09:00:00Z",
      source_simulation_id: "sim-2",
      predicted: { turnover_change: -2.8, performance_change: 1.9, cost_estimate: 0 },
      outcome: null,
      variance: null,
    },
    {
      applied_id: "app-1",
      policy_type: "training_budget",
      magnitude: 4,
      applied_at: "2026-04-02T09:00:00Z",
      source_simulation_id: "sim-1",
      predicted: { turnover_change: -1.6, performance_change: 2.4, cost_estimate: 60000 },
      outcome: { observed_turnover_change: -2.1, observed_cost: 54000, note: "Q2 attrition down more than modelled." },
      variance: { turnover_variance: -0.5, delivered: true, cost_variance: -6000 },
    },
  ],
};

export const mockPolicyOutcomesSummary = {
  applied_count: 5,
  tracked_count: 3,
  delivered_count: 2,
  delivered_rate: 0.67,
  by_policy_type: [
    { policy_type: "training_budget", applied: 2, tracked: 2, delivered: 2, delivered_rate: 1.0, avg_predicted_turnover: -1.6, avg_observed_turnover: -2.0, total_cost_variance: -8000 },
    { policy_type: "flexible_hours", applied: 2, tracked: 1, delivered: 0, delivered_rate: 0.0, avg_predicted_turnover: -2.8, avg_observed_turnover: -1.2, total_cost_variance: 0 },
    { policy_type: "salary_increase", applied: 1, tracked: 0, delivered: 0, delivered_rate: null, avg_predicted_turnover: null, avg_observed_turnover: null, total_cost_variance: null },
  ],
};

export const mockAiRecommendations: AiRecommendation[] = [
  { policy: "Flexible Hours 2.0", reason: "Directly addresses work-life balance signals with zero cost.", priority: "High", budget_estimate: "0 MAD", estimated_cost_mad: 0 },
  { policy: "Internal Mentorship Circles", reason: "Boosts growth perception for at-risk high performers.", priority: "High", budget_estimate: "5,000 MAD", estimated_cost_mad: 5000 },
  { policy: "Targeted L&D Vouchers", reason: "Closes the MLOps/K8s gaps highlighted by predictions.", priority: "Medium", budget_estimate: "45,000 MAD", estimated_cost_mad: 45000 },
  { policy: "Hybrid Office Revamp", reason: "Improves collaboration days attractiveness.", priority: "Medium", budget_estimate: "80,000 MAD", estimated_cost_mad: 80000 },
];

export const mockDepartments = [
  { id: 1, code: "ENG", name: "Engineering", description: "Product engineering & platform." },
  { id: 2, code: "DATA", name: "Data & AI", description: "Analytics, ML, data platform." },
  { id: 3, code: "HR", name: "Human Resources", description: "People operations." },
  { id: 4, code: "FIN", name: "Finance", description: "Accounting & controlling." },
  { id: 5, code: "SALES", name: "Sales", description: "Revenue & accounts." },
  { id: 6, code: "PROD", name: "Product", description: "Product management & design." },
];

export const mockSkillsCatalog = [
  { id: 1, name: "Kubernetes", code: "K8S", category: "tech", description: "Container orchestration.", is_active: true },
  { id: 2, name: "MLOps", code: "MLOPS", category: "tech", description: "ML deployment & monitoring.", is_active: true },
  { id: 3, name: "People Analytics", code: "PA", category: "business", description: "Data-driven HR.", is_active: true },
  { id: 4, name: "Negotiation", code: "NEG", category: "soft", description: "Deal-making.", is_active: true },
  { id: 5, name: "Financial Modelling", code: "FMOD", category: "business", description: "Forecasting & valuation.", is_active: false },
];

export const mockOrgChart = {
  headcount: 6,
  roots: [
    {
      id: 4, user_id: 4, name: "Mamadou Diallo", job_title: "HR Business Partner", department: "HR",
      reports: [],
    },
    {
      id: 1, user_id: 1, name: "Amina Karimi", job_title: "Engineering Manager", department: "ENG",
      reports: [
        { id: 2, user_id: 2, name: "Youssef Ben Ali", job_title: "Backend Engineer", department: "ENG", reports: [] },
        { id: 3, user_id: 3, name: "Sophie Leroy", job_title: "Data Scientist", department: "DATA", reports: [] },
      ],
    },
    {
      id: 5, user_id: 5, name: "Lucie Moreau", job_title: "Financial Analyst", department: "FIN",
      reports: [
        { id: 6, user_id: 6, name: "Omar Haddad", job_title: "Account Executive", department: "SALES", reports: [] },
      ],
    },
  ],
};

export const mockSkillMatrix = {
  department: "ALL",
  headcount: 24,
  skills: [
    { skill: "Python", skill_code: "PY", average_level: 3.4, evaluated_count: 12, coverage_percent: 50, average_target_gap: 0.3 },
    { skill: "SQL", skill_code: "SQL", average_level: 3.1, evaluated_count: 10, coverage_percent: 42, average_target_gap: 0.4 },
    { skill: "Kubernetes", skill_code: "K8S", average_level: 2.1, evaluated_count: 6, coverage_percent: 25, average_target_gap: 1.4 },
    { skill: "MLOps", skill_code: "MLOPS", average_level: 1.6, evaluated_count: 3, coverage_percent: 13, average_target_gap: 1.9 },
    { skill: "Communication", skill_code: "COMM", average_level: 3.6, evaluated_count: 14, coverage_percent: 58, average_target_gap: 0.1 },
    { skill: "People Analytics", skill_code: "PA", average_level: 2.2, evaluated_count: 4, coverage_percent: 17, average_target_gap: 1.1 },
    { skill: "Security Engineering", skill_code: "SEC", average_level: 2.4, evaluated_count: 3, coverage_percent: 13, average_target_gap: 1.2 },
    { skill: "Negotiation", skill_code: "NEG", average_level: 2.9, evaluated_count: 5, coverage_percent: 21, average_target_gap: 0.5 },
  ],
};

export function mockSearch(q: string) {
  const needle = q.toLowerCase();
  const all = [
    { type: "employee", id: 1, label: "Sara Idrissi", sublabel: "Backend Engineer", href: "/employees" },
    { type: "employee", id: 2, label: "Omar Benali", sublabel: "Data Scientist", href: "/employees" },
    { type: "employee", id: 3, label: "Nadia Alaoui", sublabel: "HR Business Partner", href: "/employees" },
    { type: "skill", id: 10, label: "Kubernetes", sublabel: "Skill", href: "/skill-gaps" },
    { type: "skill", id: 11, label: "Python", sublabel: "Skill", href: "/skill-gaps" },
    { type: "department", id: 20, label: "Engineering", sublabel: "Department · ENG", href: "/organization" },
    { type: "department", id: 21, label: "Data & AI", sublabel: "Department · DATA", href: "/organization" },
  ];
  return all.filter(
    (r) => r.label.toLowerCase().includes(needle) || r.sublabel.toLowerCase().includes(needle)
  );
}

export const mockAuditLog = {
  role_changes: [
    { id: 3, target_user_id: 12, target_email: "sara.idrissi@smarthr360.dev", actor_email: "admin@smarthr360.dev", old_role: "EMPLOYEE", new_role: "MANAGER", at: "2026-07-18T14:20:00Z" },
    { id: 2, target_user_id: 8, target_email: "yassine.alami@smarthr360.dev", actor_email: "admin@smarthr360.dev", old_role: "MANAGER", new_role: "HR", at: "2026-07-17T09:05:00Z" },
    { id: 1, target_user_id: 5, target_email: "nadia.benali@smarthr360.dev", actor_email: "admin@smarthr360.dev", old_role: "EMPLOYEE", new_role: "MANAGER", at: "2026-07-15T16:40:00Z" },
  ],
  login_events: [
    { username: "demo-employee", ip_address: "10.0.0.14", failures: 3, at: "2026-07-18T22:41:00Z" },
    { username: "unknown@corp.com", ip_address: "203.0.113.7", failures: 5, at: "2026-07-18T20:11:00Z" },
  ],
  counts: { role_changes: 3, login_events: 2 },
};

export const mockUsers = [
  { id: 1, email: "admin@demo.smarthr360.dev", username: "demo-admin", first_name: "Ada", last_name: "Admin", role: "ADMIN", email_verified_at: "2026-01-01T00:00:00Z" },
  { id: 2, email: "hr@demo.smarthr360.dev", username: "demo-hr", first_name: "Hind", last_name: "Haddad", role: "HR", email_verified_at: "2026-01-01T00:00:00Z" },
  { id: 3, email: "manager@demo.smarthr360.dev", username: "demo-manager", first_name: "Mounir", last_name: "Mansouri", role: "MANAGER", email_verified_at: "2026-01-01T00:00:00Z" },
  { id: 4, email: "employee@demo.smarthr360.dev", username: "demo-employee", first_name: "Youssef", last_name: "Ziani", role: "EMPLOYEE", email_verified_at: null },
  { id: 5, email: "s.leroy@smarthr360.dev", username: "sleroy", first_name: "Sophie", last_name: "Leroy", role: "EMPLOYEE", email_verified_at: "2026-02-11T00:00:00Z" },
];

export const mockTrainingRuns = [
  { id: 3, run_date: "2026-07-10T14:22:00Z", model_version: "v3.0", status: "COMPLETED", accuracy: 0.986, precision: 0.981, recall: 0.978, f1_score: 0.979, training_duration_seconds: 42, trained_by_username: "demo-hr" },
  { id: 2, run_date: "2026-06-28T09:15:00Z", model_version: "v2.1", status: "COMPLETED", accuracy: 0.964, precision: 0.959, recall: 0.951, f1_score: 0.955, training_duration_seconds: 38, trained_by_username: "demo-admin" },
  { id: 1, run_date: "2026-06-01T11:40:00Z", model_version: "v2.0", status: "COMPLETED", accuracy: 0.942, precision: 0.938, recall: 0.929, f1_score: 0.933, training_duration_seconds: 51, trained_by_username: "demo-admin" },
];

export const mockFuturePredictions: FutureSkillPrediction[] = [
  { id: 1, job_role: { id: 1, name: "Data Engineer", department: "DATA" }, skill: { id: 1, name: "MLOps", category: "Tech" }, horizon_years: 3, score: 92.4, level: "HIGH", rationale: "Strong market pull (LLM industrialisation) with low internal supply.", created_at: "2026-07-01T09:00:00Z" },
  { id: 2, job_role: { id: 2, name: "Backend Engineer", department: "ENG" }, skill: { id: 2, name: "Kubernetes", category: "Tech" }, horizon_years: 3, score: 87.1, level: "HIGH", rationale: "Platform consolidation trend across the sector.", created_at: "2026-07-01T09:00:00Z" },
  { id: 3, job_role: { id: 3, name: "HR Business Partner", department: "HR" }, skill: { id: 3, name: "People Analytics", category: "HR" }, horizon_years: 5, score: 78.9, level: "HIGH", rationale: "Data-driven HR decisions becoming baseline expectation.", created_at: "2026-07-01T09:00:00Z" },
  { id: 4, job_role: { id: 2, name: "Backend Engineer", department: "ENG" }, skill: { id: 4, name: "Rust", category: "Tech" }, horizon_years: 5, score: 61.3, level: "MEDIUM", rationale: "Growing but niche adoption in performance-critical services.", created_at: "2026-07-01T09:00:00Z" },
  { id: 5, job_role: { id: 4, name: "Financial Analyst", department: "FIN" }, skill: { id: 5, name: "Process Automation", category: "Business" }, horizon_years: 3, score: 55.0, level: "MEDIUM", rationale: "Steady automation of reporting workflows.", created_at: "2026-07-01T09:00:00Z" },
  { id: 6, job_role: { id: 5, name: "Account Executive", department: "SALES" }, skill: { id: 6, name: "Negotiation", category: "Soft" }, horizon_years: 3, score: 34.2, level: "LOW", rationale: "Stable demand, well covered internally.", created_at: "2026-07-01T09:00:00Z" },
];

export const mockMarketTrends: MarketTrend[] = [
  { id: 1, title: "LLM industrialisation wave", source_name: "World Economic Forum 2026", year: 2026, sector: "Tech", trend_score: 0.94, description: "Enterprises moving GenAI pilots to production, driving MLOps demand." },
  { id: 2, title: "Skills-based hiring", source_name: "LinkedIn Talent Report", year: 2025, sector: "HR", trend_score: 0.81, description: "Shift from degree-based to skills-based recruitment." },
  { id: 3, title: "Platform engineering consolidation", source_name: "Gartner", year: 2026, sector: "Tech", trend_score: 0.77, description: "Internal developer platforms become standard; Kubernetes expertise critical." },
  { id: 4, title: "Finance automation", source_name: "McKinsey Global Institute", year: 2025, sector: "Finance", trend_score: 0.63, description: "RPA + AI reshaping financial analysis roles." },
];

export const mockHrRecommendations: HRRecommendation[] = [
  { id: 1, skill: { id: 1, name: "MLOps" }, job_role: { id: 1, name: "Data Engineer" }, horizon_years: 3, priority_level: "HIGH", recommended_action: "Launch an intensive MLOps upskilling track for all Data Engineers; certify at least 60% within 12 months.", budget_hint: "≈ €40k (training + certification)", rationale: "Highest predicted gap; hiring externally is 3x more expensive than upskilling." },
  { id: 2, skill: { id: 2, name: "Kubernetes" }, job_role: { id: 2, name: "Backend Engineer" }, horizon_years: 3, priority_level: "HIGH", recommended_action: "Pair-rotation program with the platform team + 2 external hires senior level.", budget_hint: "≈ €120k (2 hires)", rationale: "Internal velocity too low to close the gap by training alone." },
  { id: 3, skill: { id: 3, name: "People Analytics" }, job_role: { id: 3, name: "HR Business Partner" }, horizon_years: 5, priority_level: "MEDIUM", recommended_action: "Embed a data analyst in the HR team and run quarterly analytics workshops.", budget_hint: "≈ €15k/year", rationale: "5-year horizon allows gradual capability building." },
];

export const mockEmployees: EmployeeProfile[] = [
  { id: 1, user: { user_id: 1, email: "a.karimi@smarthr360.dev", first_name: "Amina", last_name: "Karimi", role: "MANAGER" }, email: "a.karimi@smarthr360.dev", first_name: "Amina", last_name: "Karimi", user_role: "MANAGER", department: { id: 1, code: "ENG", name: "Engineering" }, job_title: "Engineering Manager", employment_type: "FULL_TIME", hire_date: "2021-03-15", phone_number: "", is_active: true },
  { id: 2, user: { user_id: 2, email: "y.benali@smarthr360.dev", first_name: "Youssef", last_name: "Ben Ali", role: "EMPLOYEE" }, email: "y.benali@smarthr360.dev", first_name: "Youssef", last_name: "Ben Ali", user_role: "EMPLOYEE", department: { id: 1, code: "ENG", name: "Engineering" }, job_title: "Backend Engineer", employment_type: "FULL_TIME", hire_date: "2022-09-01", phone_number: "", is_active: true },
  { id: 3, user: { user_id: 3, email: "s.leroy@smarthr360.dev", first_name: "Sophie", last_name: "Leroy", role: "EMPLOYEE" }, email: "s.leroy@smarthr360.dev", first_name: "Sophie", last_name: "Leroy", user_role: "EMPLOYEE", department: { id: 2, code: "DATA", name: "Data & AI" }, job_title: "Data Scientist", employment_type: "FULL_TIME", hire_date: "2023-01-10", phone_number: "", is_active: true },
  { id: 4, user: { user_id: 4, email: "m.diallo@smarthr360.dev", first_name: "Mamadou", last_name: "Diallo", role: "HR" }, email: "m.diallo@smarthr360.dev", first_name: "Mamadou", last_name: "Diallo", user_role: "HR", department: { id: 3, code: "HR", name: "Human Resources" }, job_title: "HR Business Partner", employment_type: "FULL_TIME", hire_date: "2020-06-22", phone_number: "", is_active: true },
  { id: 5, user: { user_id: 5, email: "l.moreau@smarthr360.dev", first_name: "Lucie", last_name: "Moreau", role: "EMPLOYEE" }, email: "l.moreau@smarthr360.dev", first_name: "Lucie", last_name: "Moreau", user_role: "EMPLOYEE", department: { id: 4, code: "FIN", name: "Finance" }, job_title: "Financial Analyst", employment_type: "PART_TIME", hire_date: "2023-11-05", phone_number: "", is_active: true },
  { id: 6, user: { user_id: 6, email: "o.haddad@smarthr360.dev", first_name: "Omar", last_name: "Haddad", role: "EMPLOYEE" }, email: "o.haddad@smarthr360.dev", first_name: "Omar", last_name: "Haddad", user_role: "EMPLOYEE", department: { id: 5, code: "SALES", name: "Sales" }, job_title: "Account Executive", employment_type: "FULL_TIME", hire_date: "2022-04-18", phone_number: "", is_active: false },
];

/* ---------------- HR-Open interop (read-only) ---------------- */

export const mockInteropCompetencyDefs: InteropCompetencyDefinition[] = [
  { type: "CompetencyDefinition", id: "K8S", competencyId: "K8S", name: "Kubernetes", description: "Container orchestration, cluster ops, Helm, operators.", competencyCategory: "Platform", active: true, taxonomyId: "SMARTHR360-SKILLS", taxonomy: { id: "SMARTHR360-SKILLS", name: "SmartHR360 Skill Catalog" } },
  { type: "CompetencyDefinition", id: "MLOPS", competencyId: "MLOPS", name: "MLOps", description: "Model training pipelines, deployment, monitoring, drift.", competencyCategory: "Data & AI", active: true, taxonomyId: "SMARTHR360-SKILLS", taxonomy: { id: "SMARTHR360-SKILLS", name: "SmartHR360 Skill Catalog" } },
  { type: "CompetencyDefinition", id: "PY", competencyId: "PY", name: "Python", description: "Idiomatic Python, testing, packaging, async.", competencyCategory: "Engineering", active: true, taxonomyId: "SMARTHR360-SKILLS", taxonomy: { id: "SMARTHR360-SKILLS", name: "SmartHR360 Skill Catalog" } },
  { type: "CompetencyDefinition", id: "PA", competencyId: "PA", name: "People Analytics", description: "HR metrics, statistical analysis, workforce modelling.", competencyCategory: "HR", active: true, taxonomyId: "SMARTHR360-SKILLS", taxonomy: { id: "SMARTHR360-SKILLS", name: "SmartHR360 Skill Catalog" } },
];

export const mockInteropPersonCompetencies: InteropPersonCompetency[] = [
  { type: "PersonCompetency", id: "EMPSKILL-1", person: { id: 1, employeeId: "EMP-001", name: "Amina Karimi", departmentCode: "ENG", jobTitle: "Engineering Manager" }, competency: { id: "K8S", competencyId: "K8S", name: "Kubernetes", category: "Platform" }, competencyDimensions: [{ score: { value: 3, maximumValue: 4, name: "Advanced", scaleId: "SMARTHR360-PROFICIENCY-1-4" }, targetValue: 4, targetGap: 1 }], effectiveDateRange: { startDate: "2026-05-02T09:00:00+00:00", endDate: null } },
  { type: "PersonCompetency", id: "EMPSKILL-2", person: { id: 3, employeeId: "EMP-003", name: "Sophie Leroy", departmentCode: "DATA", jobTitle: "Data Scientist" }, competency: { id: "MLOPS", competencyId: "MLOPS", name: "MLOps", category: "Data & AI" }, competencyDimensions: [{ score: { value: 2, maximumValue: 4, name: "Intermediate", scaleId: "SMARTHR360-PROFICIENCY-1-4" }, targetValue: 4, targetGap: 2 }], effectiveDateRange: { startDate: "2026-04-18T09:00:00+00:00", endDate: null } },
  { type: "PersonCompetency", id: "EMPSKILL-3", person: { id: 2, employeeId: "EMP-002", name: "Youssef Ben Ali", departmentCode: "ENG", jobTitle: "Backend Engineer" }, competency: { id: "PY", competencyId: "PY", name: "Python", category: "Engineering" }, competencyDimensions: [{ score: { value: 4, maximumValue: 4, name: "Expert", scaleId: "SMARTHR360-PROFICIENCY-1-4" }, targetValue: 4, targetGap: 0 }], effectiveDateRange: { startDate: "2026-05-11T09:00:00+00:00", endDate: null } },
];

export const mockEconomicReports: EconomicReport[] = [
  { id: 1, title: "IT unemployment rate — national", source_name: "HCP / World Bank", year: 2026, indicator: "IT unemployment rate", value: 4.2, sector: "Tech", created_at: "2026-02-11T00:00:00Z" },
  { id: 2, title: "AI investment as % of GDP", source_name: "World Economic Forum", year: 2026, indicator: "AI investment / GDP", value: 1.8, sector: "Tech", created_at: "2026-01-20T00:00:00Z" },
  { id: 3, title: "Digital skills demand index", source_name: "LinkedIn Economic Graph", year: 2025, indicator: "Digital skills demand index", value: 132.5, sector: "Cross-sector", created_at: "2025-11-05T00:00:00Z" },
  { id: 4, title: "Finance automation adoption", source_name: "McKinsey Global Institute", year: 2025, indicator: "Automation adoption rate", value: 37.0, sector: "Finance", created_at: "2025-09-30T00:00:00Z" },
  { id: 5, title: "Green-tech hiring growth", source_name: "IMF", year: 2026, indicator: "Green-tech hiring YoY", value: 12.4, sector: "Energy", created_at: "2026-03-02T00:00:00Z" },
];

export const mockServiceMetrics: ServiceMetrics = {
  timestamp: "2026-07-13T12:00:00Z",
  system: { platform: "Linux-6.1-aarch64", python_version: "3.12.4", cpu_count: "aarch64" },
  database: { status: "connected", engine: "django.db.backends.postgresql", table_count: 42 },
  cache: { status: "available", backend: "django_redis.cache.RedisCache" },
  api: {
    models: { skills: 14, job_roles: 8, predictions: 96, employees: 27 },
    rate_limits: { anon: "100/hour", user: "1000/hour", burst: "60/min", sustained: "1000/day" },
  },
};

export const mockDriftStatus = {
  status: "STABLE" as const,
  delta: 4.2,
  mean_score: 71.4,
  previous_mean_score: 67.2,
  sample_size: 96,
  distribution: { low: 18, medium: 43, high: 35 },
  last_run_id: 12,
  last_run_at: "2026-07-13T11:58:00Z",
};

export const mockTrainingActions = [
  { id: 1, title: "Kubernetes CKA certification", provider: "Linux Foundation", skill: { id: 1, name: "Kubernetes", code: "K8S" }, department: { id: 1, name: "Engineering" }, employee: null, owner_user_id: 4, target_level: 4, due_date: "2026-09-30", budget: "1200.00", status: "IN_PROGRESS" as const, progress_percent: 45, notes: "", created_at: "2026-06-01T00:00:00Z", updated_at: "2026-07-01T00:00:00Z" },
  { id: 2, title: "MLOps foundations track", provider: "Coursera", skill: { id: 2, name: "MLOps", code: "MLOPS" }, department: { id: 2, name: "Data & AI" }, employee: null, owner_user_id: 4, target_level: 3, due_date: "2026-10-15", budget: "800.00", status: "PLANNED" as const, progress_percent: 0, notes: "", created_at: "2026-06-10T00:00:00Z", updated_at: "2026-06-10T00:00:00Z" },
  { id: 3, title: "People Analytics workshop", provider: "Internal L&D", skill: { id: 3, name: "People Analytics", code: "PA" }, department: { id: 3, name: "Human Resources" }, employee: null, owner_user_id: 4, target_level: 3, due_date: "2026-08-01", budget: "0.00", status: "COMPLETED" as const, progress_percent: 100, notes: "", created_at: "2026-05-01T00:00:00Z", updated_at: "2026-07-10T00:00:00Z" },
];

export const mockRetentionRoi = {
  assumptions: { avg_replacement_cost: 45000, action_cost: 5000, action_effectiveness: 0.4 },
  forward: {
    total_exposure: 129150,
    at_risk_count: 3,
    at_risk_exposure: 101250,
    potential_savings: 25500,
    by_level: [
      { level: "HIGH", count: 2, exposure: 61650 },
      { level: "CRITICAL", count: 1, exposure: 39600 },
      { level: "MEDIUM", count: 1, exposure: 19800 },
      { level: "LOW", count: 1, exposure: 8100 },
    ],
  },
  realized: { actions_with_outcome: 3, retained: 2, retention_rate: 0.67, realized_savings: 80000 },
};

export const mockPolicyEmployees: PolicyEmployee[] = [
  { id: "emp-1", name: "Amina Karimi", employee_number: "EMP-001", email: "a.karimi@smarthr360.dev", department: "Engineering", job_title: "Engineering Manager", status: "active" },
  { id: "emp-2", name: "Youssef Ben Ali", employee_number: "EMP-002", email: "y.benali@smarthr360.dev", department: "Engineering", job_title: "Backend Engineer", status: "active" },
  { id: "emp-3", name: "Sophie Leroy", employee_number: "EMP-003", email: "s.leroy@smarthr360.dev", department: "Data & AI", job_title: "Data Scientist", status: "active" },
  { id: "emp-4", name: "Mamadou Diallo", employee_number: "EMP-004", email: "m.diallo@smarthr360.dev", department: "Human Resources", job_title: "HR Business Partner", status: "active" },
];

export const mockPolicyDocTemplates: PolicyDocTemplate[] = [
  { policy_type: "remote_work", title: "Remote Work Policy" },
  { policy_type: "flexible_hours", title: "Flexible Working Hours Policy" },
  { policy_type: "training_budget", title: "Training & Development Budget Policy" },
  { policy_type: "wellness_program", title: "Employee Wellness Programme" },
];

export const mockInteropPositionModels: InteropPositionModel[] = [
  { type: "PositionCompetencyModel", id: "ORGUNIT-ENG", orgUnit: { departmentCode: "ENG" }, headcount: 8, competencies: [
    { competency: { id: "PY", name: "Python" }, expectedProficiency: { averageValue: 3.2, maximumValue: 4, scaleId: "SMARTHR360-PROFICIENCY-1-4" }, assessedHeadcount: 8, coveragePercent: 100, averageTargetGap: 0.4 },
    { competency: { id: "K8S", name: "Kubernetes" }, expectedProficiency: { averageValue: 2.1, maximumValue: 4, scaleId: "SMARTHR360-PROFICIENCY-1-4" }, assessedHeadcount: 6, coveragePercent: 75, averageTargetGap: 1.4 },
  ] },
  { type: "PositionCompetencyModel", id: "ORGUNIT-DATA", orgUnit: { departmentCode: "DATA" }, headcount: 4, competencies: [
    { competency: { id: "MLOPS", name: "MLOps" }, expectedProficiency: { averageValue: 1.8, maximumValue: 4, scaleId: "SMARTHR360-PROFICIENCY-1-4" }, assessedHeadcount: 3, coveragePercent: 75, averageTargetGap: 1.2 },
  ] },
];
