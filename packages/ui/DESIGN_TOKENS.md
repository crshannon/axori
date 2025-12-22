# Design Tokens

## Colors

### Primary Brand Colors
- `violet-600` (`rgb(139, 92, 246)`) - Primary actions, buttons, active states
- `violet-700` (`rgb(124, 58, 237)`) - Primary hover states
- `violet-400` (`rgb(167, 139, 250)`) - Primary light variant
- **Accent**: `#E8FF4D` (`rgb(232, 255, 77)`) - Yellow-lime accent for dark mode highlights

### Dark Mode Backgrounds
- `#0F1115` (`rgb(15, 17, 21)`) - Main dark background
- `#1A1A1A` (`rgb(26, 26, 26)`) - Card/surface dark background
- `#252525` (`rgb(37, 37, 37)`) - Hover states on dark backgrounds

### Semantic Colors
- `green-600` (`rgb(34, 197, 94)`) - Success states
- `red-600` (`rgb(239, 68, 68)`) - Danger/Error states
- `yellow-600` (`rgb(234, 179, 8)`) - Warning states

### Neutral Colors
- `slate-50` - Light backgrounds
- `slate-100` - Subtle backgrounds
- `slate-200` - Borders (light mode)
- `slate-500` - Placeholder text
- `slate-700` - Body text
- `slate-900` - Headings (light mode)
- `white/5` - Borders (dark mode)
- `white/10` - Hover borders (dark mode)

## Typography

### Typography System
Use the `Typography` component from `@axori/ui` for consistent typography across the application.

**Available Variants:**
- `display` - Hero/landing page headings (clamp(3rem, 8vw, 6rem))
- `h1` - Page headings (text-5xl md:text-6xl)
- `h2` - Section headings (text-4xl md:text-5xl)
- `h3` - Subsection headings (text-3xl md:text-4xl)
- `h4` - Card headings (text-2xl)
- `h5` - Small headings (text-xl)
- `h6` - Smallest headings (text-lg)
- `body-lg` - Large body text (text-lg)
- `body` - Default body text (text-base)
- `body-sm` - Small body text (text-sm)
- `label` - Form labels (text-sm uppercase)
- `label-sm` - Small labels (text-xs uppercase)
- `caption` - Captions/helper text (text-[10px])
- `overline` - Overline text (text-[9px])

**Custom Utility:**
- `.text-huge` - Page headings in onboarding (3rem/48px, responsive up to 4.5rem/72px)

### Weights
- `font-normal` - 400 (Body text)
- `font-medium` - 500 (Emphasized text)
- `font-semibold` - 600 (Subheadings)
- `font-bold` - 700 (Strong emphasis)
- `font-black` - 900 (Headings, labels)

### Letter Spacing (Tracking)
- `tracking-tighter` - -0.05em (Large headings)
- `tracking-tight` - -0.025em (Headings)
- `tracking-normal` - 0em (Default)
- `tracking-wide` - 0.025em
- `tracking-wider` - 0.05em
- `tracking-widest` - 0.1em (Labels, uppercase text)
- `tracking-[0.3em]` - Custom wide spacing (Overlines)

### Text Transform
- `uppercase` - All uppercase (Headings, labels)
- `lowercase` - All lowercase (Rarely used)
- Default - Normal case (Body text)

### Line Height
- `leading-none` - 1 (Tight, for large headings)
- `leading-tight` - 1.25 (Headings)
- `leading-normal` - 1.5 (Body text)
- `leading-relaxed` - 1.625 (Large body text)

## Spacing

Use Tailwind's spacing scale:
- `p-2` - 8px
- `p-4` - 16px
- `p-6` - 24px
- `gap-4` - 16px
- `gap-6` - 24px

## Border Radius

- `rounded-md` - 6px (Default)
- `rounded-lg` - 8px (Cards)
- `rounded-xl` - 12px (Large cards)
- `rounded-2xl` - 16px (Extra large cards)
- `rounded-3xl` - 24px (Onboarding cards)
- `rounded-[2rem]` - 32px (Market cards)
- `rounded-[4rem]` - 64px (Onboarding containers)
- `rounded-full` - 9999px (Badges, Pills, Buttons)

## Shadows

- `shadow-sm` - Subtle elevation
- `shadow` - Default elevation
- `shadow-lg` - High elevation (Modals)

