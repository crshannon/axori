# Typography Component - Migration Examples

## Example 1: Onboarding Step (Step1NameCollection)

### Before
```tsx
<h3 className="text-huge mb-12">Welcome! Let's get started.</h3>
<label className="block text-sm font-black uppercase tracking-widest mb-2">
  First Name
</label>
```

### After
```tsx
import { Typography, Label } from '@axori/ui'

<Typography variant="h1" className="mb-12">
  Welcome! Let's get started.
</Typography>
<Label className="block mb-2">First Name</Label>
```

---

## Example 2: Hero Section

### Before
```tsx
<h1 className="text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none">
  OWN YOUR WEALTH
</h1>
<p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-12 max-w-xl mx-auto opacity-60">
  Axori is the first real estate platform...
</p>
```

### After
```tsx
import { Typography, Body } from '@axori/ui'

<Typography 
  variant="display" 
  className="text-slate-900 dark:text-white"
>
  OWN YOUR WEALTH
</Typography>
<Body 
  size="sm" 
  weight="bold"
  transform="uppercase"
  tracking="widest"
  className="text-slate-500 mt-12 max-w-xl mx-auto opacity-60"
>
  Axori is the first real estate platform...
</Body>
```

---

## Example 3: Card with Title and Description

### Before
```tsx
<h4 className="text-xl font-black uppercase mb-2">Cash Flow</h4>
<p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
  Yield and monthly distributions above all.
</p>
```

### After
```tsx
import { Typography, Caption } from '@axori/ui'

<Typography variant="h5" className="mb-2">Cash Flow</Typography>
<Caption>Yield and monthly distributions above all.</Caption>
```

---

## Example 4: Form Section

### Before
```tsx
<p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">
  Progress Pipeline
</p>
<h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">
  {getMotivation()}
</h2>
```

### After
```tsx
import { Typography, Overline } from '@axori/ui'

<Overline className="text-slate-500 mb-2">Progress Pipeline</Overline>
<Typography variant="h3" className="mb-4">
  {getMotivation()}
</Typography>
```

---

## Example 5: Market Card

### Before
```tsx
<h4 className="text-xl font-black uppercase mb-1">
  {market.name}, {market.state}
</h4>
<p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
  {market.region}
</p>
<p className="text-[10px] font-black uppercase tracking-widest opacity-60">
  Cap Rate
</p>
```

### After
```tsx
import { Typography, Caption, Overline } from '@axori/ui'

<Typography variant="h5" className="mb-1">
  {market.name}, {market.state}
</Typography>
<Caption className="mb-2">{market.region}</Caption>
<Overline>Cap Rate</Overline>
```

---

## Quick Reference

| Pattern | Before | After |
|---------|--------|-------|
| Page heading | `text-huge` | `<Typography variant="h1">` |
| Section heading | `text-3xl font-black uppercase` | `<Typography variant="h3">` |
| Card title | `text-xl font-black uppercase` | `<Typography variant="h5">` |
| Form label | `text-sm font-black uppercase tracking-widest` | `<Label>` |
| Small label | `text-[10px] font-black uppercase tracking-widest` | `<Label size="sm">` |
| Body text | `text-base font-normal` | `<Body>` |
| Caption | `text-[10px] font-bold uppercase tracking-widest opacity-60` | `<Caption>` |
| Overline | `text-[9px] font-black uppercase tracking-[0.3em] opacity-40` | `<Overline>` |

