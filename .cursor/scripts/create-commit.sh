#!/bin/bash
# Helper script to create commits easily
# Loads .env automatically and runs the create-commit script

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep LINEAR | xargs)
fi

# Run the TypeScript script with all arguments passed through
pnpm tsx .cursor/scripts/create-commit.ts "$@"

