# AI Projects Workspace

This is a multi-project workspace. Each project lives in its own folder.

## Project Structure

```
ai-projects/
  CLAUDE.md
  AGENTS.md
  <project-name>/
    CLAUDE.md
    AGENTS.md
```

## Rules

- Every project gets its own folder with its own `CLAUDE.md` and `AGENTS.md`.
- `CLAUDE.md` and `AGENTS.md` must stay identical **at the same level**. When one is updated, update the other to match. Top-level syncs with top-level. Project-level syncs with project-level. No cross-level syncing.
- When working on a project, **all files and folders stay inside that project's folder**. Do not create files at the top level or in other projects.

## Creating a New Project

When asked to "create a new project":

1. Ask for the project name.
2. Create the project folder.
3. Create `CLAUDE.md` and `AGENTS.md` inside it (identical pair) with project-specific context.
