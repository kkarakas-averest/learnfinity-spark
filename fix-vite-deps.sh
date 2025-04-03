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
pnpm store prune

# Reinstall dependencies
echo "Reinstalling dependencies..."
rm -rf node_modules
pnpm install

# Start dev server
echo "Starting development server..."
pnpm run dev 