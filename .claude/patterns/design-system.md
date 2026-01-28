# Axori Design System Reference

Quick reference for consistent UI implementation.

## Color Palette

### Light Mode
| Purpose | Class |
|---------|-------|
| Page background | `bg-slate-50` |
| Card background | `bg-white` |
| Surface | `bg-slate-50` |
| Text primary | `text-slate-900` |
| Text secondary | `text-slate-500` |
| Text muted | `text-slate-400` |
| Border | `border-slate-200` |
| Border subtle | `border-black/5` |
| Primary accent | `bg-violet-600 text-white` |
| Hover accent | `hover:bg-violet-700` |

### Dark Mode
| Purpose | Class |
|---------|-------|
| Page background | `dark:bg-[#0a0a0c]` |
| Card background | `dark:bg-[#1A1A1A]` or `dark:bg-white/5` |
| Surface | `dark:bg-white/5` |
| Text primary | `dark:text-white` |
| Text secondary | `dark:text-white/60` |
| Text muted | `dark:text-white/40` |
| Border | `dark:border-white/10` |
| Border subtle | `dark:border-white/5` |
| Primary accent (lime) | `dark:bg-[#E8FF4D] dark:text-black` |
| Hover accent | `dark:hover:bg-[#d4eb45]` |

### Accent Color Classes (Reusable)

Define these at the top of marketing components for consistency:

```tsx
// Text accent - violet in light, lime in dark
const accentColorClass = 'text-violet-600 dark:text-[#E8FF4D]'

// Background accent
const accentBgClass = 'bg-violet-600 dark:bg-[#E8FF4D]'
```

---

## Page Backgrounds

Always set explicit page backgrounds for proper light/dark mode support:

```tsx
// Marketing/public pages
<main className="flex-grow pt-12 pb-40 bg-slate-50 dark:bg-[#0a0a0c]">

// App pages (authenticated)
<main className="flex-grow bg-white dark:bg-slate-900">
```

---

## Typography

### Hero Headings (Marketing Pages)
```tsx
// Extra large hero (responsive)
<h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em] font-extrabold uppercase text-slate-900 dark:text-white">
  HEADLINE
</h1>

// Large section heading
<h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none text-slate-900 dark:text-white">
  Section Title
</h2>
```

### Card Headings
```tsx
// Large card title
<h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
  Card Title
</h3>

// Medium card title
<h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
  Card Title
</h3>

// Small card title
<h3 className="text-sm font-bold text-slate-900 dark:text-white">
  Card Title
</h3>
```

### Labels
```tsx
// Uppercase label (buttons, badges, section titles)
<span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
  Label
</span>

// Muted uppercase label
<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
  Muted Label
</span>

// Extra-wide tracking label
<span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/40">
  Wide Label
</span>

// Form label
<label className="text-sm font-medium text-slate-700 dark:text-white/80">
  Field
</label>
```

### Body Text
```tsx
// Primary
<p className="text-sm text-slate-900 dark:text-white">Content</p>

// Secondary/muted
<p className="text-sm text-slate-500 dark:text-white/60">Description</p>

// Small/helper
<p className="text-xs text-slate-400 dark:text-white/40">Helper text</p>

// Large marketing copy
<p className="text-2xl text-slate-500 dark:text-white/60 font-medium leading-relaxed">
  Marketing description text
</p>
```

---

## Spacing

### Standard Gaps
| Use Case | Class |
|----------|-------|
| Page section spacing | `mb-24` or `mb-32` |
| Section spacing | `space-y-10` |
| Field group spacing | `space-y-6` |
| Inline elements | `gap-4` |
| Tight inline | `gap-2` |
| Padding (cards) | `p-6` |
| Padding (large cards) | `p-12` |
| Padding (buttons) | `px-4 py-2` |

---

## Border Radius

| Element | Class |
|---------|-------|
| Page sections | `rounded-[5rem]` |
| Large marketing cards | `rounded-[4rem]` or `rounded-[3rem]` |
| Cards | `rounded-2xl` |
| Buttons | `rounded-xl` |
| Large buttons | `rounded-3xl` or `rounded-full` |
| Inputs | `rounded-xl` |
| Pills/badges | `rounded-full` |
| Small elements | `rounded-lg` |

---

## Cards

### Standard Card
```tsx
<div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10">
  {/* content */}
</div>
```

### Marketing/Bento Card
```tsx
const cardClass = 'p-12 rounded-[4rem] border transition-all duration-700 bg-white border-black/5 shadow-sm hover:shadow-2xl dark:bg-[#1A1A1A] dark:border-white/5'

<div className={cardClass}>
  {/* content */}
</div>
```

### Dark Accent Card (inverted colors)
```tsx
<div className="p-12 rounded-[4rem] bg-slate-900 text-white shadow-xl shadow-slate-200 dark:bg-[#121212] dark:shadow-black/30">
  {/* content - text inherits white */}
</div>
```

### CTA Card (colored background)
```tsx
<div className="p-20 md:p-32 rounded-[5rem] text-center bg-violet-600 text-white shadow-2xl shadow-violet-200 dark:bg-[#E8FF4D] dark:text-black dark:shadow-black/30">
  {/* content */}
</div>
```

---

## Bento Grid Layouts

Use CSS Grid with column spans for marketing layouts:

```tsx
<div className="grid grid-cols-1 md:grid-cols-12 gap-8">
  {/* Large card - 8 columns */}
  <div className="md:col-span-8">{/* content */}</div>

  {/* Small card - 4 columns */}
  <div className="md:col-span-4">{/* content */}</div>

  {/* Medium cards - 5 and 7 columns */}
  <div className="md:col-span-5">{/* content */}</div>
  <div className="md:col-span-7">{/* content */}</div>

  {/* Equal cards - 6 columns each */}
  <div className="md:col-span-6">{/* content */}</div>
  <div className="md:col-span-6">{/* content */}</div>
</div>
```

---

## Buttons

### Primary Button (using @axori/ui)
```tsx
import { Button } from "@axori/ui";

<Button className="px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider">
  Button Text
</Button>
```

### Large Marketing Button
```tsx
<Button className="px-20 py-8 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-110 shadow-2xl">
  Call to Action
</Button>
```

### Ghost/Outline Button
```tsx
<Button className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20">
  Button Text
</Button>
```

---

## Progress Bars

```tsx
{/* Track */}
<div className="w-full h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
  {/* Fill */}
  <div
    className="h-full bg-violet-600 dark:bg-[#E8FF4D] rounded-full"
    style={{ width: '75%' }}
  />
</div>
```

---

## Badges & Pills

### Status Badge
```tsx
<div className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500">
  Active
</div>
```

### Tag/Chip
```tsx
<div className="px-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">
  Tag
</div>
```

### Highlight Badge
```tsx
<div className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
  +12.8% Growth
</div>
```

---

## Background Effects

### Gradient Orb (decorative blur)
```tsx
<div className="absolute -right-24 -bottom-24 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-violet-600 dark:bg-[#E8FF4D]" />
```

### Dot Grid Pattern
```tsx
<div className="absolute inset-0 opacity-10 pointer-events-none">
  <svg width="100%" height="100%">
    <defs>
      <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
        <circle cx="50" cy="50" r="1.5" fill="currentColor" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
</div>
```

---

## @axori/ui Components

Always prefer these over custom implementations:

```tsx
import {
  Button,
  Input,
  Select,
  Textarea,
  Drawer,
  Card,
  ErrorCard,
  DeleteConfirmationCard,
  EmptyState,
  LoadingSpinner,
} from "@axori/ui";
```

### Input Variant
Always use `variant="rounded"`:
```tsx
<Input
  variant="rounded"
  label="Field Label"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={errors.field}
  required
/>
```

### Select Variant
```tsx
<Select
  variant="rounded"
  label="Select Label"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={errors.field}
>
  <option value="">Select...</option>
  {options.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</Select>
```

---

## Icons

Use `lucide-react` icons (never inline SVGs):

```tsx
import { Plus, Edit, Trash, Download, Upload, File, X, Check, TrendingUp, MapPin, AlertTriangle } from "lucide-react";

<Icon className="w-5 h-5" /> // Standard size
<Icon className="w-4 h-4" /> // Small
<Icon className="w-6 h-6" /> // Large (in icon containers)
<Icon className="w-7 h-7" strokeWidth={3} /> // Extra bold
```

---

## State Indicators

### Loading
```tsx
<LoadingSpinner />
// or
<div className="animate-pulse bg-slate-200 dark:bg-white/10 h-4 rounded" />
```

### Empty State
```tsx
<EmptyState
  icon={FileText}
  title="No documents"
  description="Upload your first document to get started"
/>
```

### Error
```tsx
<ErrorCard message="Something went wrong" />
```

---

## Dark Mode Checklist

When implementing UI, always ensure:

- [ ] Page has explicit background (`bg-slate-50 dark:bg-[#0a0a0c]`)
- [ ] All text has explicit colors with dark variants
- [ ] Never use `opacity-*` alone for text - always pair with explicit colors
- [ ] Background colors have dark variants
- [ ] Borders have dark variants (`border-slate-200 dark:border-white/10`)
- [ ] Hover states work in both modes
- [ ] Accent colors use `#E8FF4D` (lime) in dark mode
- [ ] Use opacity-based colors for subtle variations (`white/5`, `white/10`, etc.)
- [ ] Progress bar tracks visible in both modes

---

## Common Anti-Patterns (AVOID)

### Never use opacity alone for text
```tsx
// ❌ WRONG - invisible in dark mode
<span className="opacity-40">Label</span>
<p className="opacity-60">Description</p>

// ✅ CORRECT - explicit colors
<span className="text-slate-400 dark:text-white/40">Label</span>
<p className="text-slate-500 dark:text-white/60">Description</p>
```

### Never use white/black opacity without dark variant
```tsx
// ❌ WRONG - invisible in one mode
<div className="bg-white/5">...</div>
<div className="border-black/10">...</div>

// ✅ CORRECT - works in both modes
<div className="bg-slate-100 dark:bg-white/5">...</div>
<div className="border-slate-200 dark:border-white/10">...</div>
```

### Never use raw HTML elements when @axori/ui exists
```tsx
// ❌ WRONG
<button className="...">Click</button>
<input className="..." />
<textarea className="..." />

// ✅ CORRECT
<Button>Click</Button>
<Input variant="rounded" />
<Textarea variant="rounded" />
```

### Never use inline SVGs for common icons
```tsx
// ❌ WRONG
<svg width="24" height="24" viewBox="0 0 24 24">...</svg>

// ✅ CORRECT
import { Check } from "lucide-react";
<Check className="w-6 h-6" />
```

### Never leave text without dark mode colors
```tsx
// ❌ WRONG - dark text on dark background
<h2 className="text-5xl font-black">Title</h2>
<p className="text-sm font-bold">Description</p>

// ✅ CORRECT
<h2 className="text-5xl font-black text-slate-900 dark:text-white">Title</h2>
<p className="text-sm font-bold text-slate-500 dark:text-white/60">Description</p>
```
