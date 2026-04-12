/**
 * ToolSet and tool-call types
 * ---------------------------------------------------------------------------
 * Mirrors `packages/provider-utils/src/tool.ts` and
 * `packages/ai/src/generate-text/tool-call.ts` in vercel/ai.
 *
 * Convention:
 *   - A `ToolSet` is a plain object keyed by tool name. The key IS the tool name.
 *   - Each tool declares an `inputSchema` and, optionally, an `outputSchema`.
 *   - `execute` is optional. If omitted the tool-loop stops after the call
 *     (used for "approval required" / client-side tools).
 *   - Tool calls come in two flavors:
 *       * StaticToolCall:  toolName is known at compile time (typed inputs).
 *       * DynamicToolCall: toolName is known only at runtime.
 *     `TypedToolCall<TOOLS>` is the union of both.
 */
import type { ProviderOptions } from '../core/call-settings.types';

// ---------- Schema -----------------------------------------------------------

/**
 * Minimal schema interface compatible with Zod / Valibot / JSON Schema.
 * In the real SDK this is `FlexibleSchema<T>`.
 */
export interface Schema<T> {
  readonly _input?: T;
  jsonSchema?: unknown;
  parse?: (value: unknown) => T;
}

export type InferSchema<S> = S extends Schema<infer T> ? T : never;

// ---------- Tool definition --------------------------------------------------

export interface ToolExecutionOptions {
  toolCallId: string;
  messages: unknown[];
  abortSignal?: AbortSignal;
}

export interface Tool<INPUT = unknown, OUTPUT = unknown> {
  /** Optional description surfaced to the model. */
  description?: string;

  /** Input schema. Required for typed tool calls. */
  inputSchema: Schema<INPUT>;

  /** Optional output schema (used for validation and UI rendering). */
  outputSchema?: Schema<OUTPUT>;

  /**
   * Execute the tool. Omit to produce a "client-side" or "approval required"
   * tool: generation stops after the call and the host application decides
   * what to do.
   */
  execute?: (
    input: INPUT,
    options: ToolExecutionOptions,
  ) => OUTPUT | Promise<OUTPUT>;

  /** Optional: convert tool output to human-readable content parts. */
  toModelOutput?: (output: OUTPUT) => unknown;

  /** Experimental: require user approval before executing. */
  experimental_needsApproval?: boolean | ((input: INPUT) => boolean | Promise<boolean>);

  /** Provider-specific options forwarded to the model. */
  providerOptions?: ProviderOptions;
}

/** A ToolSet is a plain record. The KEY is the tool name. */
export type ToolSet = Record<string, Tool<any, any>>;

// ---------- Tool choice ------------------------------------------------------

export type ToolChoice<TOOLS extends ToolSet> =
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'tool'; toolName: keyof TOOLS & string };

// ---------- Tool calls / results --------------------------------------------

interface BaseToolCall {
  type: 'tool-call';
  toolCallId: string;
  providerExecuted?: boolean;
  providerMetadata?: Record<string, Record<string, unknown>>;
}

/** A tool call whose tool name is known at compile time. */
export type StaticToolCall<TOOLS extends ToolSet> = {
  [K in keyof TOOLS & string]: BaseToolCall & {
    dynamic?: false;
    toolName: K;
    input: InferSchema<TOOLS[K]['inputSchema']>;
  };
}[keyof TOOLS & string];

/**
 * A tool call whose toolName is only known at runtime - for example an
 * invalid call that couldn't be matched against the declared tool set.
 */
export interface DynamicToolCall extends BaseToolCall {
  dynamic: true;
  toolName: string;
  input: unknown;
  invalid?: boolean;
  error?: Error;
}

export type TypedToolCall<TOOLS extends ToolSet> =
  | StaticToolCall<TOOLS>
  | DynamicToolCall;

interface BaseToolResult {
  type: 'tool-result';
  toolCallId: string;
  providerMetadata?: Record<string, Record<string, unknown>>;
}

export type StaticToolResult<TOOLS extends ToolSet> = {
  [K in keyof TOOLS & string]: BaseToolResult & {
    dynamic?: false;
    toolName: K;
    input: InferSchema<TOOLS[K]['inputSchema']>;
    output: InferSchema<NonNullable<TOOLS[K]['outputSchema']>>;
  };
}[keyof TOOLS & string];

export interface DynamicToolResult extends BaseToolResult {
  dynamic: true;
  toolName: string;
  input: unknown;
  output: unknown;
}

export type TypedToolResult<TOOLS extends ToolSet> =
  | StaticToolResult<TOOLS>
  | DynamicToolResult;
