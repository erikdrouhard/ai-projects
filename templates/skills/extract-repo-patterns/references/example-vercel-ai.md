# Example: extracting patterns from vercel/ai

This is a walk-through of the canonical output this skill produces, using
the real run that generated the sibling `templates/` folder from
[vercel/ai](https://github.com/vercel/ai). When you run the skill on a
fresh repo, aim for the same level of rigor: every file should have a
docblock pointing upstream, the top-level generic signatures should match,
and `conventions.md` should let a reader skip the code entirely and still
learn the library's style.

## Output tree

```
templates/
  CLAUDE.md                                # identical to AGENTS.md
  AGENTS.md                                # identical to CLAUDE.md
  conventions.md                           # SDK-wide conventions reference
  core/
    call-settings.types.ts                 # CallSettings, ProviderOptions
    messages.types.ts                      # ModelMessage + content parts + Prompt union
    generate-text.template.ts              # generateText signature + result types
    stream-text.template.ts                # streamText + TextStreamPart + transforms
    generate-object.template.ts            # generateObject + FlexibleSchema + result
  tools/
    tool-set.types.ts                      # Tool / ToolSet / TypedToolCall
    tool-definition.template.ts            # tool() helper + example tools
  providers/
    language-model-v2.types.ts             # LanguageModelV2 contract
    custom-provider.template.ts            # createMyProvider factory pattern
  agent/
    agent.types.ts                         # Agent interface
    tool-loop-agent.template.ts            # reference ToolLoopAgent class
  ui/
    ui-messages.types.ts                   # UIMessage + UIMessagePart + states
    next-api-route.template.ts             # Next.js App Router POST handler
    use-chat.template.tsx                  # React useChat component
```

## How each file maps back to upstream

| Template                                | Upstream source                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `core/call-settings.types.ts`           | `packages/ai/src/prompt/call-settings.ts`                                       |
| `core/messages.types.ts`                | `packages/ai/src/prompt/message.ts` + `prompt.ts`                               |
| `core/generate-text.template.ts`        | `packages/ai/src/generate-text/generate-text.ts`                                |
| `core/stream-text.template.ts`          | `packages/ai/src/generate-text/stream-text.ts`                                  |
| `core/generate-object.template.ts`      | `packages/ai/src/generate-object/generate-object.ts`                            |
| `tools/tool-set.types.ts`               | `packages/provider-utils/src/tool.ts` + `generate-text/tool-call.ts`            |
| `tools/tool-definition.template.ts`     | Idiomatic usage extracted from examples and the `tool()` helper                 |
| `providers/language-model-v2.types.ts`  | `packages/provider/src/language-model/v2/language-model-v2.ts`                  |
| `providers/custom-provider.template.ts` | `packages/openai/src/openai-provider.ts` (pattern, not code)                    |
| `agent/agent.types.ts`                  | `packages/ai/src/agent/agent.ts`                                                |
| `agent/tool-loop-agent.template.ts`     | `packages/ai/src/agent/tool-loop-agent.ts`                                      |
| `ui/ui-messages.types.ts`               | `packages/ai/src/ui/ui-messages.ts`                                             |
| `ui/next-api-route.template.ts`         | `examples/next-openai/app/api/chat/route.ts` pattern                            |
| `ui/use-chat.template.tsx`              | `packages/react/src/use-chat.ts` + `next-openai` component pattern              |

## Rigor checks that made the difference

- **Generic parameter fidelity.** Every top-level function kept the
  upstream `<TOOLS, USER_CONTEXT, OUTPUT>` order and names. Dropping these
  for `<T, C, O>` would have silently broken the whole point of the file.
- **Discriminated unions preserved.** `Prompt` is "exactly one of `prompt`
  or `messages`", `TypedToolCall<TOOLS>` is `StaticToolCall | DynamicToolCall`,
  `TextStreamPart` is a 15-variant tagged union — all reproduced as-is.
- **`satisfies ToolSet`** in the example `tools` object, not `: ToolSet`,
  so downstream `ToolChoice<typeof tools>` can narrow to the literal keys.
- **`specificationVersion: 'v2'` and `version: 'agent-v1'`** captured as
  string literals on the right types, because the upstream uses these as
  runtime version discriminators.
- **`do…` method prefix** on `LanguageModelV2` captured and _explained in
  conventions.md_: the prefix signals "not for user code" so future
  readers don't try to call `doGenerate` directly.
- **`experimental_` prefix** preserved on every callback/option that had
  it upstream, with a one-line explanation in `conventions.md`.
- **Provider factory callable pattern.** `createMyProvider` returns an
  object that is both callable (`myProvider('model-id')`) _and_ has named
  methods (`myProvider.languageModel(...)`). This is a real vercel/ai
  idiom — trivial to miss, valuable to show.

## What the summary looked like

The session ended with a grouped summary: one paragraph per folder, one
short line per file. That summary is the single most-used artifact when
the user comes back to the templates — prioritize writing it well.
