# Axori Design System Reference

Quick reference for consistent UI implementation.

## Color Palette

### Light Mode
| Purpose | Class |
|---------|-------|
| Background | `bg-white` |
| Surface | `bg-slate-50` |
| Text primary | `text-slate-900` |
| Text secondary | `text-slate-500` |
| Border | `border-slate-200` |
| Primary accent | `bg-violet-600 text-white` |
| Hover accent | `hover:bg-violet-700` |

### Dark Mode
| Purpose | Class |
|---------|-------|
| Background | `dark:bg-slate-900` |
| Surface | `dark:bg-white/5` |
| Text primary | `dark:text-white` |
| Text secondary | `dark:text-white/60` |
| Border | `dark:border-white/10` |
| Primary accent | `dark:bg-[#E8FF4D] dark:text-black` |
| Hover accent | `dark:hover:bg-[#d4eb45]` |

---

## Typography

### Headings
```tsx
// Page title
<h1 className="text-2xl font-black tracking-tight">Title</h1>

// Section heading
<h2 className="text-lg font-bold">Section</h2>

// Card title
<h3 className="text-sm font-bold text-slate-900 dark:text-white">Card Title</h3>
```

### Labels
```tsx
// Uppercase label (buttons, badges, section titles)
<span className="text-xs font-black uppercase tracking-widest">Label</span>

// Form label
<label className="text-sm font-medium text-slate-700 dark:text-white/80">Field</label>
```

### Body Text
```tsx
// Primary
<p className="text-sm text-slate-900 dark:text-white">Content</p>

// Secondary/muted
<p className="text-sm text-slate-500 dark:text-white/60">Description</p>

// Small/helper
<p className="text-xs text-slate-400 dark:text-white/40">Helper text</p>
```

---

## Spacing

### Standard Gaps
| Use Case | Class |
|----------|-------|
| Section spacing | `space-y-10` |
| Field group spacing | `space-y-6` |
| Inline elements | `gap-4` |
| Tight inline | `gap-2` |
| Padding (cards) | `p-6` |
| Padding (buttons) | `px-4 py-2` |

---

## Border Radius

| Element | Class |
|---------|-------|
| Cards | `rounded-2xl` |
| Buttons | `rounded-xl` |
| Inputs | `rounded-xl` |
| Pills/badges | `rounded-full` |
| Small elements | `rounded-lg` |

---

## Components

### Primary Button
```tsx
<button className={cn(
  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
  "bg-violet-600 text-white hover:bg-violet-700",
  "dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]",
  "disabled:opacity-50 disabled:cursor-not-allowed"
)}>
  Button Text
</button>
```

### Secondary Button
```tsx
<button className={cn(
  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
  "bg-white border border-slate-200 text-slate-900",
  "hover:bg-slate-50 hover:border-slate-300",
  "dark:bg-white/10 dark:border-white/20 dark:text-white",
  "dark:hover:bg-white/20"
)}>
  Button Text
</button>
```

### Card
```tsx
<div className={cn(
  "p-6 rounded-2xl",
  "bg-white border border-slate-200",
  "dark:bg-white/5 dark:border-white/10"
)}>
  {/* content */}
</div>
```

### Icon Container
```tsx
<div className={cn(
  "w-12 h-12 rounded-2xl flex items-center justify-center",
  "bg-violet-100 dark:bg-violet-900/50"
)}>
  <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
</div>
```

### List Item
```tsx
<div className={cn(
  "flex items-center justify-between p-4 rounded-xl",
  "bg-slate-50 border border-slate-200",
  "dark:bg-white/5 dark:border-white/10"
)}>
  {/* content */}
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

## Drawer Sections

Use `DrawerSectionTitle` for consistent section headers:

```tsx
import { DrawerSectionTitle } from "./DrawerSectionTitle";

<section className="space-y-6">
  <DrawerSectionTitle title="Section Name" color="violet" />
  {/* section content */}
</section>
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

## Icons

Use `lucide-react` icons:
```tsx
import { Plus, Edit, Trash, Download, Upload, File, X } from "lucide-react";

<Icon className="w-5 h-5" /> // Standard size
<Icon className="w-4 h-4" /> // Small
<Icon className="w-6 h-6" /> // Large (in icon containers)
```

---

## Dark Mode Checklist

When implementing UI, always ensure:

- [ ] Background colors have dark variants
- [ ] Text colors have dark variants
- [ ] Borders have dark variants
- [ ] Hover states work in both modes
- [ ] Accent colors use `#E8FF4D` in dark mode
- [ ] Opacity-based colors for subtle variations (`white/5`, `white/10`, etc.)
