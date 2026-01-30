import {
  pgSchema,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  numeric,
  index,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Create the forge schema (separate from public)
export const forgeSchema = pgSchema("forge");

// =============================================================================
// ENUMS
// =============================================================================

export const forgeTicketStatusEnum = forgeSchema.enum("ticket_status", [
  "backlog",
  "design",
  "planned",
  "in_progress",
  "in_review",
  "testing",
  "done",
  "blocked",
]);

export const forgeTicketPriorityEnum = forgeSchema.enum("ticket_priority", [
  "critical",
  "high",
  "medium",
  "low",
]);

export const forgeTicketTypeEnum = forgeSchema.enum("ticket_type", [
  "feature",
  "bug",
  "chore",
  "refactor",
  "docs",
  "spike",
  "design",
]);

export const forgeAgentProtocolEnum = forgeSchema.enum("agent_protocol", [
  "opus_full_feature",
  "opus_architecture",
  "opus_planning",
  "sonnet_implementation",
  "sonnet_bug_fix",
  "sonnet_tests",
  "haiku_quick_edit",
  "haiku_docs",
]);

export const forgeTicketPhaseEnum = forgeSchema.enum("ticket_phase", [
  "ideation",
  "design",
  "planning",
  "implementation",
  "testing",
  "deployment",
  "documentation",
]);

export const forgeReleaseClassificationEnum = forgeSchema.enum(
  "release_classification",
  ["feature", "enhancement", "breaking_change", "bug_fix", "chore", "docs"]
);

export const forgeExecutionStatusEnum = forgeSchema.enum("execution_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "paused",
]);

export const forgeLockTypeEnum = forgeSchema.enum("lock_type", [
  "exclusive",
  "shared",
]);

export const forgeDeploymentEnvironmentEnum = forgeSchema.enum(
  "deployment_environment",
  ["preview", "staging", "production"]
);

export const forgeDeploymentStatusEnum = forgeSchema.enum("deployment_status", [
  "pending",
  "building",
  "deployed",
  "failed",
]);

export const forgeCommentAuthorTypeEnum = forgeSchema.enum(
  "comment_author_type",
  ["user", "agent", "system"]
);

export const forgeReferenceTypeEnum = forgeSchema.enum("reference_type", [
  "design",
  "inspiration",
  "screenshot",
  "figma",
  "ai_studio",
  "chrome_capture",
]);

export const forgeRegistryTypeEnum = forgeSchema.enum("registry_type", [
  "component",
  "hook",
  "utility",
  "api",
  "table",
  "integration",
]);

export const forgeRegistryStatusEnum = forgeSchema.enum("registry_status", [
  "active",
  "deprecated",
  "planned",
]);

export const forgeDecisionCategoryEnum = forgeSchema.enum("decision_category", [
  "code_standards",
  "architecture",
  "testing",
  "design",
  "process",
  "tooling",
  "product",
  "performance",
]);

export const forgePersonaArchetypeEnum = forgeSchema.enum("persona_archetype", [
  "explorer",
  "starting",
  "building",
  "optimizing",
]);

export const forgeMilestoneStatusEnum = forgeSchema.enum("milestone_status", [
  "active",
  "completed",
  "archived",
]);

export const forgeTrendEnum = forgeSchema.enum("trend", [
  "improving",
  "declining",
  "stable",
]);

// =============================================================================
// TABLES
// =============================================================================

// Milestones (Feature Sets)
export const forgeMilestones = forgeSchema.table("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  targetDate: date("target_date"),
  status: forgeMilestoneStatusEnum("status").default("active"),
  progressPercent: integer("progress_percent").default(0),
  color: text("color").default("#6366f1"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects (grouping)
export const forgeProjects = forgeSchema.table("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  icon: text("icon").default("folder"),
  milestoneId: uuid("milestone_id").references(() => forgeMilestones.id),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tickets
export const forgeTickets = forgeSchema.table(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Identity
    identifier: text("identifier").notNull().unique(), // AXO-42
    title: text("title").notNull(),
    description: text("description"),

    // Status & Organization
    status: forgeTicketStatusEnum("status").default("backlog"),
    priority: forgeTicketPriorityEnum("priority").default("medium"),
    type: forgeTicketTypeEnum("type").default("feature"),
    phase: forgeTicketPhaseEnum("phase").default("planning"),
    releaseClassification:
      forgeReleaseClassificationEnum("release_classification").default(
        "feature"
      ),

    // Hierarchy
    parentId: uuid("parent_id"),
    projectId: uuid("project_id").references(() => forgeProjects.id),
    milestoneId: uuid("milestone_id").references(() => forgeMilestones.id),

    // Ordering
    statusOrder: integer("status_order").default(0),

    // Estimation
    estimate: integer("estimate"), // story points

    // Phase Workflow
    currentPhase: forgeTicketPhaseEnum("current_phase").default("planning"),

    // Agent Assignment
    assignedAgent: forgeAgentProtocolEnum("assigned_agent"),
    agentSessionId: uuid("agent_session_id"),

    // Agent Execution History
    lastExecutionId: uuid("last_execution_id"),
    executionHistory: jsonb("execution_history").$type<Array<{
      executionId: string;
      protocol: string;
      status: "completed" | "failed";
      summary: string;
      completedAt: string;
      tokensUsed?: number;
      filesChanged?: string[];
    }>>(),

    // Git Integration
    branchName: text("branch_name"),
    previewUrl: text("preview_url"),
    prNumber: integer("pr_number"),
    prUrl: text("pr_url"),

    // Release Management
    isBreakingChange: boolean("is_breaking_change").default(false),
    migrationNotes: text("migration_notes"),
    blocksDeploy: boolean("blocks_deploy").default(false),

    // Metadata
    labels: text("labels").array(),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    statusIdx: index("idx_forge_tickets_status").on(table.status),
    parentIdx: index("idx_forge_tickets_parent").on(table.parentId),
    milestoneIdx: index("idx_forge_tickets_milestone").on(table.milestoneId),
    identifierIdx: index("idx_forge_tickets_identifier").on(table.identifier),
  })
);

// Subtasks (lightweight sub-items)
export const forgeSubtasks = forgeSchema.table("subtasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => forgeTickets.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  sortOrder: integer("sort_order").default(0),
  branchName: text("branch_name"),
  prNumber: integer("pr_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// References (design links, screenshots, inspiration)
export const forgeReferences = forgeSchema.table("references", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => forgeTickets.id, { onDelete: "cascade" }),
  type: forgeReferenceTypeEnum("type").notNull(),
  url: text("url"),
  title: text("title"),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  metadata: jsonb("metadata"), // element selector, dimensions, etc for chrome captures
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agent Executions
export const forgeAgentExecutions = forgeSchema.table(
  "agent_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => forgeTickets.id),
    protocol: forgeAgentProtocolEnum("protocol").notNull(),
    status: forgeExecutionStatusEnum("status").notNull().default("pending"),

    // Execution Context
    prompt: text("prompt").notNull(),
    planOutput: text("plan_output"),
    executionLog: text("execution_log"),

    // Checkpoints for long tasks
    checkpointData: jsonb("checkpoint_data"),
    checkpointStep: integer("checkpoint_step"),

    // Results
    branchCreated: text("branch_created"),
    filesChanged: text("files_changed").array(),
    prUrl: text("pr_url"),

    // Metrics
    tokensUsed: integer("tokens_used"),
    costCents: integer("cost_cents"),
    durationMs: integer("duration_ms"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    ticketIdx: index("idx_forge_executions_ticket").on(table.ticketId),
    statusIdx: index("idx_forge_executions_status").on(table.status),
  })
);

// File Locks (prevent conflicts)
export const forgeFileLocks = forgeSchema.table(
  "file_locks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    filePath: text("file_path").notNull(),
    lockedByTicketId: uuid("locked_by_ticket_id")
      .notNull()
      .references(() => forgeTickets.id),
    lockedAt: timestamp("locked_at").defaultNow().notNull(),
    expectedRelease: timestamp("expected_release"),
    lockType: forgeLockTypeEnum("lock_type").default("exclusive"),
  },
  (table) => ({
    pathIdx: index("idx_forge_file_locks_path").on(table.filePath),
    uniqueFileLock: unique("unique_forge_file_lock").on(
      table.filePath,
      table.lockType
    ),
  })
);

// Token Usage Tracking
export const forgeTokenUsage = forgeSchema.table(
  "token_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id").references(() => forgeAgentExecutions.id),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    costCents: integer("cost_cents").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: index("idx_forge_token_usage_date").on(table.createdAt),
  })
);

// Daily Token Budget
export const forgeTokenBudgets = forgeSchema.table("token_budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull().unique(),
  dailyLimitTokens: integer("daily_limit_tokens").default(500000),
  dailyLimitCents: integer("daily_limit_cents").default(500), // $5
  usedTokens: integer("used_tokens").default(0),
  usedCents: integer("used_cents").default(0),
  autopilotLimitTokens: integer("autopilot_limit_tokens").default(100000),
  autopilotUsedTokens: integer("autopilot_used_tokens").default(0),
});

// Registry (codebase knowledge)
export const forgeRegistry = forgeSchema.table(
  "registry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: forgeRegistryTypeEnum("type").notNull(),
    name: text("name").notNull(),
    filePath: text("file_path").notNull(),
    description: text("description"),
    status: forgeRegistryStatusEnum("status").default("active"),
    exports: text("exports").array(), // exported function/component names
    dependencies: text("dependencies").array(), // other registry item IDs
    usedBy: text("used_by").array(), // registry items that depend on this
    tags: text("tags").array(),
    deprecatedBy: uuid("deprecated_by"),
    deprecationNotes: text("deprecation_notes"),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
    relatedTickets: text("related_tickets").array(), // ticket identifiers that touched this
  },
  (table) => ({
    typeIdx: index("idx_forge_registry_type").on(table.type),
    uniqueRegistry: unique("unique_forge_registry").on(table.type, table.name),
  })
);

// Decision Ledger
export const forgeDecisions = forgeSchema.table(
  "decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull().unique(), // DEC-001
    decision: text("decision").notNull(),
    context: text("context"), // why this was decided
    category: forgeDecisionCategoryEnum("category").notNull(),
    scope: text("scope").array(), // tags for matching: api, validation, hooks, etc
    active: boolean("active").default(true),
    supersedes: uuid("supersedes"),
    createdFromTicket: text("created_from_ticket"), // ticket identifier
    complianceRate: numeric("compliance_rate", { precision: 5, scale: 2 }), // percentage
    timesApplied: integer("times_applied").default(0),
    timesOverridden: integer("times_overridden").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("idx_forge_decisions_category").on(table.category),
    activeIdx: index("idx_forge_decisions_active").on(table.active),
  })
);

// Decision Applications (tracking where decisions were applied)
export const forgeDecisionApplications = forgeSchema.table(
  "decision_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    decisionId: uuid("decision_id")
      .notNull()
      .references(() => forgeDecisions.id),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => forgeTickets.id),
    wasCompliant: boolean("was_compliant").notNull(),
    overrideReason: text("override_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

// Ticket Comments
export const forgeTicketComments = forgeSchema.table("ticket_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => forgeTickets.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorType: forgeCommentAuthorTypeEnum("author_type").notNull(),
  authorName: text("author_name"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Test Personas
export const forgeTestPersonas = forgeSchema.table("test_personas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  archetype: forgePersonaArchetypeEnum("archetype").notNull(),
  description: text("description"),
  dataCompleteness: integer("data_completeness"), // 0-100
  config: jsonb("config").notNull(), // full persona configuration
  edgeCases: text("edge_cases").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// GitHub Releases (synced from GitHub)
export const forgeReleases = forgeSchema.table("releases", {
  id: uuid("id").primaryKey().defaultRandom(),
  tag: text("tag").notNull().unique(),
  name: text("name"),
  body: text("body"),
  ticketsIncluded: text("tickets_included").array(), // ticket identifiers
  breakingChanges: text("breaking_changes").array(),
  isRollback: boolean("is_rollback").default(false),
  rollbackOf: text("rollback_of"), // tag this rolled back
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deployments
export const forgeDeployments = forgeSchema.table("deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  environment: forgeDeploymentEnvironmentEnum("environment").notNull(),
  releaseTag: text("release_tag"),
  ticketId: uuid("ticket_id").references(() => forgeTickets.id), // for preview deploys
  previewUrl: text("preview_url"),
  status: forgeDeploymentStatusEnum("status").notNull(),
  triggeredBy: text("triggered_by"), // user, autopilot, merge
  durationMs: integer("duration_ms"),
  rollbackReason: text("rollback_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Success Metrics
export const forgeSuccessMetrics = forgeSchema.table(
  "success_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    metricName: text("metric_name").notNull(),
    currentValue: numeric("current_value", { precision: 10, scale: 2 }),
    baselineValue: numeric("baseline_value", { precision: 10, scale: 2 }),
    targetValue: numeric("target_value", { precision: 10, scale: 2 }),
    trend: forgeTrendEnum("trend"),
    lastCalculated: timestamp("last_calculated").defaultNow().notNull(),
  },
  (table) => ({
    uniqueMetric: unique("unique_forge_metric").on(table.metricName),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const forgeMilestonesRelations = relations(
  forgeMilestones,
  ({ many }) => ({
    projects: many(forgeProjects),
    tickets: many(forgeTickets),
  })
);

export const forgeProjectsRelations = relations(
  forgeProjects,
  ({ one, many }) => ({
    milestone: one(forgeMilestones, {
      fields: [forgeProjects.milestoneId],
      references: [forgeMilestones.id],
    }),
    tickets: many(forgeTickets),
  })
);

export const forgeTicketsRelations = relations(
  forgeTickets,
  ({ one, many }) => ({
    parent: one(forgeTickets, {
      fields: [forgeTickets.parentId],
      references: [forgeTickets.id],
      relationName: "ticketHierarchy",
    }),
    children: many(forgeTickets, {
      relationName: "ticketHierarchy",
    }),
    project: one(forgeProjects, {
      fields: [forgeTickets.projectId],
      references: [forgeProjects.id],
    }),
    milestone: one(forgeMilestones, {
      fields: [forgeTickets.milestoneId],
      references: [forgeMilestones.id],
    }),
    subtasks: many(forgeSubtasks),
    references: many(forgeReferences),
    executions: many(forgeAgentExecutions),
    comments: many(forgeTicketComments),
    fileLocks: many(forgeFileLocks),
    decisionApplications: many(forgeDecisionApplications),
    deployments: many(forgeDeployments),
  })
);

export const forgeSubtasksRelations = relations(forgeSubtasks, ({ one }) => ({
  ticket: one(forgeTickets, {
    fields: [forgeSubtasks.ticketId],
    references: [forgeTickets.id],
  }),
}));

export const forgeReferencesRelations = relations(
  forgeReferences,
  ({ one }) => ({
    ticket: one(forgeTickets, {
      fields: [forgeReferences.ticketId],
      references: [forgeTickets.id],
    }),
  })
);

export const forgeAgentExecutionsRelations = relations(
  forgeAgentExecutions,
  ({ one, many }) => ({
    ticket: one(forgeTickets, {
      fields: [forgeAgentExecutions.ticketId],
      references: [forgeTickets.id],
    }),
    tokenUsage: many(forgeTokenUsage),
  })
);

export const forgeFileLocksRelations = relations(forgeFileLocks, ({ one }) => ({
  ticket: one(forgeTickets, {
    fields: [forgeFileLocks.lockedByTicketId],
    references: [forgeTickets.id],
  }),
}));

export const forgeTokenUsageRelations = relations(
  forgeTokenUsage,
  ({ one }) => ({
    execution: one(forgeAgentExecutions, {
      fields: [forgeTokenUsage.executionId],
      references: [forgeAgentExecutions.id],
    }),
  })
);

export const forgeRegistryRelations = relations(forgeRegistry, ({ one }) => ({
  deprecatedByItem: one(forgeRegistry, {
    fields: [forgeRegistry.deprecatedBy],
    references: [forgeRegistry.id],
    relationName: "registryDeprecation",
  }),
}));

export const forgeDecisionsRelations = relations(
  forgeDecisions,
  ({ one, many }) => ({
    supersededDecision: one(forgeDecisions, {
      fields: [forgeDecisions.supersedes],
      references: [forgeDecisions.id],
      relationName: "decisionSupersession",
    }),
    applications: many(forgeDecisionApplications),
  })
);

export const forgeDecisionApplicationsRelations = relations(
  forgeDecisionApplications,
  ({ one }) => ({
    decision: one(forgeDecisions, {
      fields: [forgeDecisionApplications.decisionId],
      references: [forgeDecisions.id],
    }),
    ticket: one(forgeTickets, {
      fields: [forgeDecisionApplications.ticketId],
      references: [forgeTickets.id],
    }),
  })
);

export const forgeTicketCommentsRelations = relations(
  forgeTicketComments,
  ({ one }) => ({
    ticket: one(forgeTickets, {
      fields: [forgeTicketComments.ticketId],
      references: [forgeTickets.id],
    }),
  })
);

export const forgeDeploymentsRelations = relations(
  forgeDeployments,
  ({ one }) => ({
    ticket: one(forgeTickets, {
      fields: [forgeDeployments.ticketId],
      references: [forgeTickets.id],
    }),
  })
);
