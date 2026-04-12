/**
 * ModelMessage and content parts
 * ---------------------------------------------------------------------------
 * Mirrors `packages/ai/src/prompt/message.ts` in vercel/ai. The SDK splits
 * messages by role, and each role only accepts the content parts that make
 * sense for it (e.g. a `user` message can contain image parts but never a
 * tool call).
 *
 * Convention:
 *   - Role literals are the string union `'system' | 'user' | 'assistant' | 'tool'`.
 *   - `content` is either a plain string OR an array of typed parts.
 *   - Every message carries optional `providerOptions` for vendor-specific hints.
 */
import type { ProviderOptions } from './call-settings.types';

// ---------- Content parts ---------------------------------------------------

export interface TextPart {
  type: 'text';
  text: string;
  providerOptions?: ProviderOptions;
}

export interface ImagePart {
  type: 'image';
  /** URL, data URL, or binary payload. */
  image: string | URL | Uint8Array | ArrayBuffer;
  /** Optional IANA media type, e.g. `image/png`. */
  mediaType?: string;
  providerOptions?: ProviderOptions;
}

export interface FilePart {
  type: 'file';
  data: string | URL | Uint8Array | ArrayBuffer;
  mediaType: string;
  filename?: string;
  providerOptions?: ProviderOptions;
}

export interface ReasoningPart {
  type: 'reasoning';
  text: string;
  providerOptions?: ProviderOptions;
}

export interface ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  input: unknown;
  providerExecuted?: boolean;
  providerOptions?: ProviderOptions;
}

export interface ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  output: ToolResultOutput;
  providerOptions?: ProviderOptions;
}

/**
 * Tool results are wrapped in a tagged output so that providers can render
 * them as text, JSON, or multimodal content.
 */
export type ToolResultOutput =
  | { type: 'text'; value: string }
  | { type: 'json'; value: unknown }
  | { type: 'error-text'; value: string }
  | { type: 'error-json'; value: unknown }
  | { type: 'content'; value: Array<TextPart | ImagePart | FilePart> };

// ---------- Messages --------------------------------------------------------

export interface SystemModelMessage {
  role: 'system';
  content: string;
  providerOptions?: ProviderOptions;
}

export interface UserModelMessage {
  role: 'user';
  content: string | Array<TextPart | ImagePart | FilePart>;
  providerOptions?: ProviderOptions;
}

export interface AssistantModelMessage {
  role: 'assistant';
  content:
    | string
    | Array<TextPart | FilePart | ReasoningPart | ToolCallPart | ToolResultPart>;
  providerOptions?: ProviderOptions;
}

export interface ToolModelMessage {
  role: 'tool';
  content: ToolResultPart[];
  providerOptions?: ProviderOptions;
}

export type ModelMessage =
  | SystemModelMessage
  | UserModelMessage
  | AssistantModelMessage
  | ToolModelMessage;

// ---------- Prompt discriminated union --------------------------------------

/**
 * Every top-level SDK call takes exactly ONE of `prompt` or `messages`.
 * The overloads below enforce that at the type level.
 */
export type Prompt = {
  system?: string | SystemModelMessage | SystemModelMessage[];
} & (
  | { prompt: string | ModelMessage[]; messages?: never }
  | { prompt?: never; messages: ModelMessage[] }
);
