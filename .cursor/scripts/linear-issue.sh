#!/bin/bash
# Helper script to create Linear issues easily
# Loads .env automatically and runs the create-linear-issue script

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
pnpm tsx .cursor/scripts/create-linear-issue.ts "$@"

