/**
 * generateText
 * ---------------------------------------------------------------------------
 * Non-streaming text generation. Mirrors `packages/ai/src/generate-text/
 * generate-text.ts` in vercel/ai.
 *
 * Convention:
 *   - Generic parameter order: <TOOLS, USER_CONTEXT, OUTPUT>.
 *   - Input type = CallSettings & Prompt & { model, tools?, ... }.
 *   - Output type = Promise<GenerateTextResult<TOOLS, USER_CONTEXT, OUTPUT>>.
 *   - Experimental surface uses the `experimental_` prefix.
 *   - `onStepFinish` / `onFinish` are non-experimental callbacks.
 *   - A single call may involve multiple LM steps when tool calls are looped.
 */
import type { CallSettings, ProviderOptions } from './call-settings.types';
import type { Prompt, ModelMessage } from './messages.types';
import type { LanguageModel } from '../providers/language-model-v2.types';
import type {
  ToolSet,
  ToolChoice,
  TypedToolCall,
  TypedToolResult,
} from '../tools/tool-set.types';

// ---------- Options ---------------------------------------------------------

export interface GenerateTextOptions<
  TOOLS extends ToolSet = {},
  USER_CONTEXT = unknown,
  OUTPUT = string,
> extends CallSettings {
  /** Language model instance (from a provider factory). */
  model: LanguageModel;

  /** Tools the model may call. */
  tools?: TOOLS;

  /** Tool choice strategy. Defaults to 'auto'. */
  toolChoice?: ToolChoice<TOOLS>;

  /** Restrict which declared tools are active, without changing TOOLS type. */
  activeTools?: Array<keyof TOOLS>;

  /** Structured-output specification. */
  output?: OutputStrategy<OUTPUT>;

  /** Per-call user context passed to tools, callbacks, and prepareStep. */
  context?: USER_CONTEXT;

  /** Stop condition(s) that terminate the tool loop. */
  stopWhen?: StopCondition<TOOLS> | Array<StopCondition<TOOLS>>;

  /** Dynamic per-step customization (override model/tools/messages). */
  prepareStep?: PrepareStepFunction<TOOLS, USER_CONTEXT>;

  /** Provider-specific options bag. */
  providerOptions?: ProviderOptions;

  // ---- Callbacks ----------------------------------------------------------

  /** Called when the overall generation finishes. */
  onFinish?: (event: StepResult<TOOLS>) => void | Promise<void>;

  /** Called after each LM step completes. */
  onStepFinish?: (event: StepResult<TOOLS>) => void | Promise<void>;

  /** Experimental lifecycle hooks. */
  experimental_onStart?: () => void | Promise<void>;
  experimental_onStepStart?: () => void | Promise<void>;
  experimental_onToolCallStart?: (call: TypedToolCall<TOOLS>) => void | Promise<void>;
  experimental_onToolCallFinish?: (result: TypedToolResult<TOOLS>) => void | Promise<void>;

  /** Optional telemetry configuration. */
  experimental_telemetry?: TelemetrySettings;
}

/**
 * Generate text. The SDK intersects this options shape with `Prompt` so the
 * user must supply exactly one of `prompt` / `messages`.
 */
export declare function generateText<
  TOOLS extends ToolSet = {},
  USER_CONTEXT = unknown,
  OUTPUT = string,
>(
  options: GenerateTextOptions<TOOLS, USER_CONTEXT, OUTPUT> & Prompt,
): Promise<GenerateTextResult<TOOLS, USER_CONTEXT, OUTPUT>>;

// ---------- Result ----------------------------------------------------------

export interface GenerateTextResult<
  TOOLS extends ToolSet = {},
  USER_CONTEXT = unknown,
  OUTPUT = string,
> {
  /** Generated text from the FINAL step. */
  readonly text: string;

  /** All parts (text, reasoning, tool calls, tool results) of the final step. */
  readonly content: StepContent<TOOLS>;

  /** Tool calls made during the final step. */
  readonly toolCalls: Array<TypedToolCall<TOOLS>>;

  /** Tool results collected during the final step. */
  readonly toolResults: Array<TypedToolResult<TOOLS>>;

  /** Token usage for the FINAL step. */
  readonly usage: LanguageModelUsage;

  /** Aggregated usage across all steps. */
  readonly totalUsage: LanguageModelUsage;

  /** Why the final step finished. */
  readonly finishReason: FinishReason;

  /** All individual LM steps that ran (tool-loop history). */
  readonly steps: Array<StepResult<TOOLS>>;

  /** Structured output, if `output` was provided. */
  readonly experimental_output: OUTPUT;

  /** User context after generation completed. */
  readonly context: USER_CONTEXT;

  /** Provider metadata returned by the model. */
  readonly providerMetadata?: Record<string, Record<string, unknown>>;

  /** Warnings for unsupported options. */
  readonly warnings?: CallWarning[];

  /** Raw request/response for debugging. */
  readonly request?: LanguageModelRequestMetadata;
  readonly response?: LanguageModelResponseMetadata & { messages: ModelMessage[] };
}

// ---------- Shared shapes --------------------------------------------------

export interface StepResult<TOOLS extends ToolSet> {
  readonly text: string;
  readonly content: StepContent<TOOLS>;
  readonly toolCalls: Array<TypedToolCall<TOOLS>>;
  readonly toolResults: Array<TypedToolResult<TOOLS>>;
  readonly finishReason: FinishReason;
  readonly usage: LanguageModelUsage;
  readonly providerMetadata?: Record<string, Record<string, unknown>>;
}

export type StepContent<TOOLS extends ToolSet> = Array<
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'tool-call'; toolCall: TypedToolCall<TOOLS> }
  | { type: 'tool-result'; toolResult: TypedToolResult<TOOLS> }
>;

export type FinishReason =
  | 'stop'
  | 'length'
  | 'content-filter'
  | 'tool-calls'
  | 'error'
  | 'other'
  | 'unknown';

export interface LanguageModelUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
}

export interface CallWarning {
  type: 'unsupported-setting' | 'unsupported-tool' | 'other';
  setting?: string;
  message?: string;
}

export interface LanguageModelRequestMetadata {
  body?: unknown;
}
export interface LanguageModelResponseMetadata {
  id?: string;
  timestamp?: Date;
  modelId?: string;
  headers?: Record<string, string>;
}

// ---------- Output strategy -------------------------------------------------

/**
 * The AI SDK supports `'object' | 'array' | 'enum' | 'no-schema'` output
 * strategies. Keep this shape open so providers can extend it.
 */
export type OutputStrategy<T> =
  | { type: 'text' }
  | { type: 'object'; schema: unknown; schemaName?: string; schemaDescription?: string }
  | { type: 'array'; schema: unknown }
  | { type: 'enum'; values: readonly T[] }
  | { type: 'no-schema' };

// ---------- Stop conditions / prepareStep ----------------------------------

export type StopCondition<TOOLS extends ToolSet> = (event: {
  steps: Array<StepResult<TOOLS>>;
}) => boolean | Promise<boolean>;

/** Commonly used stop helper: stop when N steps have been executed. */
export declare function stepCountIs<TOOLS extends ToolSet>(
  n: number,
): StopCondition<TOOLS>;

/** Commonly used stop helper: stop when a given tool has been called. */
export declare function hasToolCall<TOOLS extends ToolSet>(
  toolName: keyof TOOLS & string,
): StopCondition<TOOLS>;

export type PrepareStepFunction<
  TOOLS extends ToolSet,
  USER_CONTEXT,
> = (event: {
  stepNumber: number;
  steps: Array<StepResult<TOOLS>>;
  messages: ModelMessage[];
  context: USER_CONTEXT;
}) =>
  | undefined
  | {
      model?: LanguageModel;
      toolChoice?: ToolChoice<TOOLS>;
      activeTools?: Array<keyof TOOLS>;
      system?: string;
      messages?: ModelMessage[];
    }
  | Promise<
      | undefined
      | {
          model?: LanguageModel;
          toolChoice?: ToolChoice<TOOLS>;
          activeTools?: Array<keyof TOOLS>;
          system?: string;
          messages?: ModelMessage[];
        }
    >;

// ---------- Telemetry ------------------------------------------------------

export interface TelemetrySettings {
  isEnabled?: boolean;
  functionId?: string;
  metadata?: Record<string, string | number | boolean>;
  recordInputs?: boolean;
  recordOutputs?: boolean;
}
