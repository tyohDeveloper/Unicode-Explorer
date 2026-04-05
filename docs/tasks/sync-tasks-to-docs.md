# Sync .local/tasks to docs/tasks on merge

## What & Why
Add a step to the post-merge script so that every time a task is merged, the contents of `.local/tasks/` are automatically copied into `docs/tasks/`. This keeps a version-controlled snapshot of all task plans in sync with the repository after every commit.

## Done looks like
- After each task merge, `docs/tasks/` contains the same files as `.local/tasks/`
- No manual copy step is needed — it happens automatically

## Out of scope
- Renaming or restructuring existing files in either directory
- Any other changes to the post-merge script

## Tasks
1. Append a `cp -r .local/tasks/. docs/tasks/` command to `scripts/post-merge.sh` so task plan files are mirrored to `docs/tasks/` on every merge.

## Relevant files
- `scripts/post-merge.sh`
- `docs/tasks`
