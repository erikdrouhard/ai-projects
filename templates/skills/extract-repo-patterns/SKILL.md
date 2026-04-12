---
name: extract-repo-patterns
description: Extract TypeScript/JavaScript patterns, type conventions, factory shapes, and public-API idioms from a GitHub repository into a local templates/ folder that developers can use as a reference scaffold. Use this whenever the user points at an open-source SDK or library (like vercel/ai, tRPC, drizzle, zod, hono) and asks to extract patterns, conventions, type shapes, SDK idioms, starter templates, boilerplate, scaffolds, or a cheat sheet — even if they do not say the word "template" explicitly. Also trigger for phrasings like "study how <library> structures its types", "build a client with the same shape as <repo>", "give me the public API surface of <repo>", or "I want to mirror the conventions of <library>". This is the right tool whenever the goal is a compact, typed, reference-quality distillation of an existing codebase's public surface rather than running or forking it.
---

# Extract Repo Patterns

Take a GitHub repository — usually an SDK or library — and distill its public
API surface, type conventions, factory patterns, and idioms into a local
`templates/` folder. The output is a reference scaffold: a compact, typed,
navigable cheat sheet that a developer can lean on when building their own
client, server, or wrapper around the library.

The goal is **faithful reproduction of shape**, not a runnable fork. Declarations
beat implementations. Real generic signatures beat simplified stand-ins.

## When to use this skill

Trigger whenever the user's goal is to learn, reuse, or mirror the _shape_
of a public library instead of running it. Typical phrasings:

- "Extract patterns from `<repo>`"
- "Look at `<repo>` and give me templates / scaffolds / a starter"
- "I want to build a client (or SDK / server / wrapper) with the same shape as `<repo>`"
- "What are the type conventions in `<repo>`?"
- "Turn `<repo>` into a cheat sheet I can drop into my project"
- "Show me the public API surface of `<repo>`"

The user usually names a target folder (`templates/`, `reference/`, etc.).
If they don't, default to `templates/` at the workspace root.

## What "extracting patterns" means here

The output is a small, typed, reference-quality distillation. Think of it as
what you would hand a new engineer on day one of building a wrapper around
the library. A typical distillation contains:

1. **The public API shape.** For every top-level function the library
   exports, capture the full generic signature, the options interface, and
   the return type — all the way down to the discriminated unions a user
   will see. Prefer faithful reproduction of the upstream type system over
   simplification.
2. **Core types.** The shared types that flow through the API: message
   shapes, content parts, call settings, schema helpers, result types.
3. **Extensibility primitives.** How the library lets users plug in their
   own stuff — tool definitions, provider factories, middleware, transforms,
   routers, schema builders.
4. **Higher-level abstractions.** Agents, clients, servers, routers —
   whatever the library wraps on top of its primitives.
5. **UI / framework bindings.** If the library has React / Svelte / Vue
   glue, capture the hook signatures and the canonical component shape.
6. **A conventions doc.** A short `conventions.md` that calls out naming
   rules, generic parameter order, experimental-surface conventions,
   version discriminators, and anything else that isn't obvious from
   reading individual type files.
7. **Project docs.** `CLAUDE.md` and `AGENTS.md` explaining what the
   folder is and what conventions it follows. In this workspace they must
   stay identical at the same level (see the workspace `CLAUDE.md`).

## Workflow

### 1. Clarify the target

Before extracting, nail down three things:

- **The repo URL** — and branch if the user cares. Default to `main`.
- **Where the templates land.** Default to `templates/` at the workspace
  root. If a folder with that name already exists, ask whether to extend
  it or create a sibling (`templates-<repo>/`).
- **Breadth vs depth.** Does the user want a broad survey of the whole
  public surface, or a narrow slice (e.g. "just the provider factory
  pattern")? Bias toward a complete survey unless they narrow it.

If any of these is already clear from context, skip the question.

### 2. Survey the repo

Start wide, then drill in. For a typical TypeScript monorepo:

1. Fetch the root README and the top-level directory listing to learn
   the package layout.
2. List `packages/` (or `src/`) to find the core package and any
   interesting sub-packages (providers, framework bindings, utilities).
3. Identify the canonical top-level functions — read the core package's
   `src/index.ts` (or equivalent) to see what the library actually exports.
4. For each top-level function, fetch the implementation file to read
   the real generic signature. Do not guess — the types matter, and
   inferring the wrong generic order defeats the point of the exercise.

Useful conventions while surveying:

- Use WebFetch on `raw.githubusercontent.com/<org>/<repo>/<branch>/<path>`
  for full file content. GitHub's HTML view is fine for directory
  listings but tends to truncate long files and strip JSDoc.
- If a raw URL 404s (renamed paths are common across refactors), fall
  back to the HTML directory listing (`github.com/<org>/<repo>/tree/<branch>/<path>`)
  and pick the real filename from there.
- **Run WebFetch calls in parallel** whenever they don't depend on each
  other. Fetching files serially is the slowest part of this skill; batch
  aggressively.
- Cache what you learn as you go — once you know the core package is
  `packages/ai`, you don't need to rediscover it for each subsequent file.

### 3. Design the output layout

Match the shape of the upstream library. A common layout for an SDK:

```
templates/
  CLAUDE.md                 # project docs
  AGENTS.md                 # identical to CLAUDE.md
  conventions.md            # naming, generics, experimental surface, etc.
  core/                     # top-level functions + shared types
  tools/                    # extensibility primitives
  providers/                # factory + contract for plugging in backends
  agent/                    # higher-level abstractions (if present)
  ui/                       # framework bindings + UI message types
```

Adapt the folders to the library. A router library might want
`router/`, `server/`, `client/` instead of `core/`, `providers/`, `ui/`.
A validation library might just want `core/` and `integrations/`. Prune
any folder that doesn't apply rather than leaving it empty.

### 4. Write the templates

For each file:

- **Be faithful to the upstream types.** If the real signature is
  `generateText<TOOLS, USER_CONTEXT, OUTPUT>(options: CallSettings & Prompt & {...})`,
  don't dumb it down to `generateText(options: GenerateTextOptions)`.
  The whole point is to show the user the _actual_ shape.
- **Start every file with a docblock** that names the upstream source
  file (`Mirrors packages/ai/src/generate-text/generate-text.ts in vercel/ai`)
  and lists 3–5 conventions the file embodies. Future readers — including
  the user a week from now — need to know where to look when upstream
  drifts.
- **Declare rather than implement.** Use `export declare function` and
  `declare class` freely. The templates are a reference, not runnable
  code. Implementations should only appear when they illustrate a pattern
  the user needs to copy verbatim (e.g. the provider factory that makes
  a callable object with named methods, or an agent's option-merge logic).
- **Cross-reference with imports.** Templates should import from each
  other so the graph of types mirrors upstream. It helps navigation, and
  it turns into useful TS errors when the user later starts wiring them
  up for real.
- **Include a minimal example per pattern** where it helps (one tool,
  one provider factory, one React component) rather than burying the
  reader in types alone.
- **Use `satisfies` over type annotations** for literal objects where the
  narrow key inference matters — e.g. `{ weather: …, search: … } satisfies ToolSet`
  so `keyof typeof tools` stays narrow. This is a real upstream idiom and
  erasing it is a common mistake.
- **Preserve generic parameter names** verbatim (`TOOLS`, `USER_CONTEXT`,
  `OUTPUT` — not `T`, `C`, `O`). Readers use the names to navigate.
- **Don't invent features the upstream doesn't have.** If something is
  unclear from the source, leave a `TODO` comment pointing at the
  upstream file rather than guessing at its behavior.

### 5. Write `conventions.md`

This file pays for itself every time the user revisits the templates.
Capture:

- Package layout (who owns what).
- Naming conventions: function case, type case, generic parameter style
  (e.g. `SCREAMING_SNAKE_CASE` generics are common in SDKs), method
  prefixes like `do…` that signal "implementation, not user-facing",
  `experimental_…` prefixes, and version discriminators like
  `specificationVersion: 'v2'` or `version: 'agent-v1'`.
- Input and output shape conventions — e.g. "every top-level call is
  `CallSettings & Prompt & { model, tools?, ... }`".
- Error and warning conventions (returned as data vs thrown).
- Streaming part shapes if the library streams.

Keep it to one screen per topic. This is a reference, not a textbook.

### 6. Write `CLAUDE.md` and `AGENTS.md`

Keep them identical. Explain what the folder is, what it is not (not
runnable), and where the conventions doc lives. Follow any
workspace-level rules — in this workspace, a project's `CLAUDE.md` and
`AGENTS.md` must stay in sync at the same level.

### 7. Finish with a summary

End the session with a summary of what got templatized, grouped by
folder, with one short line per file. This is what the user will scroll
back to a week later when they've forgotten what they have.

If the user is on a feature branch, commit and push under a clear
message like `Add templates extracted from <org>/<repo>`. Don't open a
PR unless asked.

## Output contract

The user should be able to open `templates/` and, within 60 seconds:

1. Tell you which library the templates came from (docblocks + `conventions.md`).
2. Point at the top-level functions of that library in `core/`.
3. Point at the extensibility primitives in `tools/` / `providers/`.
4. State the naming conventions without reading any code, by reading
   `conventions.md`.

If any of those take longer than 60 seconds, the templates are not tight
enough. Tighten the docblocks and the conventions doc before wrapping up.

## Anti-patterns to avoid

- **Running the library.** This skill is strictly about shape. Don't
  `npm install` anything.
- **Over-simplifying types.** If you find yourself writing
  `options: Record<string, unknown>` where upstream has a real
  discriminated union, stop and reproduce the real union. The templates
  are worthless if they erase the type information that made them worth
  extracting in the first place.
- **Silently dropping generics.** `<TOOLS, USER_CONTEXT, OUTPUT>` is not
  the same as `<T, C, O>` to a reader skimming the file. Keep the
  upstream order and names.
- **Copying huge implementation bodies.** Declarations and small example
  bodies are enough. If you find yourself pasting 200 lines of
  implementation, ask whether that implementation is actually a _pattern_
  the user needs to reuse. It usually isn't.
- **Guessing at upstream behavior.** If the file you want 404s and the
  directory listing doesn't help, fetch a neighbor file for context or
  tell the user what you couldn't find.
- **Inventing folders the library doesn't have.** An `agent/` folder is
  wonderful for vercel/ai but pointless for zod. Match the upstream
  structure, prune empty folders.

## Defaults when the user is vague

- Target folder: `templates/` at the workspace root.
- Layout: `core/`, plus any of `tools/`, `providers/`, `agent/`, `ui/`
  that the upstream supports. Prune aggressively.
- Always include `conventions.md`.
- Always write `CLAUDE.md` and `AGENTS.md` (identical).
- Commit on the current feature branch with a descriptive message.
- Don't open a pull request unless asked.

## A concrete reference

The canonical example of this skill's output is the `templates/` folder
at the workspace root of this project — generated from
[vercel/ai](https://github.com/vercel/ai). See
`references/example-vercel-ai.md` for a walk-through of how that output
maps back to upstream paths, so you can mirror the same level of rigor
on a new repo.
