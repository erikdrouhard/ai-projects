# templates

TypeScript templates, type conventions, and patterns extracted from the
[Vercel AI SDK](https://github.com/vercel/ai) (`packages/ai`, `packages/provider`,
`packages/provider-utils`, `packages/react`, and the provider packages such as
`packages/openai`).

These files are not a runnable project. They are a starting point for building
AI applications and custom providers that follow the same shape as the AI SDK.

## Layout

```
templates/
  core/           generateText / streamText / generateObject patterns and shared types
  tools/          Tool and ToolSet definitions, tool-call types
  providers/      Provider factory and LanguageModelV2 contract
  agent/          Agent interface and tool-loop agent template
  ui/             UIMessage types, Next.js route handler, React useChat pattern
  conventions.md  Naming, generics, and file-layout conventions used by the SDK
```

## Conventions at a glance

- **Generic parameter order** on top-level functions: `<TOOLS, USER_CONTEXT, OUTPUT>`.
- **Type-level naming**: `ToolSet`, `ModelMessage`, `CallSettings`, `LanguageModelV2`.
- **Input shape**: every top-level call is `CallSettings & Prompt & { model, tools?, ... }`.
- **Return shape**: `generateText` is `Promise<GenerateTextResult<...>>`;
  `streamText` returns `StreamTextResult<...>` synchronously with `textStream`,
  `fullStream`, and awaitable `text`/`usage`/`finishReason` promises.
- **Prompt discriminated union**: exactly one of `prompt` or `messages`.
- **Providers** expose a `createX(settings)` factory returning a callable object
  with `languageModel`, `chat`, `completion`, `embedding`, etc.
- **Language model contract** is versioned: `specificationVersion: 'v2'`,
  `doGenerate`, `doStream`. The `do`-prefix signals "not for user code".
- **UI parts** use explicit states: `'input-streaming' | 'input-available' |
  'output-available' | 'output-error'`, etc.
- **Experimental surface** uses the `experimental_` prefix on callbacks and options.

## Rules

- Every project gets its own folder with its own `CLAUDE.md` and `AGENTS.md`.
- `CLAUDE.md` and `AGENTS.md` must stay identical at this level. When one is
  updated, update the other to match.
- All files stay inside this `templates/` folder.
