#!/bin/bash
# Setup Linear Labels
# Creates standard labels in Linear for the Axori team

set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required environment variables
if [ -z "$LINEAR_API_KEY" ]; then
  echo "❌ ERROR: LINEAR_API_KEY environment variable is required"
  echo "   Set it in your .env file or export it:"
  echo "   export LINEAR_API_KEY=your_api_key"
  exit 1
fi

if [ -z "$LINEAR_TEAM_ID" ]; then
  echo "❌ ERROR: LINEAR_TEAM_ID environment variable is required"
  echo "   Set it in your .env file or export it:"
  echo "   export LINEAR_TEAM_ID=your_team_id"
  exit 1
fi

# Run the TypeScript script
pnpm tsx .cursor/scripts/setup-linear-labels.ts
