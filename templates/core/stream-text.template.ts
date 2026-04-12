/**
 * streamText
 * ---------------------------------------------------------------------------
 * Streaming text generation. Mirrors `packages/ai/src/generate-text/
 * stream-text.ts` in vercel/ai.
 *
 * Convention:
 *   - `streamText` returns the result SYNCHRONOUSLY (no `Promise`). The
 *     caller reads `textStream` / `fullStream` and awaits individual
 *     promises like `result.text` or `result.usage`.
 *   - Same generic parameter order as `generateText`: <TOOLS, USER_CONTEXT, OUTPUT>.
 *   - `onChunk` is the streaming-specific callback. `onFinish` fires once
 *     the full stream is consumed.
 *   - The result exposes multiple stream views over the same underlying
 *     source: `textStream` (plain strings) and `fullStream` (typed parts).
 */
import type { ProviderOptions } from './call-settings.types';
import type { Prompt, ModelMessage } from './messages.types';
import type { LanguageModel } from '../providers/language-model-v2.types';
import type { ToolSet, TypedToolCall, TypedToolResult } from '../tools/tool-set.types';
import type {
  GenerateTextOptions,
  GenerateTextResult,
  StepResult,
  FinishReason,
  LanguageModelUsage,
  StepContent,
} from './generate-text.template';

// ---------- Options ---------------------------------------------------------

export interface StreamTextOptions<
  TOOLS extends ToolSet = {},
  USER_CONTEXT = unknown,
  OUTPUT = string,
> extends Omit<GenerateTextOptions<TOOLS, USER_CONTEXT, OUTPUT>, 'onFinish'> {
  /** Fired for each streaming chunk. */
  onChunk?: (event: { chunk: TextStreamPart<TOOLS> }) => void | Promise<void>;

  /** Fired on unrecoverable errors during streaming. */
  onError?: (event: { error: unknown }) => void | Promise<void>;

  /** Fired once the full stream has been consumed. */
  onFinish?: (
    event: GenerateTextResult<TOOLS, USER_CONTEXT, OUTPUT>,
  ) => void | Promise<void>;

  /** Called after every completed LM step in the loop. */
  onStepFinish?: (event: StepResult<TOOLS>) => void | Promise<void>;

  /**
   * Stream transforms. Composed left-to-right, so the last entry produces
   * the stream seen by the caller.
   */
  experimental_transform?:
    | StreamTextTransform<TOOLS>
    | Array<StreamTextTransform<TOOLS>>;

  providerOptions?: ProviderOptions;
}

export declare function streamText<
  TOOLS extends ToolSet = {},
  USER_CONTEXT = unknown,
  OUTPUT = string,
>(
  options: StreamTextOptions<TOOLS, USER_CONTEXT, OUTPUT> & Prompt,
): StreamTextResult<TOOLS, USER_CONTEXT, OUTPUT>;

// ---------- Result ----------------------------------------------------------

export interface StreamTextResult<
  TOOLS extends ToolSet = {},
  USER_CONTEXT = unknown,
  OUTPUT = string,
> {
  /** Async iterable of plain text deltas. */
  readonly textStream: AsyncIterable<string> & ReadableStream<string>;

  /** Async iterable of fully typed stream parts. */
  readonly fullStream: AsyncIterable<TextStreamPart<TOOLS>> &
    ReadableStream<TextStreamPart<TOOLS>>;

  /** Partial structured output stream when `output` is set. */
  readonly experimental_partialOutputStream: AsyncIterable<Partial<OUTPUT>>;

  // -- Derived promises ----------------------------------------------------
  readonly text: Promise<string>;
  readonly content: Promise<StepContent<TOOLS>>;
  readonly toolCalls: Promise<Array<TypedToolCall<TOOLS>>>;
  readonly toolResults: Promise<Array<TypedToolResult<TOOLS>>>;
  readonly finishReason: Promise<FinishReason>;
  readonly usage: Promise<LanguageModelUsage>;
  readonly totalUsage: Promise<LanguageModelUsage>;
  readonly steps: Promise<Array<StepResult<TOOLS>>>;
  readonly context: Promise<USER_CONTEXT>;
  readonly response: Promise<{ messages: ModelMessage[] }>;

  // -- Adapters to HTTP / UI ------------------------------------------------

  /** Convert to a Server-Sent-Events Response for a Next.js / Hono route. */
  toUIMessageStreamResponse(init?: ResponseInit): Response;

  /** Convert to a plain-text streaming Response. */
  toTextStreamResponse(init?: ResponseInit): Response;

  /** Pipe into a Node.js `ServerResponse`. */
  pipeUIMessageStreamToResponse(response: unknown, init?: ResponseInit): void;
  pipeTextStreamToResponse(response: unknown, init?: ResponseInit): void;
}

// ---------- Stream parts ----------------------------------------------------

/**
 * Typed union of everything that can appear on `fullStream`. Keep the `type`
 * literals in sync with `packages/ai/src/generate-text/stream-text-result.ts`.
 */
export type TextStreamPart<TOOLS extends ToolSet> =
  | { type: 'start' }
  | { type: 'start-step'; request: unknown }
  | { type: 'text-start'; id: string }
  | { type: 'text-delta'; id: string; text: string }
  | { type: 'text-end'; id: string }
  | { type: 'reasoning-start'; id: string }
  | { type: 'reasoning-delta'; id: string; text: string }
  | { type: 'reasoning-end'; id: string }
  | { type: 'tool-call'; toolCall: TypedToolCall<TOOLS> }
  | { type: 'tool-input-start'; id: string; toolName: keyof TOOLS & string }
  | { type: 'tool-input-delta'; id: string; delta: string }
  | { type: 'tool-input-end'; id: string }
  | { type: 'tool-result'; toolResult: TypedToolResult<TOOLS> }
  | { type: 'file'; file: { data: Uint8Array | string; mediaType: string } }
  | { type: 'source'; source: { id: string; url?: string; title?: string } }
  | { type: 'finish-step'; finishReason: FinishReason; usage: LanguageModelUsage }
  | { type: 'finish'; finishReason: FinishReason; totalUsage: LanguageModelUsage }
  | { type: 'error'; error: unknown }
  | { type: 'abort' };

// ---------- Transforms ------------------------------------------------------

export type StreamTextTransform<TOOLS extends ToolSet> = (options: {
  tools: TOOLS;
  stopStream: () => void;
}) => TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>;

/** Smoothing transform: emit deltas at word or character granularity. */
export declare function smoothStream<TOOLS extends ToolSet>(options?: {
  delayInMs?: number;
  chunking?: 'word' | 'line' | RegExp;
}): StreamTextTransform<TOOLS>;
