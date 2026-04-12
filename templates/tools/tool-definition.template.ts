/**
 * Defining a tool
 * ---------------------------------------------------------------------------
 * This template shows the idiomatic way to define a tool for `generateText`
 * or `streamText`. Mirrors the `tool()` helper exported from `ai` /
 * `@ai-sdk/provider-utils`.
 *
 * Convention:
 *   - Tools are grouped into a plain object (`satisfies ToolSet` keeps
 *     tool names narrow for inference).
 *   - Prefer Zod (or any schema library with a JSON Schema adapter) for
 *     `inputSchema`. It drives both validation and the JSON schema sent to
 *     the model.
 *   - Execution returns a plain value OR a promise. Throwing inside execute
 *     is allowed; the SDK emits a `tool-error` event.
 *   - Omit `execute` for "client-side" tools: generation pauses and the host
 *     app (often a React component) supplies the result via `addToolOutput`.
 */
import type { Tool, ToolSet, Schema } from './tool-set.types';

/**
 * Identity helper, just like `tool()` in the AI SDK. It exists purely to
 * constrain the generic parameters and help TypeScript infer INPUT / OUTPUT.
 */
export function tool<INPUT, OUTPUT>(
  definition: Tool<INPUT, OUTPUT>,
): Tool<INPUT, OUTPUT> {
  return definition;
}

/**
 * Example: a weather tool.
 *
 * Replace the `Schema<...>` with a real Zod schema in your project:
 *
 *     import { z } from 'zod';
 *     inputSchema: z.object({ location: z.string() })
 */
declare const stringSchema: Schema<{ location: string }>;
declare const weatherOutputSchema: Schema<{
  location: string;
  temperatureC: number;
  condition: string;
}>;

export const weatherTool = tool({
  description: 'Get the current weather in a given location',
  inputSchema: stringSchema,
  outputSchema: weatherOutputSchema,
  async execute({ location }, { abortSignal }) {
    const response = await fetch(
      `https://example.com/weather?location=${encodeURIComponent(location)}`,
      { signal: abortSignal },
    );
    if (!response.ok) {
      throw new Error(`weather: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as {
      location: string;
      temperatureC: number;
      condition: string;
    };
  },
});

/**
 * Example: a client-side "ask the user" tool (no `execute`). The tool-loop
 * halts when this is called; the host app resolves it via `addToolOutput`.
 */
declare const askUserInputSchema: Schema<{ question: string }>;
declare const askUserOutputSchema: Schema<{ answer: string }>;

export const askUser = tool({
  description: 'Ask the end user a clarifying question',
  inputSchema: askUserInputSchema,
  outputSchema: askUserOutputSchema,
  experimental_needsApproval: false,
});

/**
 * Assemble a ToolSet. Using `satisfies` (instead of a type annotation)
 * preserves the literal keys so `ToolChoice<typeof tools>` can narrow to
 * `'weather' | 'askUser'` at call sites.
 */
export const tools = {
  weather: weatherTool,
  askUser,
} satisfies ToolSet;

export type AppTools = typeof tools;
