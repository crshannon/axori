---
name: Design System
description: Ensures consistent design system usage across the application, following established patterns for components, colors, typography, and dark mode support.
---

# Design System Skill

This skill ensures design consistency across the Axori application. Use this skill when:

- Creating or updating UI components
- Refactoring existing components to use design system
- Implementing dark mode support
- Standardizing colors, typography, or spacing
- Following design system migration patterns
- Extracting reusable components

## Core Principles

1. **Use Design System Components**: Always prefer `@axori/ui` components over raw HTML elements
2. **CSS Variables for Colors**: Use CSS variables (`rgb(var(--color-*))`) for brand colors instead of hardcoded values
3. **Dark Mode First**: Use Tailwind `dark:` classes instead of conditional `isDark` logic
4. **Component Extraction**: Extract repeated patterns into reusable components in `packages/ui/src/components/`
5. **Typography Component**: Use Typography component instead of raw HTML elements (`<p>`, `<h1>`, etc.)
6. **Card Component Props**: Use Card component props (`variant`, `padding`, `radius`) instead of overriding with `className`

## Quick Reference

- **Implementation Summary**: See [design-system-implementation.md](./design-system-implementation.md) for completed work and next steps
- **Design Tokens**: See `packages/ui/DESIGN_TOKENS.md` for color, spacing, and typography tokens
- **Component Library**: Check `packages/ui/src/components/` for available components
- **Best Practices**: See [design-system-implementation.md](./design-system-implementation.md#best-practices-established)

## Component Conversion Pattern

When working with UI components:

1. **Check Design System First**: Look in `packages/ui/src/components/` for existing components
2. **Convert Raw HTML**: Replace `<button>`, `<input>`, card divs with design system components
3. **Use CSS Variables**: Replace hardcoded colors like `bg-[#E8FF4D]` with `bg-[rgb(var(--color-accent))]`
4. **Extract Reusable Patterns**: Move common patterns to `packages/ui/src/components/`

**Example:**
```tsx
// Before
<button className="bg-[#E8FF4D] px-4 py-2 rounded-lg">
  Click me
</button>

// After
<Button variant="primary">
  Click me
</Button>
```

## Available Design System Components

### Core Components
- **Button** - `variant`: `primary`, `secondary`, `ghost`, `destructive`
- **Input** - `variant`: `default`, `rounded`
- **Select** - `variant`: `default`, `rounded`
- **Card** - `variant`, `padding`, `radius` props
- **Typography** - Use instead of raw HTML elements
- **OnboardingCard** - `variant`: `default`, `compact`, `isDark` prop
- **FormLabel** - Standardized form labels

### Component Locations
- **Design System Components**: `packages/ui/src/components/`
- **Design System Entry Point**: `packages/ui/src/index.ts`
- **Page-Specific Components**: `apps/web/src/components/`
- **Styles**: `apps/web/src/styles.css` (CSS variables)

## Color System

### Using CSS Variables

```tsx
// Primary color
className="bg-[rgb(var(--color-primary))]"

// Accent color
className="bg-[rgb(var(--color-accent))]"

// Dark mode backgrounds
className="bg-[rgb(var(--color-bg-dark))]"
className="bg-[rgb(var(--color-bg-dark-card))]"
```

### Color Reference

**Light Mode:**
- Primary: `violet-600` (`rgb(139, 92, 246)`)
- Background: `white` or `slate-50`
- Text: `slate-900`
- Borders: `black/5` or `slate-200`

**Dark Mode:**
- Primary: `#E8FF4D` (`rgb(232, 255, 77)`)
- Background: `#0F1115` (`rgb(15, 17, 21)`)
- Card Background: `#1A1A1A` (`rgb(26, 26, 26)`)
- Text: `white`
- Borders: `white/5` or `white/10`

## Migration Checklist

When refactoring components, check:

- [ ] Using `@axori/ui` components instead of raw HTML
- [ ] Using CSS variables for colors instead of hardcoded values
- [ ] Using `dark:` classes instead of conditional `isDark` logic
- [ ] Using Typography component for text
- [ ] Using Card component props instead of className overrides
- [ ] Extracted reusable patterns to `packages/ui/src/components/`

## When to Use This Skill

Trigger this skill when:

- Creating new UI components
- Refactoring existing components
- Implementing dark mode support
- Standardizing colors or styling
- Following design system patterns
- Extracting reusable component patterns
- Working on design system migration tasks

## File Locations

- **Design System Components**: `packages/ui/src/components/`
- **Design Tokens**: `packages/ui/DESIGN_TOKENS.md`
- **CSS Variables**: `apps/web/src/styles.css`
- **Implementation Summary**: `.skills/design/design-system-implementation.md`
- **Review Document**: `DESIGN_SYSTEM_REVIEW.md`

## Related Documentation

- **Design System Implementation**: [design-system-implementation.md](./design-system-implementation.md) - Detailed summary of completed work and next steps
- **Design Tokens**: `packages/ui/DESIGN_TOKENS.md` - Color, spacing, and typography tokens
- **Review Document**: `DESIGN_SYSTEM_REVIEW.md` - Analysis of current design system state
