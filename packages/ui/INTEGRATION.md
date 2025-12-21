# Integrating AI Studio Code

## How to Share Your Code

You can share your AI Studio code in several ways:

1. **Paste directly in chat** - Just paste the code and I'll help integrate it
2. **Create a file** - Add it to `packages/ui/src/components/` or `apps/web/src/routes/`
3. **Share file paths** - If you've already added files, tell me the paths

## Integration Process

### Step 1: Component Analysis
- I'll review your components
- Identify reusable patterns
- Extract common functionality

### Step 2: Design System Integration
- Convert components to use `@axori/ui` base components
- Apply consistent styling with Tailwind
- Ensure TypeScript types are correct
- Add proper prop interfaces

### Step 3: Component Placement

**For reusable components:**
- Add to `packages/ui/src/components/YourComponent.tsx`
- Export from `packages/ui/src/index.ts`
- Use across web and mobile apps

**For page-specific components:**
- Add to `apps/web/src/components/YourComponent.tsx`
- Import directly in routes

**For full pages:**
- Add to `apps/web/src/routes/your-page.tsx`
- Follow TanStack Router file-based routing

## Best Practices

1. **Use Design System Components**
   ```tsx
   import { Button, Card, Input } from "@axori/ui";
   ```

2. **Consistent Styling**
   - Use Tailwind utility classes
   - Leverage the `cn()` utility for conditional classes
   - Follow existing variant patterns (primary, secondary, etc.)

3. **TypeScript Types**
   - Define proper interfaces for props
   - Use shared types from `@axori/shared` when applicable

4. **Accessibility**
   - Include proper ARIA labels
   - Ensure keyboard navigation works
   - Test with screen readers

## Example Integration

**Before (AI Studio code):**
```tsx
<button className="bg-blue-500 text-white px-4 py-2">
  Click me
</button>
```

**After (Design System):**
```tsx
import { Button } from "@axori/ui";

<Button variant="primary" size="md">
  Click me
</Button>
```

## Next Steps

1. Share your AI Studio code
2. I'll help convert it to use the design system
3. We'll add it to the appropriate location
4. Test and refine as needed

