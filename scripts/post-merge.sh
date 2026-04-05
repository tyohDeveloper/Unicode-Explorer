#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
if [ -d ".local/tasks" ]; then
  mkdir -p docs/tasks
  cp -r .local/tasks/. docs/tasks/
fi
