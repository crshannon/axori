# Planning Workflow

This guide outlines the process for creating, executing, and archiving architectural plans.

## Planning Structure

All plans should be organized in versioned folders under `docs/architecture/plans/`. Each plan folder should contain:

1. **Summary Document** (`SUMMARY.md`) - Quick read, "what we aim to accomplish"
2. **Execution Document** (`EXECUTION.md`) - Detailed step-by-step implementation guide

## Creating a New Plan

### Step 1: Create Versioned Folder

Create a new folder with a descriptive name and version number:

```
docs/architecture/plans/003-feature-name/
```

**Naming Convention:**
- Use 3-digit numbers (001, 002, 003, etc.)
- Use kebab-case for feature names
- Examples:
  - `001-drizzle-zod-migration/`
  - `002-property-expenses-implementation/`
  - `003-user-authentication-refactor/`

### Step 2: Create Summary Document

Create `SUMMARY.md` in the plan folder. This should be a **quick read** (1-2 pages max) that answers:

- **What are we trying to accomplish?** (1-2 sentences)
- **Why is this needed?** (Brief context)
- **What are the key goals?** (Bullet points)
- **What's the expected outcome?** (Success criteria)
- **What are the main phases?** (High-level overview)

**Template:**

```markdown
# [Feature Name] - Summary

**Plan Version:** 003  
**Created:** YYYY-MM-DD  
**Status:** Planning / In Progress / Complete

## What We Aim to Accomplish

[1-2 sentences describing the goal]

## Why This Is Needed

[Brief context - what problem does this solve?]

## Key Goals

- Goal 1
- Goal 2
- Goal 3

## Expected Outcome

[What does success look like?]

## Main Phases

1. **Phase 1 Name** - Brief description
2. **Phase 2 Name** - Brief description
3. **Phase 3 Name** - Brief description

## Related Plans

- Links to related plans or dependencies

## Notes

[Any important considerations or constraints]
```

### Step 3: Create Execution Document

Create `EXECUTION.md` in the plan folder. This should be a **detailed step-by-step guide** that includes:

- **Current State Analysis** - What exists now
- **Detailed Phases** - Step-by-step implementation
- **File Changes** - Specific files to modify/create
- **Code Examples** - Examples of expected changes
- **Testing Strategy** - How to verify success
- **Rollback Plan** - How to revert if needed

**Template:**

```markdown
# [Feature Name] - Execution Plan

**Plan Version:** 003  
**Created:** YYYY-MM-DD  
**Status:** Planning / In Progress / Complete

## Current State Analysis

### What Exists Now

[Describe current implementation]

### Issues/Problems

[What needs to be fixed or improved]

## Implementation Phases

### Phase 1: [Phase Name]

**Goal:** [What this phase accomplishes]

**Steps:**
1. [ ] Step 1 description
   - File: `path/to/file.ts`
   - Change: Description of change
   - Example:
     ```typescript
     // Before
     // After
     ```

2. [ ] Step 2 description
   - ...

**Verification:**
- [ ] How to verify this phase is complete
- [ ] Tests to run
- [ ] Expected outcomes

### Phase 2: [Phase Name]

[Repeat structure]

## File Changes Summary

### New Files
- `path/to/new-file.ts` - Purpose

### Modified Files
- `path/to/modified-file.ts` - Changes made

### Deleted Files
- `path/to/deleted-file.ts` - Reason for deletion

## Testing Strategy

### Unit Tests
- [ ] Test 1
- [ ] Test 2

### Integration Tests
- [ ] Test 1
- [ ] Test 2

### Manual Testing
- [ ] Scenario 1
- [ ] Scenario 2

## Rollback Plan

If something goes wrong:

1. Step 1 to rollback
2. Step 2 to rollback
3. ...

## Dependencies

- Dependency 1
- Dependency 2

## Risks and Mitigation

- **Risk 1:** Description
  - **Mitigation:** How to handle

## Timeline Estimate

- Phase 1: X hours/days
- Phase 2: X hours/days
- Total: X hours/days
```

## Executing a Plan

### During Execution

1. **Update Status** - Mark phases as complete in `EXECUTION.md`
2. **Document Changes** - Update file changes summary as you go
3. **Track Issues** - Note any problems or deviations in the execution doc
4. **Test Continuously** - Verify each phase before moving to the next

### After Execution

1. **Create Completion Summary** - Create `COMPLETION.md` in the plan folder
2. **Update Status** - Mark plan as "Complete" in both `SUMMARY.md` and `EXECUTION.md`
3. **Move to Completed** - Move the entire plan folder to `docs/architecture/completed/`

## Completion Summary Template

Create `COMPLETION.md` when the plan is complete:

```markdown
# [Feature Name] - Completion Summary

**Completed:** YYYY-MM-DD  
**Plan Version:** 003

## Summary

[Brief summary of what was accomplished]

## What Was Completed

- ✅ Phase 1: [Name] - Completed on YYYY-MM-DD
- ✅ Phase 2: [Name] - Completed on YYYY-MM-DD
- ✅ Phase 3: [Name] - Completed on YYYY-MM-DD

## Key Achievements

- Achievement 1
- Achievement 2
- Achievement 3

## Changes Made

### Files Created
- `path/to/file.ts`

### Files Modified
- `path/to/file.ts` - Changes made

### Files Deleted
- `path/to/file.ts` - Reason

## Testing Results

- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ Manual testing complete

## Known Issues

- Issue 1 (if any)
- Issue 2 (if any)

## Next Steps

- Future improvement 1
- Future improvement 2
```

## Archiving Completed Plans

Once a plan is complete:

1. **Verify Completion** - Ensure all phases are marked complete
2. **Create Completion Summary** - Add `COMPLETION.md` if not already created
3. **Move Folder** - Move entire plan folder from `docs/architecture/plans/` to `docs/architecture/completed/`
4. **Update References** - Update any references to the plan location

**Command:**
```bash
mv docs/architecture/plans/003-feature-name docs/architecture/completed/003-feature-name
```

## Best Practices

1. **Keep Summaries Short** - `SUMMARY.md` should be a quick read (1-2 pages)
2. **Be Detailed in Execution** - `EXECUTION.md` should have enough detail for someone else to execute
3. **Update as You Go** - Don't wait until the end to document changes
4. **Version Control** - Commit plan documents as you work through them
5. **Link Related Plans** - Reference related plans in the summary
6. **Track Dependencies** - Note any dependencies on other plans or features

## Example Plan Structure

```
docs/architecture/plans/003-feature-name/
├── SUMMARY.md          # Quick read: what we aim to accomplish
├── EXECUTION.md        # Detailed step-by-step guide
└── COMPLETION.md       # Created when plan is complete (optional during execution)
```

After completion:
```
docs/architecture/completed/003-feature-name/
├── SUMMARY.md
├── EXECUTION.md
└── COMPLETION.md
```

