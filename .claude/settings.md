# Claude Code Settings for Axori

This file configures Claude Code's behavior when working with the Axori codebase.

## Pattern Reference Files

When working on features, consult these reference files:

| Pattern | Reference |
|---------|-----------|
| Feature implementation | `.claude/patterns/feature-checklist.md` |
| Design system | `.claude/patterns/design-system.md` |
| Validation schemas | `.claude/patterns/validation-schemas.md` |

## Key Principles

### 1. Type Safety First
- Never manually define types that exist in Drizzle schemas
- Use `InferSelectModel` / `InferInsertModel` from drizzle-orm
- Use `z.infer<typeof schema>` for Zod types

### 2. Validation Flow
- Database → drizzle-zod → Enhanced schemas → Form schemas
- Always validate before database operations
- Use `validateData()` utility in API routes

### 3. Component Reuse
- Always check `@axori/ui` before creating new components
- Use existing drawer patterns
- Follow established styling patterns

### 4. Error Handling
- Wrap all API handlers with `withErrorHandling`
- Use `AppError` for custom errors
- Provide user-friendly validation messages

## Code Organization Rules

### Where to Put New Code

| Code Type | Location |
|-----------|----------|
| Database table | `packages/db/src/schema/index.ts` |
| Inferred types | `packages/db/src/types.ts` |
| Validation schemas | `packages/shared/src/validation/` |
| API route | `apps/api/src/routes/[entity].ts` |
| API hooks | `apps/web/src/hooks/api/use[Entity].ts` |
| Drawer component | `apps/web/src/components/drawers/` |
| Feature components | `apps/web/src/components/[feature]/` |
| Route page | `apps/web/src/routes/` |

### Naming Conventions

| Element | Pattern | Example |
|---------|---------|---------|
| Table | plural snake_case | `property_documents` |
| Type (select) | singular PascalCase | `PropertyDocument` |
| Type (insert) | + Insert suffix | `PropertyDocumentInsert` |
| Zod schema | camelCase + Schema | `propertyDocumentInsertSchema` |
| API schema | + Api suffix | `propertyDocumentInsertApiSchema` |
| Hook (list) | use + plural | `usePropertyDocuments` |
| Hook (single) | use + singular | `usePropertyDocument` |
| Hook (create) | useCreate + singular | `useCreatePropertyDocument` |
| Drawer | PascalCase + Drawer | `PropertyDocumentDrawer` |

## Quality Checklist

Before completing any feature work:

- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes (no warnings)
- [ ] All CRUD operations work
- [ ] Dark mode styles work
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled

## Common Patterns to Follow

### TanStack Query Keys
```typescript
export const entityKeys = {
  all: ["entities"] as const,
  lists: () => [...entityKeys.all, "list"] as const,
  list: (filters: F) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, "detail"] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};
```

### API Route Structure
```typescript
app.get("/", requireAuth(), withErrorHandling(async (c) => { ... }));
app.get("/:id", requireAuth(), withErrorHandling(async (c) => { ... }));
app.post("/", requireAuth(), withErrorHandling(async (c) => { ... }));
app.put("/:id", requireAuth(), withErrorHandling(async (c) => { ... }));
app.delete("/:id", requireAuth(), withErrorHandling(async (c) => { ... }));
```

### Drawer Props Interface
```typescript
interface EntityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityId?: string;  // For edit mode
  onSuccess?: () => void;
}
```

## Anti-Patterns to Avoid

1. **Don't** manually define types that duplicate database schema
2. **Don't** use raw HTML elements when `@axori/ui` components exist
3. **Don't** skip validation on API routes
4. **Don't** forget dark mode variants in styles
5. **Don't** create new validation patterns without checking existing ones
6. **Don't** use React state for drawers (use URL-based drawer system)
7. **Don't** skip error handling in mutations
