# AI SDK conventions

A quick reference to the conventions the templates in this folder follow.
All of these are taken straight from the
[Vercel AI SDK](https://github.com/vercel/ai) source.

## Package layout

| Package                         | Role                                                            |
| ------------------------------- | --------------------------------------------------------------- |
| `ai` (`packages/ai`)            | Public API: `generateText`, `streamText`, `generateObject`, UI  |
| `@ai-sdk/provider`              | Versioned contracts (`LanguageModelV2`, `EmbeddingModelV2`, ...) |
| `@ai-sdk/provider-utils`        | Shared helpers (`tool`, `asSchema`, ID generation, JSON parsing) |
| `@ai-sdk/<provider>`            | One package per provider (`openai`, `anthropic`, `google`, ...) |
| `@ai-sdk/react` / `svelte` / `vue` | Framework bindings (`useChat`, `useCompletion`, `useObject`)  |

Each provider package looks the same: a `create<Name>` factory, a default
singleton, a `chat` / `completion` / `embedding` / `image` method surface, and
internal model classes that implement the versioned contract from
`@ai-sdk/provider`.

## Naming

| Kind                                | Style                                      | Examples                                |
| ----------------------------------- | ------------------------------------------ | --------------------------------------- |
| Top-level functions                 | `camelCase`                                | `generateText`, `streamObject`          |
| Types and interfaces                | `PascalCase`                               | `ToolSet`, `ModelMessage`               |
| Generic parameters                  | `SCREAMING_SNAKE_CASE`                     | `TOOLS`, `USER_CONTEXT`, `OUTPUT`       |
| Provider methods ("do the thing")   | `do<Action>`                               | `doGenerate`, `doStream`, `doEmbed`     |
| Experimental surface                | `experimental_` prefix                     | `experimental_transform`, `experimental_output` |
| Specification version               | `specificationVersion: 'v2'`               | Bumped on breaking contract changes     |
| Agent version                       | `version: 'agent-v1'`                      | Same idea, scoped to the Agent contract |

## Input and output shapes

- Every top-level call is `CallSettings & Prompt & { model, tools?, ... }`.
- `Prompt` is a discriminated union: exactly one of `prompt` or `messages`.
- `generateText` is `async`; `streamText` is synchronous and returns a result
  object exposing `textStream`, `fullStream`, and awaitable promises
  (`text`, `usage`, `finishReason`, `steps`, ...).
- `generateObject` keys off an `output` discriminator: `'object' | 'array' |
  'enum' | 'no-schema'`. The schema type is inferred back into the result.

## Tools

- A `ToolSet` is a plain object keyed by tool name.
- Prefer `satisfies ToolSet` over a type annotation so the keys stay narrow
  (enables `ToolChoice<typeof tools>`).
- `tool(...)` is an identity helper whose only job is to infer `INPUT` / `OUTPUT`.
- A tool without `execute` is "client-side": generation pauses on the call
  and the host app supplies the result via `addToolOutput`.
- Tool calls split into `StaticToolCall<TOOLS>` (typed) and `DynamicToolCall`
  (unknown toolName at runtime). The public type is `TypedToolCall<TOOLS>`.

## Messages

Two message layers:

1. **`ModelMessage`** - what the model sees. Roles: `system` / `user` /
   `assistant` / `tool`. Content is a plain string OR an array of typed parts
   (`TextPart`, `ImagePart`, `FilePart`, `ReasoningPart`, `ToolCallPart`,
   `ToolResultPart`).
2. **`UIMessage`** - what the UI renders. Roles: `system` / `user` /
   `assistant`. Content is always `parts: UIMessagePart[]`, and each
   streamable part carries an explicit `state` (`'streaming' | 'done'`,
   `'input-streaming' | 'input-available' | 'output-available' |
   'output-error' | 'approval-requested' | ...`).

`convertToModelMessages(uiMessages)` bridges the two on the server.

## Providers

- Factory: `createFoo(settings: FooProviderSettings): FooProvider`.
- Default singleton: `export const foo = createFoo()`.
- The provider is CALLABLE (`foo('model-id')`) AND has named methods
  (`foo.languageModel(...)`, `foo.chat(...)`, `foo.embedding(...)`).
- Model ids are a string literal union + `(string & {})` escape hatch.
- Settings ALWAYS support `apiKey`, `baseURL`, `headers`, `fetch`. Secrets
  are read lazily from `process.env.*` so the default singleton stays safe.

## Errors and warnings

- Unsupported settings produce `CallWarning[]` (data), not exceptions.
- Provider errors inherit from `AISDKError` with a discriminated `name` so
  callers can switch (`APICallError`, `InvalidArgumentError`, `NoSuchToolError`,
  `TypeValidationError`, ...).
- Schema validation surfaces via `experimental_repairText` for `generateObject`.

## Streaming

- The server returns `result.toUIMessageStreamResponse()`; the client uses
  `@ai-sdk/react`'s `useChat` to consume it.
- The "full" stream (`result.fullStream`) is a tagged union of parts:
  `text-delta`, `tool-call`, `tool-result`, `finish-step`, `finish`, `error`,
  etc. Rendering code switches on `part.type`.
- Transforms are `TransformStream<TextStreamPart, TextStreamPart>` factories
  so they can be composed left-to-right via `experimental_transform: [a, b]`.

## Agents

- `Agent<CALL_OPTIONS, TOOLS, USER_CONTEXT, OUTPUT>` bundles model + tools +
  instructions + stop conditions into a reusable unit.
- Both `generate` and `stream` return the SAME shapes as the standalone
  functions, so swapping between them is trivial.
- `ToolLoopAgent` is the reference implementation. It delegates to
  `generateText` / `streamText` after merging settings with per-call options.
