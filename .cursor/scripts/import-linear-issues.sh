#!/bin/bash
# Import Linear Issues from CSV
# 
# Wrapper script for import-linear-issues-from-csv.ts
# Automatically loads .env file if it exists

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep LINEAR | xargs)
fi

# Check if API key is set
if [ -z "$LINEAR_API_KEY" ]; then
  echo "❌ LINEAR_API_KEY not found in .env file"
  echo "   Add it: LINEAR_API_KEY=lin_api_..."
  exit 1
fi

# Run the TypeScript script with all arguments passed through
pnpm tsx .cursor/scripts/import-linear-issues-from-csv.ts "$@"

