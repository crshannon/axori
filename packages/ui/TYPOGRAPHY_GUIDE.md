# Typography Guide & Best Practices

## Overview

This guide outlines typography patterns and best practices for the Axori design system. Use the `Typography` component from `@axori/ui` for consistent typography across the application.

---

## Quick Start

```tsx
import { Typography, Heading, Label, Body, Caption } from '@axori/ui'

// Using Typography component
<Typography variant="h1">Page Title</Typography>
<Typography variant="body" weight="medium">Body text</Typography>

// Using convenience components
<Heading level={1}>Page Title</Heading>
<Label>Form Label</Label>
<Body size="lg">Large body text</Body>
<Caption>Helper text</Caption>
```

---

## Typography Variants

### Display (Hero/Landing)
**Use for:** Hero sections, landing page main headings

```tsx
<Typography variant="display">
  OWN YOUR WEALTH
</Typography>
```

**Characteristics:**
- Responsive: `clamp(3rem, 8vw, 6rem)` → `text-6xl` → `text-7xl` → `text-8xl`
- Weight: `font-black` (900)
- Transform: `uppercase`
- Tracking: `tracking-tighter`
- Line height: `leading-[0.9]`

**Example:**
```tsx
// Hero section
<Typography variant="display" className="text-slate-900 dark:text-white">
  OWN YOUR WEALTH, OWN YOU
</Typography>
```

---

### H1 (Page Headings)
**Use for:** Main page titles, onboarding step titles

```tsx
<Typography variant="h1">Welcome! Let's get started.</Typography>
```

**Characteristics:**
- Size: `text-5xl md:text-6xl` (48px → 60px)
- Weight: `font-black` (900)
- Transform: `uppercase`
- Tracking: `tracking-tighter`
- Line height: `leading-none`

**Alternative:** Use `.text-huge` utility class for onboarding consistency:
```tsx
<h3 className="text-huge mb-12">Journey Phase</h3>
```

---

### H2 (Section Headings)
**Use for:** Major section titles

```tsx
<Typography variant="h2">Investment Strategy</Typography>
```

**Characteristics:**
- Size: `text-4xl md:text-5xl` (36px → 48px)
- Weight: `font-black` (900)
- Transform: `uppercase`
- Tracking: `tracking-tighter`
- Line height: `leading-tight`

---

### H3 (Subsection Headings)
**Use for:** Subsection titles, card group headings

```tsx
<Typography variant="h3">Select Your Markets</Typography>
```

**Characteristics:**
- Size: `text-3xl md:text-4xl` (30px → 36px)
- Weight: `font-black` (900)
- Transform: `uppercase`
- Tracking: `tracking-tighter`
- Line height: `leading-tight`

---

### H4 (Card Headings)
**Use for:** Card titles, feature names

```tsx
<Typography variant="h4">Cash Flow</Typography>
```

**Characteristics:**
- Size: `text-2xl` (24px)
- Weight: `font-black` (900)
- Transform: `uppercase`
- Tracking: `tracking-tight`

---

### H5 & H6 (Small Headings)
**Use for:** Nested headings, small card titles

```tsx
<Typography variant="h5">Feature Name</Typography>
<Typography variant="h6">Sub-feature</Typography>
```

---

### Body Text
**Use for:** Paragraphs, descriptions, content

```tsx
<Body>Default body text</Body>
<Body size="lg">Large body text for emphasis</Body>
<Body size="sm">Small body text for captions</Body>
```

**Characteristics:**
- Default: `text-base` (16px), `font-normal`, `leading-normal`
- Large: `text-lg` (18px), `leading-relaxed`
- Small: `text-sm` (14px)

**Example:**
```tsx
<Body className="text-slate-500 dark:text-slate-400">
  Axori is the first real estate platform that prioritizes your
  "Investment DNA" over generic market data.
</Body>
```

---

### Labels
**Use for:** Form labels, field labels, UI labels

```tsx
<Label>First Name</Label>
<Label size="sm">Small Label</Label>
```

**Characteristics:**
- Default: `text-sm` (14px), `font-black`, `uppercase`, `tracking-widest`
- Small: `text-xs` (12px)

**Example:**
```tsx
<Label className="block mb-2">Email Address</Label>
<input type="email" />
```

---

### Caption
**Use for:** Helper text, descriptions under headings, metadata

```tsx
<Caption>Select at least 3 markets</Caption>
```

**Characteristics:**
- Size: `text-[10px]` (10px)
- Weight: `font-bold`
- Transform: `uppercase`
- Tracking: `tracking-widest`
- Opacity: `opacity-60`

**Example:**
```tsx
<Typography variant="h3">Financial Goal</Typography>
<Caption className="mb-4">What is your monthly "Freedom Number"?</Caption>
```

---

### Overline
**Use for:** Section labels, progress indicators, metadata

```tsx
<Overline>Progress Pipeline</Overline>
```

**Characteristics:**
- Size: `text-[9px]` (9px)
- Weight: `font-black`
- Transform: `uppercase`
- Tracking: `tracking-[0.3em]` (custom wide)
- Opacity: `opacity-40`

**Example:**
```tsx
<Overline className="text-slate-500 mb-2">Progress Pipeline</Overline>
```

---

## Best Practices

### 1. Use Semantic Variants
✅ **Do:**
```tsx
<Typography variant="h1">Page Title</Typography>
<Typography variant="body">Content here</Typography>
```

❌ **Don't:**
```tsx
<h1 className="text-5xl font-black uppercase">Page Title</h1>
<p className="text-base">Content here</p>
```

### 2. Maintain Hierarchy
- Use `h1` for page titles (one per page)
- Use `h2` for major sections
- Use `h3` for subsections
- Use `h4` for card titles
- Use `body` for content

### 3. Consistent Spacing
- Headings: Use `mb-4`, `mb-8`, or `mb-12` for spacing
- Body text: Use `mb-4` or `mb-6` between paragraphs
- Labels: Use `mb-2` above inputs

### 4. Dark Mode Support
Always include dark mode color classes:
```tsx
<Typography 
  variant="h1" 
  className="text-slate-900 dark:text-white"
>
  Title
</Typography>
```

### 5. Responsive Typography
Use responsive variants for large headings:
```tsx
<Typography variant="display">Hero Text</Typography>
// Automatically responsive: clamp(3rem, 8vw, 6rem) → text-6xl → text-7xl → text-8xl
```

### 6. Override When Needed
You can override specific properties:
```tsx
<Typography 
  variant="h3" 
  weight="bold" 
  transform="none"
  className="text-violet-600"
>
  Custom Heading
</Typography>
```

---

## Common Patterns

### Onboarding Step Title
```tsx
<Typography variant="h1" className="mb-12">
  Welcome! Let's get started.
</Typography>
// Or use utility:
<h3 className="text-huge mb-12">Welcome! Let's get started.</h3>
```

### Form Label
```tsx
<Label className="block mb-2">First Name</Label>
```

### Card Title with Description
```tsx
<Typography variant="h4" className="mb-2">Cash Flow</Typography>
<Caption>Yield and monthly distributions above all.</Caption>
```

### Hero Section
```tsx
<Typography 
  variant="display" 
  className="text-slate-900 dark:text-white mb-8"
>
  OWN YOUR WEALTH, OWN YOU
</Typography>
<Body size="lg" className="text-slate-500 dark:text-slate-400">
  The Tools of Institutions Now in Your Pocket.
</Body>
```

### Section Header with Overline
```tsx
<Overline className="text-slate-500 mb-2">Progress Pipeline</Overline>
<Typography variant="h2" className="mb-8">
  Investment Strategy
</Typography>
```

---

## Migration Guide

### Before (Hardcoded Classes)
```tsx
<h3 className="text-5xl font-black uppercase tracking-tighter mb-12">
  Journey Phase
</h3>
<p className="text-sm font-black uppercase tracking-widest mb-2">
  Progress Pipeline
</p>
```

### After (Typography Component)
```tsx
<Typography variant="h1" className="mb-12">
  Journey Phase
</Typography>
<Overline className="mb-2">Progress Pipeline</Overline>
```

---

## Accessibility

### Semantic HTML
The `Typography` component uses semantic HTML elements by default:
- `h1`-`h6` for headings
- `p` for body text
- `label` for labels

### Override Element When Needed
```tsx
// Use span instead of p for inline text
<Typography variant="body" as="span">Inline text</Typography>
```

### Color Contrast
Ensure sufficient contrast:
- Light mode: `text-slate-900` on white (21:1)
- Dark mode: `text-white` on `#0F1115` (15:1)
- Secondary text: `text-slate-500` or `opacity-60` (meets WCAG AA)

---

## Examples by Context

### Onboarding Flow
```tsx
// Step title
<Typography variant="h1" className="mb-4">
  Select Your Markets
</Typography>

// Subtitle
<Body size="lg" className="text-slate-400 italic mb-8">
  Choose up to 3 target markets (optional)
</Body>

// Form label
<Label className="block mb-2">Market Name</Label>

// Helper text
<Caption className="mb-4">Select at least 3 markets</Caption>
```

### Landing Page
```tsx
// Hero
<Typography variant="display" className="mb-8">
  OWN YOUR WEALTH
</Typography>

// Section heading
<Typography variant="h2" className="mb-6">
  Scale your wealth.
</Typography>

// Body
<Body size="lg" className="text-slate-500 italic">
  Clear, transparent pricing for every stage.
</Body>
```

### Dashboard
```tsx
// Page title
<Typography variant="h1">Dashboard</Typography>

// Card title
<Typography variant="h4" className="mb-2">
  Property Portfolio
</Typography>

// Metric label
<Overline className="text-slate-500 mb-1">Total Value</Overline>
```

---

## Summary

1. **Always use `Typography` component** instead of raw HTML + classes
2. **Choose the right variant** for semantic meaning
3. **Maintain hierarchy** (h1 → h2 → h3 → body)
4. **Support dark mode** with color classes
5. **Use convenience components** (`Heading`, `Label`, `Body`) when appropriate
6. **Override when needed** but prefer variants first

For questions or additions, refer to `packages/ui/src/components/Typography.tsx`.

