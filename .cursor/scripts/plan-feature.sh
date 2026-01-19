#!/bin/bash
# Helper script to plan features easily
# Loads .env automatically and runs the plan-feature script

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep LINEAR | xargs)
fi

# Run the TypeScript script with all arguments passed through
pnpm tsx .cursor/scripts/plan-feature.ts "$@"

