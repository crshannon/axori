#!/usr/bin/env tsx
/**
 * Generate RBAC System Implementation Tickets
 *
 * Creates all 20 Linear tickets for the RBAC system implementation,
 * assigned to the "Security: Roles and Permissions" project.
 *
 * Usage:
 *   pnpm exec tsx .cursor/scripts/generate-rbac-tickets.ts
 *
 * Loads LINEAR_API_KEY (and optionally LINEAR_TEAM_ID) from root .env / .env.local.
 */

import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

// Load .env from repo root
function loadEnv(): void {
  const cwd = process.cwd()
  for (const f of ['.env.local', '.env']) {
    const p = resolve(cwd, f)
    if (existsSync(p)) {
      const buf = readFileSync(p, 'utf-8')
      for (const line of buf.split('\n')) {
        const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
        if (m && !process.env[m[1]]) {
          const v = m[2].replace(/^["']|["']$/g, '').trim()
          process.env[m[1]] = v
        }
      }
      break
    }
  }
}

loadEnv()

import { createLinearIssue, getTeams } from './create-linear-issue'
import { getProjects } from './list-linear-projects'

const PROJECT_NAME = 'Security: Roles and Permissions'

interface Ticket {
  title: string
  description: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  phase: string
}

const TICKETS: Ticket[] = [
  {
    title: 'Extend userPortfolios table with invitation and property access fields',
    description: `**File**: \`packages/db/src/schema/index.ts\`

- Add \`invited_by\` (uuid, references users.id)
- Add \`invited_at\` (timestamp)
- Add \`accepted_at\` (timestamp, nullable)
- Add \`property_access\` (JSONB) for property-level restrictions
- Add indexes for efficient permission lookups
- Add constraint: portfolio owner cannot be removed/downgraded
- Create migration; ensure backward compatibility with existing \`userPortfolios\` data`,
    priority: 'high',
    phase: 'Phase 1: Database Schema',
  },
  {
    title: 'Create permission audit log table',
    description: `**File**: \`packages/db/src/schema/index.ts\`

**New Table**: \`permission_audit_log\`
- Fields: \`id\`, \`user_id\`, \`portfolio_id\`, \`action\` (enum: role_change, invitation_sent, invitation_accepted, access_revoked), \`old_value\`, \`new_value\`, \`changed_by\`, \`changed_at\`
- Purpose: Track all permission changes for security and compliance`,
    priority: 'high',
    phase: 'Phase 1: Database Schema',
  },
  {
    title: 'Create @axori/permissions package structure',
    description: `**Location**: \`packages/permissions/\` (new package)

- \`package.json\` with proper workspace configuration
- \`src/index.ts\` - main exports
- \`src/constants.ts\` - role definitions and permission constants
- \`src/helpers.ts\` - permission checking functions
- \`tsconfig.json\`
- Dependencies: \`@axori/db\` for types
- Follow patterns from \`packages/shared\` and \`packages/ui\``,
    priority: 'high',
    phase: 'Phase 2: Shared Package',
  },
  {
    title: 'Implement permission constants and role hierarchy',
    description: `**File**: \`packages/permissions/src/constants.ts\`

- Role hierarchy: owner > admin > editor (member) > viewer
- Permission mappings: \`canView\`, \`canEdit\`, \`canAdmin\`, \`canManageBilling\`
- Role comparison functions
- Export constants for use in API and UI
- Align with \`portfolioRoleEnum\` in \`packages/db/src/schema/index.ts\``,
    priority: 'high',
    phase: 'Phase 2: Shared Package',
  },
  {
    title: 'Create permission checking utilities for API',
    description: `**File**: \`packages/permissions/src/helpers.ts\`

- \`checkPermission(userId, portfolioId, requiredRole)\` - returns boolean
- \`getAccessiblePropertyIds(userId, portfolioId)\` - returns array of property IDs
- \`hasPropertyAccess(userId, portfolioId, propertyId)\` - returns boolean
- \`getUserRole(userId, portfolioId)\` - returns role or null
- Use Drizzle patterns from \`apps/api/src/routes/properties.ts\``,
    priority: 'high',
    phase: 'Phase 2: Shared Package',
  },
  {
    title: 'Create withPermission middleware for API routes',
    description: `**File**: \`apps/api/src/utils/permissions.ts\` (new)

- Function: \`withPermission(requiredRole, options?)\`
- Validates user authentication (Authorization header)
- Checks user role against required role
- Validates property-level access for property-specific endpoints
- Returns 403 Forbidden with no data leakage on unauthorized access
- Logs all permission denials
- Use \`apps/api/src/utils/errors.ts\` patterns`,
    priority: 'high',
    phase: 'Phase 3: API Middleware',
  },
  {
    title: 'Add permission checks to all property routes',
    description: `**File**: \`apps/api/src/routes/properties.ts\`

- Replace manual auth checks with \`withPermission\` middleware
- Add role-based checks: \`canEdit\` for mutations, \`canView\` for reads
- Add property-level access validation for property-specific endpoints
- Ensure all mutations check \`canEdit\` / \`canAdmin\` permissions
- Routes to update: GET, POST, PUT, DELETE for properties, loans, transactions`,
    priority: 'high',
    phase: 'Phase 3: API Middleware',
  },
  {
    title: 'Add permission checks to portfolio and user routes',
    description: `**Files**: 
- \`apps/api/src/routes/users.ts\`
- Create \`apps/api/src/routes/portfolios.ts\` (if doesn't exist)

- Add \`withPermission\` middleware to all routes
- Protect member management endpoints (only \`admin\`/\`owner\`)
- Protect billing endpoints (only \`owner\`)
- Filter data based on user's accessible portfolios`,
    priority: 'high',
    phase: 'Phase 3: API Middleware',
  },
  {
    title: 'Create portfolio members API routes',
    description: `**File**: \`apps/api/src/routes/portfolio-members.ts\` (new)

**Endpoints**:
- \`GET /api/portfolio-members/:portfolioId\` - List members (admin/owner only)
- \`POST /api/portfolio-members/invite\` - Send invitation (admin/owner only)
- \`PUT /api/portfolio-members/:id/role\` - Update role (owner only, prevent owner downgrade)
- \`DELETE /api/portfolio-members/:id\` - Remove member (admin/owner only, prevent owner removal)
- \`POST /api/portfolio-members/accept/:token\` - Accept invitation (public endpoint)

- Use permission middleware, audit log all changes`,
    priority: 'high',
    phase: 'Phase 3: API Middleware',
  },
  {
    title: 'Create usePermissions hook for React',
    description: `**File**: \`packages/permissions/src/hooks/usePermissions.ts\` (or \`apps/web/src/hooks/usePermissions.ts\`)

**Hook Signature**: \`usePermissions(portfolioId: string | null)\`

**Returns**:
- \`role\`: current user's role
- \`canView\`: boolean
- \`canEdit\`: boolean
- \`canAdmin\`: boolean
- \`canManageBilling\`: boolean
- \`hasPropertyAccess(propertyId)\`: function
- \`isLoading\`: boolean

- Fetch user's role from API, derive permissions client-side
- Note: Permissions derived from server state, not stored client-side
- Use TanStack Query patterns from \`apps/web/src/hooks/api/\``,
    priority: 'medium',
    phase: 'Phase 4: UI Hooks',
  },
  {
    title: 'Create API endpoint for user permissions',
    description: `**File**: \`apps/api/src/routes/users.ts\` or new \`permissions.ts\`

**Endpoint**: \`GET /api/permissions/:portfolioId\`

- Returns: User's role and computed permissions for the portfolio
- Security: Must validate user has access to portfolio before returning data`,
    priority: 'medium',
    phase: 'Phase 4: UI Hooks',
  },
  {
    title: 'Add permission-based rendering to property hub pages',
    description: `**Files**: 
- \`apps/web/src/routes/_authed/property-hub.$propertyId/*.tsx\`
- \`apps/web/src/components/property-hub/**/*.tsx\`

- Use \`usePermissions()\` hook
- Hide edit buttons for \`viewer\` role
- Hide delete actions for non-\`admin\`/\`owner\`
- Show "read-only" indicator for restricted users
- Conditionally render drawer edit buttons based on \`canEdit\`
- See \`.cursor/rules/feature-patterns.mdc\` and \`components/drawers/\``,
    priority: 'medium',
    phase: 'Phase 5: UI Rendering',
  },
  {
    title: 'Add permission-based rendering to settings and member management',
    description: `**Files**:
- \`apps/web/src/routes/_authed/property-hub.$propertyId/settings.tsx\`
- Create member management component

- Hide member management section for non-\`admin\`/\`owner\`
- Hide billing section for non-\`owner\`
- Show appropriate UI based on \`canAdmin\` and \`canManageBilling\``,
    priority: 'medium',
    phase: 'Phase 5: UI Rendering',
  },
  {
    title: 'Filter property list based on property-level access',
    description: `**Files**:
- \`apps/web/src/hooks/api/useProperties.ts\`
- \`apps/web/src/routes/_authed/property-hub.tsx\`

- Use \`hasPropertyAccess()\` from \`usePermissions()\` hook
- Filter property list to only show accessible properties
- Update API calls to respect property-level restrictions`,
    priority: 'medium',
    phase: 'Phase 5: UI Rendering',
  },
  {
    title: 'Implement invitation token generation and validation',
    description: `**File**: \`apps/api/src/utils/invitations.ts\` (new)

**Functions**:
- \`generateInvitationToken()\` - creates secure, single-use token
- \`validateInvitationToken(token)\` - validates and returns invitation data
- \`expireInvitationToken(token)\` - marks token as used

**Security**: Tokens must be single-use and time-limited (e.g., 7 days)
- Use crypto for secure token generation`,
    priority: 'medium',
    phase: 'Phase 6: Invitations',
  },
  {
    title: 'Create invitation email template and sending',
    description: `**Files**:
- \`packages/shared/src/email/templates.tsx\` - add invitation template
- \`apps/api/src/routes/portfolio-members.ts\` - integrate email sending

**Features**:
- Email template with invitation link
- Link includes token for acceptance
- Use Resend for email delivery (already integrated)
- See \`packages/shared/src/email/templates.tsx\``,
    priority: 'medium',
    phase: 'Phase 6: Invitations',
  },
  {
    title: 'Build invitation acceptance UI flow',
    description: `**Files**:
- \`apps/web/src/routes/invitation-accept.tsx\` (new)
- \`apps/web/src/components/invitations/InvitationAccept.tsx\` (new)

**Flow**:
- User clicks invitation link
- Validate token via API
- Show invitation details (portfolio name, role)
- Allow user to accept/decline
- Update \`userPortfolios.accepted_at\` on acceptance
- Follow \`apps/web/src/routes/\` patterns`,
    priority: 'medium',
    phase: 'Phase 6: Invitations',
  },
  {
    title: 'Implement audit logging for all permission changes',
    description: `**File**: \`apps/api/src/utils/audit.ts\` (new)

**Function**: \`logPermissionChange(action, userId, portfolioId, oldValue, newValue, changedBy)\`

- Integration: Call from all permission-changing endpoints
- Storage: Write to \`permission_audit_log\` table`,
    priority: 'high',
    phase: 'Phase 7: Security & Audit',
  },
  {
    title: 'Add security validations and prevent privilege escalation',
    description: `**Files**: All API routes that change permissions

**Validations**:
- Editor cannot make themselves admin
- Owner cannot be removed or downgraded
- Only owner can change roles
- Only admin/owner can invite members
- Property-level access cannot exceed portfolio-level access`,
    priority: 'high',
    phase: 'Phase 7: Security & Audit',
  },
  {
    title: 'Add comprehensive permission tests',
    description: `**Files**: 
- \`apps/api/src/routes/__tests__/permissions.test.ts\` (new)
- \`packages/permissions/src/__tests__/helpers.test.ts\` (new)

**Test Cases**:
- Role hierarchy enforcement
- Property-level access restrictions
- Invitation token validation
- Privilege escalation prevention
- Audit log creation
- Use project testing patterns; Playwright for E2E if needed`,
    priority: 'medium',
    phase: 'Phase 7: Security & Audit',
  },
]

async function findProjectId(apiKey: string): Promise<string | null> {
  const projects = await getProjects(apiKey)
  const match = projects.find((p) =>
    p.name.toLowerCase().includes(PROJECT_NAME.toLowerCase())
  )
  return match?.id ?? null
}

async function main() {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    console.error('❌ LINEAR_API_KEY is required. Set it in root .env or .env.local.')
    process.exit(1)
  }

  let teamId = process.env.LINEAR_TEAM_ID
  if (!teamId) {
    console.log('📋 Fetching teams...')
    const teams = await getTeams(apiKey)
    if (teams.length === 0) {
      console.error('❌ No teams found. Set LINEAR_TEAM_ID.')
      process.exit(1)
    }
    if (teams.length === 1) {
      teamId = teams[0].id
      console.log(`✅ Team: ${teams[0].name} (${teams[0].key})`)
    } else {
      teams.forEach((t, i) => console.log(`  ${i + 1}. ${t.name} (${t.key})`))
      console.error('❌ Multiple teams. Set LINEAR_TEAM_ID.')
      process.exit(1)
    }
  }

  console.log(`\n📋 Finding project "${PROJECT_NAME}"...`)
  const projectId = await findProjectId(apiKey)
  if (!projectId) {
    console.error(`❌ Project "${PROJECT_NAME}" not found. Create it in Linear first.`)
    process.exit(1)
  }
  console.log(`✅ Project found (${projectId})\n`)

  console.log(`🚀 Creating ${TICKETS.length} tickets...\n`)
  const results: { ok: boolean; id?: string; url?: string; err?: string }[] = []

  for (let i = 0; i < TICKETS.length; i++) {
    const t = TICKETS[i]
    console.log(`[${i + 1}/${TICKETS.length}] ${t.title}`)
    const res = await createLinearIssue(apiKey, {
      title: t.title,
      description: `**${t.phase}**\n\n${t.description}`,
      priority: t.priority,
      teamId: teamId!,
      projectId,
    })
    results.push(
      res.success
        ? { ok: true, id: res.issueIdentifier, url: res.url }
        : { ok: false, err: res.error }
    )
    if (res.success) console.log(`   ✅ ${res.issueIdentifier} ${res.url}`)
    else console.error(`   ❌ ${res.error}`)
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 400))
  }

  const ok = results.filter((r) => r.ok).length
  const fail = results.filter((r) => !r.ok).length
  console.log('\n' + '—'.repeat(50))
  console.log(`📊 Done: ${ok}/${TICKETS.length} created${fail ? `, ${fail} failed` : ''}`)
  console.log(`📋 All assigned to: ${PROJECT_NAME}`)
}

main().catch((e) => {
  console.error('❌', e)
  process.exit(1)
})
