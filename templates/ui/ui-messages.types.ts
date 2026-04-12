/**
 * UIMessage types
 * ---------------------------------------------------------------------------
 * Mirrors `packages/ai/src/ui/ui-messages.ts` in vercel/ai. These types are
 * what React / Svelte / Vue components render. They are deliberately
 * DIFFERENT from `ModelMessage` - they track streaming state, tool approval
 * state, and client-side metadata.
 *
 * Convention:
 *   - `UIMessage.parts` is the source of truth for rendering; `content`
 *     strings are never used directly.
 *   - Every streamable part has a `state` field with explicit literals.
 *   - Tool parts double-buffer input (streaming -> available) and output
 *     (available / error / denied).
 *   - `metadata` is an open field keyed by the host app.
 */

export type UIMessageRole = 'system' | 'user' | 'assistant';

export interface UIMessage<METADATA = unknown, DATA_PARTS extends UIDataPartMap = {}> {
  id: string;
  role: UIMessageRole;
  metadata?: METADATA;
  parts: Array<UIMessagePart<METADATA, DATA_PARTS>>;
}

export type UIMessagePart<METADATA, DATA_PARTS extends UIDataPartMap> =
  | TextUIPart
  | ReasoningUIPart
  | ToolUIPart
  | DynamicToolUIPart
  | FileUIPart
  | SourceUIPart
  | StepStartUIPart
  | DataUIPart<DATA_PARTS>
  | ErrorUIPart;

// ---------- Streaming text / reasoning --------------------------------------

export interface TextUIPart {
  type: 'text';
  text: string;
  state?: 'streaming' | 'done';
  providerMetadata?: Record<string, Record<string, unknown>>;
}

export interface ReasoningUIPart {
  type: 'reasoning';
  text: string;
  state?: 'streaming' | 'done';
  providerMetadata?: Record<string, Record<string, unknown>>;
}

// ---------- Tool parts ------------------------------------------------------

/** Lifecycle of a tool invocation as the user sees it. */
export type ToolUIState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied';

/** Tool part with a statically-known tool name. */
export interface ToolUIPart<
  INPUT = unknown,
  OUTPUT = unknown,
  NAME extends string = string,
> {
  type: `tool-${NAME}`;
  toolCallId: string;
  state: ToolUIState;
  input?: Partial<INPUT> | INPUT;
  output?: OUTPUT;
  errorText?: string;
  providerMetadata?: Record<string, Record<string, unknown>>;
}

/** Tool part for dynamically-discovered tools (e.g. MCP). */
export interface DynamicToolUIPart {
  type: 'dynamic-tool';
  toolName: string;
  toolCallId: string;
  state: ToolUIState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

// ---------- Files / sources / data parts ------------------------------------

export interface FileUIPart {
  type: 'file';
  mediaType: string;
  url: string;
  name?: string;
}

export interface SourceUIPart {
  type: 'source';
  source:
    | { type: 'url'; id: string; url: string; title?: string }
    | { type: 'document'; id: string; title: string };
}

export interface StepStartUIPart {
  type: 'step-start';
}

export interface ErrorUIPart {
  type: 'error';
  errorText: string;
}

/** User-defined "custom data" parts. Keyed by `data-${key}`. */
export type UIDataPartMap = Record<string, unknown>;

export type DataUIPart<DATA_PARTS extends UIDataPartMap> = {
  [K in keyof DATA_PARTS & string]: {
    type: `data-${K}`;
    id?: string;
    data: DATA_PARTS[K];
  };
}[keyof DATA_PARTS & string];
