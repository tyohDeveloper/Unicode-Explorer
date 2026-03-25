# Export task plans to docs/tasks/

## What & Why
Copy all existing plan files from the agent's internal `.local/tasks/` directory into a new `docs/tasks/` folder in the project root. Since `.local/` is not accessible from the user's shell or git, this makes the development history visible and committable.

## Done looks like
- A `docs/tasks/` folder exists in the project root and is visible in the file explorer
- Each task's plan file is present, named to reflect its task ref and title (e.g. `01-unicode-character-explorer.md`)
- The files are plain markdown and readable without any tooling
- The folder is tracked by git (not ignored)

## Out of scope
- Automatically syncing future task plans to this folder (that can be a follow-up)
- Modifying the content of the plan files

## Tasks
1. Create the `docs/tasks/` directory and copy each plan file from `.local/tasks/` into it, renaming files to include their task ref number and a short title slug (e.g. `01-unicode-character-explorer.md` through `08-copy-space-separated.md`).

## Relevant files
- `.local/tasks/unicode-explorer.md`
- `.local/tasks/phonetic-category-collapse-defaults.md`
- `.local/tasks/table-sort.md`
- `.local/tasks/fix-missing-characters.md`
- `.local/tasks/category-select-all.md`
- `.local/tasks/composition-pad.md`
- `.local/tasks/move-modifier-tone-letters.md`
- `.local/tasks/copy-space-separated.md`
