#!/bin/bash
set -e
pnpm install --frozen-lockfile
if [ -d ".local/tasks" ]; then
  mkdir -p docs/tasks
  cp -r .local/tasks/. docs/tasks/
fi
