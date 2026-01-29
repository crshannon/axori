-- Migration: Add Forge schema for AI-powered development workflow engine
-- Creates separate 'forge' schema with all tables for ticket management,
-- agent executions, token budgets, and codebase registry

-- Create the forge schema
CREATE SCHEMA IF NOT EXISTS "forge";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE "forge"."ticket_status" AS ENUM (
  'backlog', 'design', 'planned', 'in_progress', 'in_review', 'testing', 'done', 'blocked'
);

CREATE TYPE "forge"."ticket_priority" AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE "forge"."ticket_type" AS ENUM (
  'feature', 'bug', 'chore', 'refactor', 'docs', 'spike', 'design'
);

CREATE TYPE "forge"."agent_protocol" AS ENUM (
  'opus_full_feature', 'opus_architecture', 'opus_planning',
  'sonnet_implementation', 'sonnet_bug_fix', 'sonnet_tests',
  'haiku_quick_edit', 'haiku_docs'
);

CREATE TYPE "forge"."ticket_phase" AS ENUM (
  'ideation', 'design', 'planning', 'implementation', 'testing', 'deployment', 'documentation'
);

CREATE TYPE "forge"."release_classification" AS ENUM (
  'feature', 'enhancement', 'breaking_change', 'bug_fix', 'chore', 'docs'
);

CREATE TYPE "forge"."execution_status" AS ENUM ('pending', 'running', 'completed', 'failed', 'paused');

CREATE TYPE "forge"."lock_type" AS ENUM ('exclusive', 'shared');

CREATE TYPE "forge"."deployment_environment" AS ENUM ('preview', 'staging', 'production');

CREATE TYPE "forge"."deployment_status" AS ENUM ('pending', 'building', 'deployed', 'failed');

CREATE TYPE "forge"."comment_author_type" AS ENUM ('user', 'agent', 'system');

CREATE TYPE "forge"."reference_type" AS ENUM (
  'design', 'inspiration', 'screenshot', 'figma', 'ai_studio', 'chrome_capture'
);

CREATE TYPE "forge"."registry_type" AS ENUM (
  'component', 'hook', 'utility', 'api', 'table', 'integration'
);

CREATE TYPE "forge"."registry_status" AS ENUM ('active', 'deprecated', 'planned');

CREATE TYPE "forge"."decision_category" AS ENUM (
  'code_standards', 'architecture', 'testing', 'design', 'process', 'tooling', 'product', 'performance'
);

CREATE TYPE "forge"."persona_archetype" AS ENUM ('explorer', 'starting', 'building', 'optimizing');

CREATE TYPE "forge"."milestone_status" AS ENUM ('active', 'completed', 'archived');

CREATE TYPE "forge"."trend" AS ENUM ('improving', 'declining', 'stable');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Milestones (Feature Sets)
CREATE TABLE "forge"."milestones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "target_date" date,
  "status" "forge"."milestone_status" DEFAULT 'active',
  "progress_percent" integer DEFAULT 0,
  "color" text DEFAULT '#6366f1',
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Projects (grouping)
CREATE TABLE "forge"."projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "color" text DEFAULT '#6366f1',
  "icon" text DEFAULT 'folder',
  "milestone_id" uuid REFERENCES "forge"."milestones"("id"),
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Tickets
CREATE TABLE "forge"."tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "identifier" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "description" text,
  "status" "forge"."ticket_status" DEFAULT 'backlog',
  "priority" "forge"."ticket_priority" DEFAULT 'medium',
  "type" "forge"."ticket_type" DEFAULT 'feature',
  "phase" "forge"."ticket_phase" DEFAULT 'planning',
  "release_classification" "forge"."release_classification" DEFAULT 'feature',
  "parent_id" uuid,
  "project_id" uuid REFERENCES "forge"."projects"("id"),
  "milestone_id" uuid REFERENCES "forge"."milestones"("id"),
  "status_order" integer DEFAULT 0,
  "estimate" integer,
  "current_phase" "forge"."ticket_phase" DEFAULT 'planning',
  "assigned_agent" "forge"."agent_protocol",
  "agent_session_id" uuid,
  "branch_name" text,
  "preview_url" text,
  "pr_number" integer,
  "pr_url" text,
  "is_breaking_change" boolean DEFAULT false,
  "migration_notes" text,
  "blocks_deploy" boolean DEFAULT false,
  "labels" text[],
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "started_at" timestamp,
  "completed_at" timestamp
);

CREATE INDEX "idx_forge_tickets_status" ON "forge"."tickets" ("status");
CREATE INDEX "idx_forge_tickets_parent" ON "forge"."tickets" ("parent_id");
CREATE INDEX "idx_forge_tickets_milestone" ON "forge"."tickets" ("milestone_id");
CREATE INDEX "idx_forge_tickets_identifier" ON "forge"."tickets" ("identifier");

-- Subtasks
CREATE TABLE "forge"."subtasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" uuid NOT NULL REFERENCES "forge"."tickets"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "completed" boolean DEFAULT false,
  "sort_order" integer DEFAULT 0,
  "branch_name" text,
  "pr_number" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

-- References
CREATE TABLE "forge"."references" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" uuid NOT NULL REFERENCES "forge"."tickets"("id") ON DELETE CASCADE,
  "type" "forge"."reference_type" NOT NULL,
  "url" text,
  "title" text,
  "description" text,
  "thumbnail_url" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Agent Executions
CREATE TABLE "forge"."agent_executions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" uuid NOT NULL REFERENCES "forge"."tickets"("id"),
  "protocol" "forge"."agent_protocol" NOT NULL,
  "status" "forge"."execution_status" NOT NULL DEFAULT 'pending',
  "prompt" text NOT NULL,
  "plan_output" text,
  "execution_log" text,
  "checkpoint_data" jsonb,
  "checkpoint_step" integer,
  "branch_created" text,
  "files_changed" text[],
  "pr_url" text,
  "tokens_used" integer,
  "cost_cents" integer,
  "duration_ms" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "started_at" timestamp,
  "completed_at" timestamp
);

CREATE INDEX "idx_forge_executions_ticket" ON "forge"."agent_executions" ("ticket_id");
CREATE INDEX "idx_forge_executions_status" ON "forge"."agent_executions" ("status");

-- File Locks
CREATE TABLE "forge"."file_locks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "file_path" text NOT NULL,
  "locked_by_ticket_id" uuid NOT NULL REFERENCES "forge"."tickets"("id"),
  "locked_at" timestamp DEFAULT now() NOT NULL,
  "expected_release" timestamp,
  "lock_type" "forge"."lock_type" DEFAULT 'exclusive'
);

CREATE INDEX "idx_forge_file_locks_path" ON "forge"."file_locks" ("file_path");
CREATE UNIQUE INDEX "unique_forge_file_lock" ON "forge"."file_locks" ("file_path", "lock_type");

-- Token Usage
CREATE TABLE "forge"."token_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "execution_id" uuid REFERENCES "forge"."agent_executions"("id"),
  "model" text NOT NULL,
  "input_tokens" integer NOT NULL,
  "output_tokens" integer NOT NULL,
  "cost_cents" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "idx_forge_token_usage_date" ON "forge"."token_usage" ("created_at");

-- Token Budgets
CREATE TABLE "forge"."token_budgets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "date" date NOT NULL UNIQUE,
  "daily_limit_tokens" integer DEFAULT 500000,
  "daily_limit_cents" integer DEFAULT 500,
  "used_tokens" integer DEFAULT 0,
  "used_cents" integer DEFAULT 0,
  "autopilot_limit_tokens" integer DEFAULT 100000,
  "autopilot_used_tokens" integer DEFAULT 0
);

-- Registry
CREATE TABLE "forge"."registry" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "forge"."registry_type" NOT NULL,
  "name" text NOT NULL,
  "file_path" text NOT NULL,
  "description" text,
  "status" "forge"."registry_status" DEFAULT 'active',
  "exports" text[],
  "dependencies" text[],
  "used_by" text[],
  "tags" text[],
  "deprecated_by" uuid,
  "deprecation_notes" text,
  "last_updated" timestamp DEFAULT now() NOT NULL,
  "related_tickets" text[]
);

CREATE INDEX "idx_forge_registry_type" ON "forge"."registry" ("type");
CREATE UNIQUE INDEX "unique_forge_registry" ON "forge"."registry" ("type", "name");

-- Decisions
CREATE TABLE "forge"."decisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "identifier" text NOT NULL UNIQUE,
  "decision" text NOT NULL,
  "context" text,
  "category" "forge"."decision_category" NOT NULL,
  "scope" text[],
  "active" boolean DEFAULT true,
  "supersedes" uuid,
  "created_from_ticket" text,
  "compliance_rate" numeric(5, 2),
  "times_applied" integer DEFAULT 0,
  "times_overridden" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "idx_forge_decisions_category" ON "forge"."decisions" ("category");
CREATE INDEX "idx_forge_decisions_active" ON "forge"."decisions" ("active");

-- Decision Applications
CREATE TABLE "forge"."decision_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "decision_id" uuid NOT NULL REFERENCES "forge"."decisions"("id"),
  "ticket_id" uuid NOT NULL REFERENCES "forge"."tickets"("id"),
  "was_compliant" boolean NOT NULL,
  "override_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Ticket Comments
CREATE TABLE "forge"."ticket_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" uuid NOT NULL REFERENCES "forge"."tickets"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "author_type" "forge"."comment_author_type" NOT NULL,
  "author_name" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Test Personas
CREATE TABLE "forge"."test_personas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE,
  "archetype" "forge"."persona_archetype" NOT NULL,
  "description" text,
  "data_completeness" integer,
  "config" jsonb NOT NULL,
  "edge_cases" text[],
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Releases
CREATE TABLE "forge"."releases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tag" text NOT NULL UNIQUE,
  "name" text,
  "body" text,
  "tickets_included" text[],
  "breaking_changes" text[],
  "is_rollback" boolean DEFAULT false,
  "rollback_of" text,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Deployments
CREATE TABLE "forge"."deployments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "environment" "forge"."deployment_environment" NOT NULL,
  "release_tag" text,
  "ticket_id" uuid REFERENCES "forge"."tickets"("id"),
  "preview_url" text,
  "status" "forge"."deployment_status" NOT NULL,
  "triggered_by" text,
  "duration_ms" integer,
  "rollback_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

-- Success Metrics
CREATE TABLE "forge"."success_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "metric_name" text NOT NULL,
  "current_value" numeric(10, 2),
  "baseline_value" numeric(10, 2),
  "target_value" numeric(10, 2),
  "trend" "forge"."trend",
  "last_calculated" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "unique_forge_metric" ON "forge"."success_metrics" ("metric_name");
