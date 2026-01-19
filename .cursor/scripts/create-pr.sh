#!/bin/bash
# Helper script to create GitHub PRs easily
# Loads .env automatically and runs the create-pr script

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep GITHUB | xargs)
fi

# Check if token is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN not found in .env file"
  echo "   Add it: GITHUB_TOKEN=ghp_..."
  echo "   Get token from: https://github.com/settings/tokens"
  exit 1
fi

# Run the TypeScript script with all arguments passed through
pnpm tsx .cursor/scripts/create-pr.ts "$@"

