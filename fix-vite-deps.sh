
#!/bin/bash

# Stop any running dev servers
echo "Stopping any running development servers..."
pkill -f "vite" || true
pkill -f "node" || true

# Clear Vite cache
echo "Clearing Vite cache..."
rm -rf node_modules/.vite

# Clear package manager cache
echo "Clearing package manager cache..."
pnpm store prune || npm cache clean --force || yarn cache clean

# Reinstall dependencies without frozen lockfile
echo "Reinstalling dependencies..."
rm -rf node_modules
pnpm install --no-frozen-lockfile || npm install || yarn

# Fix TypeScript configuration references
echo "Fixing TypeScript configuration references..."
grep -q '"references": \[\]' tsconfig.local.json || echo "Warning: Check tsconfig.local.json references section"

# Start dev server
echo "Starting development server..."
pnpm run dev || npm run dev || yarn dev
