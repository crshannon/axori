# Onboarding Design Standardization

## Design Pattern (Based on Step3Persona)

### Standardized Selection Pattern
All selection-based steps now follow this consistent pattern:

**Layout:**
- No wrapper card - content flows directly
- `grid grid-cols-1 gap-4` for option list
- Horizontal flex layout: `flex items-center justify-between`

**Button Style:**
- Padding: `p-8` (consistent)
- Border radius: `rounded-[2rem]` (consistent)
- Border: `border` with theme-aware colors

**Selected State:**
- Dark mode: `bg-[#E8FF4D] text-black border-[#E8FF4D]`
- Light mode: `bg-violet-600 text-white border-violet-600 shadow-xl`

**Unselected State:**
- Dark mode: `bg-white/5 border-white/10 hover:bg-white/10`
- Light mode: `bg-white border-black/5 hover:border-slate-200 shadow-sm`

**Typography:**
- Title: `text-lg font-black uppercase tracking-tight`
- Description: `text-[10px] font-bold uppercase tracking-widest opacity-60`

**Arrow Icon:**
- Right side: `w-10 h-10 rounded-full border`
- Selected: `border-current` (full opacity)
- Unselected: `border-current opacity-10`
- Chevron pointing right (→)

---

## Standardized Steps

### ✅ Step 2: Journey Phase
**Before:**
- `p-10 rounded-[2.5rem]` (different padding/radius)
- `grid-cols-1 sm:grid-cols-2` (2 columns on mobile)
- No arrow icon
- Different typography sizes

**After:**
- `p-8 rounded-[2rem]` (matches Step3)
- `grid-cols-1` (single column)
- Arrow icon added
- Typography matches Step3

### ✅ Step 3: Investor Persona
**Reference pattern** - This is the design we're matching.

### ✅ Step 6: Strategy Focus
**Before:**
- `p-10 rounded-[2.5rem]` (different padding/radius)
- `gap-6` (larger gap)
- Color accent bar on right side
- Different typography sizes
- No arrow icon

**After:**
- `p-8 rounded-[2rem]` (matches Step3)
- `gap-4` (consistent gap)
- Removed color accent bar
- Typography matches Step3
- Arrow icon added

### ✅ Step 7: Market Selection
**Before:**
- `p-6` (different padding)
- Complex layout with stats on right, checkbox on far right
- Different typography

**After:**
- `p-8` (matches Step3)
- Stats moved below title/description (inline)
- Arrow icon replaces checkbox (shows checkmark when selected)
- Typography matches Step3
- Maintains market-specific info (cap rate, price) but in cleaner layout

---

## Unique Steps (Different Interaction Patterns)

### Step 1: Name Collection
**Pattern:** Form inputs with labels
- Uses wrapper card (`p-16 rounded-[4rem]`)
- Form inputs with labels
- Submit button at bottom
- **Kept unique** - appropriate for form input pattern

### Step 4: Ownership Structure
**Pattern:** Toggle buttons
- Uses wrapper card (`p-16 rounded-[4rem]`)
- Toggle switch pattern (Personal/LLC)
- Confirm button
- **Kept unique** - appropriate for binary selection

### Step 5: Freedom Number
**Pattern:** Slider input
- Uses wrapper card (`p-16 rounded-[4rem]`)
- Range slider with large display
- Increment/decrement buttons
- **Kept unique** - appropriate for numeric input

---

## Consistency Checklist

### Visual Consistency
- ✅ All selection steps use same button padding (`p-8`)
- ✅ All selection steps use same border radius (`rounded-[2rem]`)
- ✅ All selection steps use same gap spacing (`gap-4`)
- ✅ All selection steps have arrow icon on right
- ✅ All selection steps use same typography sizes
- ✅ All selection steps use same color scheme

### Interaction Consistency
- ✅ Clicking option immediately advances (Step2, Step3)
- ✅ Clicking option selects and shows Continue button (Step6, Step7)
- ✅ Selected state is visually clear
- ✅ Hover states are consistent

### Typography Consistency
- ✅ All step titles use `text-huge`
- ✅ All option titles use `text-lg font-black uppercase tracking-tight`
- ✅ All option descriptions use `text-[10px] font-bold uppercase tracking-widest opacity-60`

---

## Before/After Comparison

### Step 2 Journey Phase
```tsx
// Before
<p-10 rounded-[2.5rem] grid-cols-2 no-arrow>

// After  
<p-8 rounded-[2rem] grid-cols-1 with-arrow>
```

### Step 6 Strategy
```tsx
// Before
<p-10 rounded-[2.5rem] gap-6 color-bar no-arrow>

// After
<p-8 rounded-[2rem] gap-4 no-color-bar with-arrow>
```

### Step 7 Markets
```tsx
// Before
<p-6 complex-layout checkbox-right stats-right>

// After
<p-8 clean-layout arrow-right stats-inline>
```

---

## Benefits

1. **Visual Consistency**: All selection steps look and feel the same
2. **User Experience**: Predictable interaction patterns
3. **Maintainability**: Single pattern to maintain
4. **Accessibility**: Consistent focus states and interactions
5. **Brand Identity**: Cohesive design language

---

## Files Updated

- ✅ `apps/web/src/components/onboarding/steps/Step2JourneyPhase.tsx`
- ✅ `apps/web/src/components/onboarding/steps/Step6Strategy.tsx`
- ✅ `apps/web/src/components/onboarding/steps/Step7MarketSelection.tsx`

## Files Kept Unique (By Design)

- `Step1NameCollection.tsx` - Form input pattern
- `Step4Ownership.tsx` - Toggle switch pattern
- `Step5FreedomNumber.tsx` - Slider input pattern

