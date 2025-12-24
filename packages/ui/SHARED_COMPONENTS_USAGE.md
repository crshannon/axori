# Shared Components Usage Guide

## New Components Created

### 1. DashboardCard
A consistent card component used across dashboard and wealth journey pages.

**Props:**
- `variant?: 'default' | 'gradient'` - Card style variant
- `hover?: boolean` - Enable hover shadow effect
- Standard HTML div props

**Example:**
```tsx
import { DashboardCard } from '@axori/ui'

<DashboardCard hover>
  <Heading level={3}>Card Title</Heading>
  <Body>Card content</Body>
</DashboardCard>

<DashboardCard variant="gradient">
  <Heading level={3}>Gradient Card</Heading>
</DashboardCard>
```

### 2. StatCard
Displays statistics/metrics with label, value, and optional sub-label and icon.

**Props:**
- `label: string` - Label text
- `value: string | number` - Main value to display
- `sub?: string` - Sub-label text
- `subColor?: string` - Custom color class for sub-label
- `icon?: ReactNode` - Optional icon component
- `variant?: 'default' | 'compact'` - Size variant
- `valueVariant?: 'h4' | 'h5' | 'h3' | 'h2'` - Typography variant for value

**Example:**
```tsx
import { StatCard } from '@axori/ui'

<StatCard
  label="TOTAL EQUITY"
  value="$517k"
  sub="+12%"
  subColor="text-emerald-500"
/>

<StatCard
  label="Gap to Freedom"
  value={`$${gap.toLocaleString()}`}
  sub="To Go"
  variant="compact"
  valueVariant="h5"
/>
```

### 3. ProgressBar
Progress indicator with multiple variants and optional labels.

**Props:**
- `value: number` - Progress value (0-100)
- `variant?: 'default' | 'gradient' | 'simple'` - Visual style
- `height?: 'sm' | 'md' | 'lg'` - Height size
- `showLabel?: boolean` - Show inline label
- `label?: string` - Label text (shown inside bar)
- `targetLabel?: string` - Target marker label
- `showTarget?: boolean` - Show target marker

**Example:**
```tsx
import { ProgressBar } from '@axori/ui'

<ProgressBar value={75} />

<ProgressBar
  value={freedomProgress}
  variant="gradient"
  height="lg"
  showLabel
  label={`$${current}/mo`}
  showTarget
  targetLabel={`$${target}/mo`}
/>
```

### 4. Avatar
User avatar component with initial display.

**Props:**
- `name?: string` - Full name (extracts initials automatically)
- `initial?: string` - Custom initial(s)
- `size?: 'sm' | 'md' | 'lg'` - Size variant

**Example:**
```tsx
import { Avatar } from '@axori/ui'

<Avatar name="John Doe" />
<Avatar initial="JD" size="lg" />
```

### 5. StatusBadge
Status indicator badge with variants.

**Props:**
- `children: ReactNode` - Badge content
- `variant?: 'success' | 'warning' | 'info' | 'default'` - Color variant

**Example:**
```tsx
import { StatusBadge } from '@axori/ui'

<StatusBadge variant="default">Mission Status: On Track</StatusBadge>
<StatusBadge variant="success">Reserves Funded</StatusBadge>
```

## Migration Examples

### Before (Dashboard Stat Card):
```tsx
<div className={`p-6 rounded-[2rem] flex items-center gap-6 shadow-sm border transition-all hover:shadow-md ${
  isDark ? 'bg-[#1A1A1A] border-white/5' : 'bg-white border-slate-100'
}`}>
  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
    isDark ? 'bg-white/5 text-[#E8FF4D]' : 'bg-violet-50 text-violet-600'
  }`}>
    {/* icon */}
  </div>
  <div>
    <Label size="sm" className={cn('mb-1', isDark ? 'text-white/60' : 'text-slate-400')}>
      TOTAL EQUITY
    </Label>
    <Typography variant="h4" className={cn('text-2xl', isDark ? 'text-white' : 'text-slate-900')}>
      $517k
    </Typography>
    <Caption className={cn(isDark ? 'text-white/60' : 'text-slate-500')}>
      +12%
    </Caption>
  </div>
</div>
```

### After:
```tsx
<StatCard
  label="TOTAL EQUITY"
  value="$517k"
  sub="+12%"
  subColor="text-emerald-500"
/>
```

### Before (Progress Bar):
```tsx
<div className="relative h-12 w-full rounded-full bg-slate-500/5 border border-slate-500/10 overflow-hidden mb-8">
  <div
    className={cn(
      'absolute inset-y-0 left-0 transition-all duration-1000 ease-out flex items-center justify-end px-4',
      isDark
        ? 'bg-gradient-to-r from-emerald-900 to-[#E8FF4D]'
        : 'bg-gradient-to-r from-violet-200 to-violet-600',
    )}
    style={{ width: `${freedomProgress}%` }}
  >
    <Overline className={cn('uppercase tracking-widest text-[8px]', isDark ? 'text-black' : 'text-white')}>
      ${currentPassiveIncome.toLocaleString()}/mo
    </Overline>
  </div>
  <div className="absolute inset-y-0 right-0 border-l-2 border-dashed border-slate-400 opacity-20 flex items-center justify-end px-4">
    <Overline className="uppercase tracking-widest text-[8px]">
      ${freedomNumber.toLocaleString()}/mo
    </Overline>
  </div>
</div>
```

### After:
```tsx
<ProgressBar
  value={freedomProgress}
  variant="gradient"
  height="lg"
  showLabel
  label={`$${currentPassiveIncome.toLocaleString()}/mo`}
  showTarget
  targetLabel={`$${freedomNumber.toLocaleString()}/mo`}
/>
```

## Benefits

1. **Consistency**: All cards and components use the same styling
2. **Maintainability**: Changes to styling happen in one place
3. **Dark Mode**: Built-in dark mode support
4. **Type Safety**: Full TypeScript support
5. **Reusability**: Components can be used across the entire application
6. **Reduced Code**: Significantly less boilerplate code

