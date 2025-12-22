# Design System Review & Recommendations

## Executive Summary

After reviewing the codebase, I've identified several areas for improvement in design consistency, theming, and component reusability. This document outlines findings and actionable recommendations.

---

## 🔴 Critical Issues

### 1. Color System Inconsistencies

**Problem:**
- Design tokens document specifies `blue-600` for primary, but application uses `violet-600` everywhere
- Custom hex colors (`#E8FF4D`, `#0F1115`, `#1A1A1A`) are hardcoded in 35+ locations
- No centralized color system or CSS variables

**Impact:**
- Difficult to maintain brand consistency
- Theme changes require updating multiple files
- Not following Tailwind v4 best practices

**Recommendation:**
- Create a centralized color system using CSS variables
- Update design tokens to match actual usage (`violet` instead of `blue`)
- Replace hardcoded hex values with semantic tokens

### 2. Theming Implementation Duplication

**Problem:**
- Multiple theme implementations:
  - `packages/ui/src/contexts/ThemeContext.tsx`
  - `packages/ui/src/components/ThemeToggle.tsx`
  - `apps/web/src/components/theme-toggle/ThemeToggle.tsx`
  - `apps/web/src/utils/providers/theme-provider.tsx`
- Inconsistent dark mode detection patterns

**Recommendation:**
- Consolidate to single theme system
- Use Tailwind's built-in dark mode with `class` strategy
- Create shared theme utilities

---

## 🟡 Medium Priority Issues

### 3. Component Reusability

**Problem:**
- Onboarding steps have repetitive button/card patterns
- Input fields styled inline instead of using `@axori/ui` components
- Custom button styles duplicated across components

**Examples:**
- Step components use custom button classes instead of `<Button>` component
- Market selection cards could use `<Card>` component
- Form inputs don't use `<Input>` component

**Recommendation:**
- Extract common patterns into shared components
- Create onboarding-specific variants for existing UI components
- Standardize form input usage

### 4. Tailwind v4 Best Practices

**Current State:**
- ✅ Using `@import "tailwindcss"` (v4 syntax)
- ✅ Custom variants defined
- ❌ Not using CSS variables for colors
- ❌ Hardcoded values instead of theme tokens

**Recommendation:**
- Migrate to CSS variables for colors
- Use `@theme` directive for design tokens
- Leverage Tailwind v4's improved dark mode support

---

## 📋 Detailed Recommendations

### Phase 1: Color System Standardization

#### 1.1 Create CSS Variable System

**File: `apps/web/src/styles.css`**

```css
@import "tailwindcss";

@theme {
  /* Brand Colors */
  --color-primary: 139 92 246; /* violet-600 */
  --color-primary-dark: 124 58 237; /* violet-700 */
  --color-accent: 232 255 77; /* #E8FF4D */
  
  /* Dark Mode Backgrounds */
  --color-bg-dark: 15 17 21; /* #0F1115 */
  --color-bg-dark-card: 26 26 26; /* #1A1A1A */
  
  /* Semantic Colors */
  --color-success: 34 197 94; /* green-600 */
  --color-danger: 239 68 68; /* red-600 */
  --color-warning: 234 179 8; /* yellow-600 */
}

@custom-variant dark (&:where(.dark, .dark *));
```

#### 1.2 Update Design Tokens

**File: `packages/ui/DESIGN_TOKENS.md`**

Update to reflect actual usage:
- Primary: `violet-600` / `violet-700`
- Accent: `#E8FF4D` (yellow-lime)
- Dark backgrounds: `#0F1115` (main), `#1A1A1A` (cards)

### Phase 2: Component Extraction

#### 2.1 Create Shared Button Variants

**File: `packages/ui/src/components/Button.tsx`**

Add onboarding-specific variants:
```typescript
const buttonVariants: Record<Variant, string> = {
  primary: "bg-violet-600 hover:bg-violet-700 text-white dark:bg-[#E8FF4D] dark:text-black",
  // ... existing variants
  onboarding: "bg-violet-600 text-white shadow-xl shadow-violet-200 dark:bg-[#E8FF4D] dark:text-black dark:shadow-black/30",
};
```

#### 2.2 Create Onboarding Card Component

**File: `packages/ui/src/components/OnboardingCard.tsx`** (new)

Extract common card pattern from onboarding steps:
```typescript
export function OnboardingCard({ isDark, children, ...props }) {
  return (
    <div
      className={cn(
        "p-16 rounded-[4rem] border transition-colors",
        isDark
          ? "bg-[#1A1A1A] border-white/5"
          : "bg-white border-black/5 shadow-2xl",
        props.className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

#### 2.3 Create Market Card Component

**File: `packages/ui/src/components/MarketCard.tsx`** (new)

Extract market selection card pattern:
```typescript
export function MarketCard({ market, isSelected, isDisabled, onClick, isDark }) {
  // Extract the market card UI pattern
}
```

### Phase 3: Theme System Consolidation

#### 3.1 Single Theme Provider

**File: `packages/ui/src/contexts/ThemeContext.tsx`**

Consolidate all theme logic here, remove duplicates.

#### 3.2 Standardize Dark Mode Detection

Use consistent pattern:
```typescript
const isDark = document.documentElement.classList.contains('dark');
```

Instead of:
- `theme === 'dark'`
- `isDark` prop passed down
- Multiple theme state sources

### Phase 4: Tailwind v4 Migration

#### 4.1 Use CSS Variables

Replace hardcoded colors:
```css
/* Before */
bg-[#E8FF4D]

/* After */
bg-[rgb(var(--color-accent))]
```

#### 4.2 Use @theme Directive

Define all design tokens in CSS:
```css
@theme {
  --radius-sm: 0.5rem;
  --radius-md: 1rem;
  --radius-lg: 2rem;
  --radius-xl: 4rem;
}
```

---

## 🎯 Action Plan

### Immediate (This Week)
1. ✅ Create CSS variable system for colors
2. ✅ Update design tokens documentation
3. ✅ Extract common button patterns

### Short Term (Next 2 Weeks)
4. Extract onboarding card component
5. Consolidate theme providers
6. Replace hardcoded colors with CSS variables

### Medium Term (Next Month)
7. Create market card component
8. Standardize all form inputs
9. Complete Tailwind v4 migration

---

## 📊 Impact Assessment

### Before
- 35+ files with hardcoded colors
- 4 different theme implementations
- Inconsistent component usage
- Difficult to maintain

### After
- Single source of truth for colors
- One theme system
- Reusable component library
- Easy to maintain and update

---

## 🔍 Files Requiring Updates

### High Priority
1. `apps/web/src/styles.css` - Add CSS variables
2. `packages/ui/src/components/Button.tsx` - Add variants
3. All onboarding step components - Use shared components
4. `packages/ui/DESIGN_TOKENS.md` - Update documentation

### Medium Priority
5. `apps/web/src/components/onboarding/steps/*.tsx` - Refactor to use shared components
6. `apps/web/src/components/home/*.tsx` - Replace hardcoded colors
7. `apps/web/src/components/side-nav/SideNav.tsx` - Use CSS variables

---

## 📝 Code Examples

### Example 1: Before/After Color Usage

**Before:**
```tsx
className="bg-[#E8FF4D] text-black dark:bg-violet-600 dark:text-white"
```

**After:**
```tsx
className="bg-accent text-black dark:bg-primary dark:text-white"
```

### Example 2: Component Extraction

**Before:**
```tsx
<div className={`p-16 rounded-[4rem] border ${
  isDark ? 'bg-[#1A1A1A] border-white/5' : 'bg-white border-black/5'
}`}>
```

**After:**
```tsx
<OnboardingCard isDark={isDark}>
```

---

## ✅ Success Criteria

1. All colors use CSS variables or Tailwind semantic tokens
2. Single theme provider used across app
3. Onboarding steps use shared components
4. Design tokens match actual implementation
5. Zero hardcoded hex colors in components

