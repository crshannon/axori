#!/usr/bin/env tsx
/**
 * Linear TODO Migration Script
 * 
 * This script migrates tasks from docs/tasks/TODO.md to Linear issues.
 * 
 * Prerequisites:
 * - Linear API key set in LINEAR_API_KEY environment variable
 * - Linear team ID set in LINEAR_TEAM_ID environment variable
 * - Linear project ID (optional) set in LINEAR_PROJECT_ID environment variable
 * 
 * Usage:
 *   LINEAR_API_KEY=xxx LINEAR_TEAM_ID=xxx tsx .cursor/scripts/migrate-todos-to-linear.ts
 * 
 * Or with pnpm:
 *   LINEAR_API_KEY=xxx LINEAR_TEAM_ID=xxx pnpm tsx .cursor/scripts/migrate-todos-to-linear.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// TODO: Install and import Linear SDK
// import { LinearClient } from '@linear/sdk';

interface TodoItem {
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  category?: string;
  subTasks?: TodoItem[];
  completed: boolean;
  lineNumber: number;
}

interface MigrationResult {
  created: number;
  skipped: number;
  errors: string[];
  issueMapping: Map<string, string>; // TODO item -> Linear issue ID
}

/**
 * Parse TODO.md file and extract tasks
 */
function parseTodoFile(filePath: string): TodoItem[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const tasks: TodoItem[] = [];
  
  // TODO: Implement markdown parsing
  // - Parse priority sections (🎯 High Priority, 📋 Medium Priority, etc.)
  // - Parse task items (checkboxes)
  // - Parse nested sub-tasks
  // - Extract task descriptions and context
  // - Identify related ADRs/plans from task descriptions
  
  return tasks;
}

/**
 * Map priority level to Linear priority
 */
function mapPriority(todoPriority: string): 'urgent' | 'high' | 'medium' | 'low' {
  switch (todoPriority) {
    case 'High':
      return 'high';
    case 'Medium':
      return 'medium';
    case 'Low':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Map category to Linear labels
 */
function mapCategory(category: string): string[] {
  // TODO: Map categories to Linear labels
  // - Legal & Compliance -> ['legal', 'compliance']
  // - Core Features -> ['feature']
  // - UI/UX Improvements -> ['ui', 'ux']
  // - Testing -> ['testing']
  // etc.
  return [];
}

/**
 * Create Linear issue from TODO item
 */
async function createLinearIssue(
  todo: TodoItem,
  teamId: string,
  projectId?: string
): Promise<string | null> {
  // TODO: Implement Linear issue creation
  // 1. Use Linear SDK to create issue
  // 2. Set title, description, priority, labels
  // 3. Link to parent issue if sub-task
  // 4. Add reference to original TODO.md location
  // 5. Return Linear issue ID
  
  console.log(`Would create issue: ${todo.title}`);
  return null;
}

/**
 * Main migration function
 */
async function migrateTodosToLinear(): Promise<MigrationResult> {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  const projectId = process.env.LINEAR_PROJECT_ID;
  
  if (!apiKey || !teamId) {
    throw new Error('LINEAR_API_KEY and LINEAR_TEAM_ID environment variables are required');
  }
  
  // TODO: Initialize Linear client
  // const linear = new LinearClient({ apiKey });
  
  const todoPath = join(process.cwd(), 'docs/tasks/TODO.md');
  const todos = parseTodoFile(todoPath);
  
  const result: MigrationResult = {
    created: 0,
    skipped: 0,
    errors: [],
    issueMapping: new Map(),
  };
  
  // TODO: Process todos
  // 1. Filter out completed items (or handle them differently)
  // 2. Create parent issues first
  // 3. Create child issues with proper linking
  // 4. Track created issues in issueMapping
  // 5. Handle errors gracefully
  
  console.log(`\nMigration Summary:`);
  console.log(`  Created: ${result.created}`);
  console.log(`  Skipped: ${result.skipped}`);
  console.log(`  Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log(`\nErrors:`);
    result.errors.forEach(err => console.log(`  - ${err}`));
  }
  
  return result;
}

// Run migration if called directly
if (require.main === module) {
  migrateTodosToLinear()
    .then(() => {
      console.log('\n✅ Migration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateTodosToLinear, parseTodoFile, mapPriority, mapCategory };

