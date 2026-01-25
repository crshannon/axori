#!/bin/bash
# Clear various caches that might cause TypeScript import issues

echo "🧹 Clearing caches..."

# Clear Turbo cache
echo "Clearing Turbo cache..."
rm -rf .turbo

# Clear Vite caches
echo "Clearing Vite caches..."
find . -type d -name ".vite" -prune -exec rm -rf {} + 2>/dev/null || true

# Clear TypeScript build info
echo "Clearing TypeScript build info..."
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true

# Clear dist folders
echo "Clearing dist folders..."
find . -type d -name "dist" -prune -exec rm -rf {} + 2>/dev/null || true

# Clear node_modules/.cache
echo "Clearing node_modules caches..."
find . -type d -path "*/node_modules/.cache" -prune -exec rm -rf {} + 2>/dev/null || true

# Clear pnpm store (optional - commented out as it requires permissions)
# echo "Clearing pnpm store..."
# pnpm store prune

echo "✅ Cache clearing complete!"
echo ""
echo "Next steps:"
echo "1. Run: pnpm install"
echo "2. Try your command again"
