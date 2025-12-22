# Example Prompt: Add User First and Last Name Support

## Ready-to-Use Prompt

```
Using the Architect skill, add support for user first and last names across all layers of the application.

The Drizzle schema already has `firstName` and `lastName` fields in the users table (packages/db/src/schema/index.ts), but they need to be properly integrated:

1. Update Zod validation schemas in packages/shared/src/validation/index.ts to include firstName and lastName
2. Ensure proper validation rules (optional fields, max 50 chars, allow letters/spaces/hyphens/apostrophes)
3. Create separate insert and select schemas following Architect best practices
4. Verify type alignment - ensure types use Drizzle inference
5. Follow the full-stack checklist from the Architect skill

Requirements:
- firstName and lastName should be optional (matching Drizzle nullable fields)
- Add validation: max 50 characters, trim whitespace, allow letters/spaces/hyphens/apostrophes
- Use camelCase naming (matching Drizzle code layer)
- Create userInsertSchema and userSelectSchema separately
- Ensure all layers are aligned: Drizzle → Zod → Types
```

## What This Prompt Does

This prompt demonstrates how to use the Architect skill by:

1. **Activating the Skill**: Mentions "Using the Architect skill" which triggers Claude to load the skill
2. **Following the Checklist**: References the full-stack checklist
3. **Ensuring Alignment**: Explicitly asks for alignment across all layers
4. **Following Best Practices**: References Architect best practices
5. **Security Consideration**: Notes that these are user fields (though not user-scoped data, so no userId filtering needed)

## Expected Outcome

After Claude processes this prompt with the Architect skill:

- ✅ Zod schemas updated with firstName and lastName
- ✅ Proper validation rules applied
- ✅ Separate insert/select schemas created
- ✅ Types verified to use Drizzle inference
- ✅ All layers properly aligned
- ✅ Follows naming conventions (camelCase)

## Alternative Shorter Prompt

If you want a more concise version:

```
Using the Architect skill, add firstName and lastName fields to the user Zod validation schemas. The Drizzle schema already has these fields - ensure proper alignment, validation (optional, max 50 chars), and follow the full-stack checklist.
```
