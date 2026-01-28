# Account Settings Redesign Patterns

Reference guide for full-width bento layouts used in account settings. Apply these patterns when redesigning other feature pages.

---

## Layout Structure

### Full-Width Container
```tsx
<div className="px-6 lg:px-12 py-10">
  {/* Page Header */}
  <div className="mb-10">
    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
      Page Title
    </h2>
    <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
      Page description
    </p>
  </div>

  {/* Bento Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Cards go here */}
  </div>
</div>
```

### 12-Column Bento Grid
Use column spans for visual hierarchy:

| Layout | Columns | Use Case |
|--------|---------|----------|
| Hero/Summary | `lg:col-span-5` | Primary info card (avatar, plan, stats) |
| Details | `lg:col-span-7` | Supporting cards (forms, lists) |
| Sidebar | `lg:col-span-4` | Summary stats, quick actions |
| Main Content | `lg:col-span-8` | Lists, tables, settings |
| Full Width | `lg:col-span-12` | Tables, plan grids, large sections |

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  {/* 5/7 split for hero + details */}
  <div className="lg:col-span-5">{/* Hero card */}</div>
  <div className="lg:col-span-7 space-y-6">{/* Stacked detail cards */}</div>

  {/* Full-width section */}
  <div className="lg:col-span-12">{/* Table or grid */}</div>
</div>
```

---

## Card Styles

### Standard Card
```tsx
<div
  className={cn(
    "p-8 rounded-3xl border",
    "bg-white border-slate-200",
    "dark:bg-[#1A1A1A] dark:border-white/5"
  )}
>
```

### Gradient Hero Card (for primary CTAs)
```tsx
<div
  className={cn(
    "p-8 rounded-3xl border-transparent",
    "bg-gradient-to-br from-violet-600 to-purple-700",
    "dark:from-[#E8FF4D] dark:to-lime-500"
  )}
>
  {/* Text uses text-white dark:text-black */}
  {/* Secondary text uses text-white/60 dark:text-black/50 */}
</div>
```

### Card Section Header
```tsx
<div className="flex items-center gap-3 mb-6">
  <div
    className={cn(
      "p-2.5 rounded-xl",
      "bg-violet-100 text-violet-600",
      "dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]"
    )}
  >
    <Icon className="size-5" />
  </div>
  <div>
    <h3 className="font-bold text-slate-900 dark:text-white">
      Section Title
    </h3>
    <p className="text-xs text-slate-500 dark:text-white/50">
      Section description
    </p>
  </div>
</div>
```

### Card Label (top of card)
```tsx
<span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
  Card Label
</span>
```

---

## Tab Navigation (Full-Width Underline Style)

```tsx
<nav className="border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0a0c]">
  <div className="px-6 lg:px-12">
    <div className="flex gap-1 -mb-px overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            "group relative flex items-center gap-3 px-6 py-5 text-sm font-medium transition-all whitespace-nowrap",
            isActive
              ? "text-violet-600 dark:text-[#E8FF4D]"
              : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
          )}
        >
          <Icon className={cn(
            "size-5",
            isActive
              ? "text-violet-600 dark:text-[#E8FF4D]"
              : "text-slate-400 dark:text-white/40"
          )} />
          <div className="text-left">
            <span className="block font-semibold">{tab.label}</span>
            <span className={cn(
              "block text-[10px] font-normal",
              isActive
                ? "text-violet-500 dark:text-[#E8FF4D]/70"
                : "text-slate-400 dark:text-white/30"
            )}>
              {tab.description}
            </span>
          </div>

          {/* Active indicator line */}
          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-[#E8FF4D]" />
          )}
        </button>
      ))}
    </div>
  </div>
</nav>
```

---

## Data Display Patterns

### Info Row (inside cards)
```tsx
<div
  className={cn(
    "p-4 rounded-2xl",
    "bg-slate-50 dark:bg-white/5"
  )}
>
  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1">
    Field Label
  </p>
  <p className="font-medium text-slate-900 dark:text-white">
    Field Value
  </p>
</div>
```

### List Item Row
```tsx
<div
  className={cn(
    "flex items-center justify-between p-4 rounded-2xl",
    "bg-slate-50 dark:bg-white/5"
  )}
>
  <div className="flex items-center gap-3">
    <div className="size-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
      <Icon className="size-5 text-slate-500 dark:text-slate-400" />
    </div>
    <div>
      <p className="font-medium text-sm text-slate-900 dark:text-white">
        Item Title
      </p>
      <p className="text-xs text-slate-500 dark:text-white/50">
        Item description
      </p>
    </div>
  </div>
  {/* Actions on right */}
</div>
```

### Progress Bar
```tsx
<div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
  <div
    className="h-full rounded-full bg-violet-500 dark:bg-[#E8FF4D] transition-all"
    style={{ width: `${percentage}%` }}
  />
</div>
```

### Stats Grid (inside hero cards)
```tsx
<div className="grid grid-cols-2 gap-4 w-full mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
  <div>
    <p className="text-2xl font-black text-slate-900 dark:text-white">
      42
    </p>
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
      Stat Label
    </p>
  </div>
</div>
```

---

## Badge Styles

### Primary Badge
```tsx
<span
  className={cn(
    "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
    "bg-violet-100 text-violet-700",
    "dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]"
  )}
>
  Primary
</span>
```

### Success Badge
```tsx
<span
  className={cn(
    "flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
    "bg-emerald-100 text-emerald-700",
    "dark:bg-emerald-500/10 dark:text-emerald-400"
  )}
>
  <Check className="size-3" />
  Verified
</span>
```

### Toggle Button (pill style)
```tsx
<button
  onClick={toggle}
  className={cn(
    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors",
    isActive
      ? "bg-violet-100 text-violet-700 dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]"
      : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/30"
  )}
>
  <Icon className="size-3.5" />
  <span className="text-[10px] font-bold uppercase tracking-wider">
    Label
  </span>
</button>
```

---

## Button Styles

### Primary CTA (in hero cards)
```tsx
<button
  className={cn(
    "w-full px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all",
    "bg-violet-600 text-white hover:bg-violet-700",
    "dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]"
  )}
>
  Save Changes
</button>
```

### Inverted Button (on gradient cards)
```tsx
<button
  className={cn(
    "w-full px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all",
    "bg-white text-violet-700 hover:bg-white/90",
    "dark:bg-black dark:text-[#E8FF4D] dark:hover:bg-black/80"
  )}
>
  Upgrade Plan
</button>
```

### Text Link Button
```tsx
<button className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-[#E8FF4D] dark:hover:text-[#d4eb45] transition-colors flex items-center gap-1">
  View All
  <ExternalLink className="size-3" />
</button>
```

---

## Color System Reference

### Icon Container Colors
| Color | Light | Dark |
|-------|-------|------|
| Violet (primary) | `bg-violet-100 text-violet-600` | `dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]` |
| Blue | `bg-blue-100 text-blue-600` | `dark:bg-blue-500/10 dark:text-blue-400` |
| Emerald | `bg-emerald-100 text-emerald-600` | `dark:bg-emerald-500/10 dark:text-emerald-400` |
| Amber | `bg-amber-100 text-amber-600` | `dark:bg-amber-500/10 dark:text-amber-400` |
| Neutral | `bg-slate-100 text-slate-600` | `dark:bg-white/5 dark:text-white/60` |

---

## Checklist for Redesigning Features

- [ ] Replace `max-w-*` constraints with full-width `px-6 lg:px-12 py-10`
- [ ] Use 12-column grid with appropriate spans (5/7, 4/8, or 12)
- [ ] Apply `rounded-3xl` cards with proper border colors
- [ ] Add page header with uppercase title and description
- [ ] Use icon containers with colored backgrounds
- [ ] Add `text-[10px] font-black uppercase tracking-widest` labels
- [ ] Include progress bars or stats for visual interest
- [ ] Ensure all text has explicit dark mode colors
- [ ] Use violet/lime accent colors consistently
