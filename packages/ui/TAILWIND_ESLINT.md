# Tailwind CSS ESLint Plugin

## Status: ✅ Implemented

We're using `eslint-plugin-better-tailwindcss` to enforce Tailwind CSS best practices in our UI components. This plugin fully supports Tailwind CSS v4.

### Current Implementation

- **Project uses**: Tailwind CSS v4.0.6
- **Plugin**: `eslint-plugin-better-tailwindcss` (latest)
- **Status**: ✅ Fully configured and working with Tailwind v4
- **Entry Point**: Configured to use `apps/web/src/styles.css`

### Plugin Features

The plugin provides:

1. **Stylistic Rules** (warnings by default):
   - `enforce-consistent-line-wrapping` - Auto-wrap long class strings
   - `enforce-consistent-class-order` - Sort classes consistently
   - `enforce-shorthand-classes` - Prefer shorthand utilities
   - `no-duplicate-classes` - Remove duplicate classes
   - And more...

2. **Correctness Rules** (errors by default):
   - `no-unknown-classes` - Report invalid Tailwind classes
   - `no-conflicting-classes` - Report conflicting styles
   - `no-restricted-classes` - Disallow specific classes

3. **Auto-fix**: Many rules can automatically fix issues

### Configuration

The plugin is configured in `packages/ui/eslint.config.js`:

- Uses `recommended` config (both stylistic and correctness rules)
- Configured to detect classes in: `cn`, `clsx`, `twMerge`, `cva`, and other common utilities
- Entry point points to `apps/web/src/styles.css` for Tailwind v4 class detection

### Resources

- **Plugin Repository**: https://github.com/schoero/eslint-plugin-better-tailwindcss
- **Documentation**: https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/README.md
- **Rules Documentation**: See the `/docs/rules/` directory in the repository

### Usage

The plugin automatically runs when you:
- Run `pnpm --filter @axori/ui lint`
- Run `pnpm --filter @axori/ui lint:fix` (auto-fixes issues)
- Use ESLint in your editor with auto-fix on save

### Customization

To customize rules, edit `packages/ui/eslint.config.js`:

```javascript
rules: {
  // Override specific rules
  'better-tailwindcss/no-unknown-classes': 'warn', // Change to warning
  'better-tailwindcss/enforce-consistent-class-order': 'off', // Disable
  // ... other rules
}
```

### Supported Utilities

The plugin automatically detects Tailwind classes in:
- `cn()` (from `@axori/ui/src/utils/cn.ts`)
- `clsx()`
- `twMerge()`, `twJoin()`
- `cva()` (class-variance-authority)
- And other common utilities
