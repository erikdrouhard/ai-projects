#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Add project-specific dependency installation below as projects are added.
# Examples:
#   cd "$CLAUDE_PROJECT_DIR/my-node-project" && npm install
#   cd "$CLAUDE_PROJECT_DIR/my-python-project" && pip install -r requirements.txt
