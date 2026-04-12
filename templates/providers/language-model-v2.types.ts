/**
 * LanguageModelV2
 * ---------------------------------------------------------------------------
 * The contract every provider must implement. Mirrors
 * `packages/provider/src/language-model/v2/language-model-v2.ts` in vercel/ai.
 *
 * Convention:
 *   - `specificationVersion` is a bumped string literal. v2 is current.
 *   - Implementation methods are prefixed with `do` (`doGenerate`, `doStream`)
 *     so user code never accidentally calls them directly - users always go
 *     through `generateText` / `streamText`.
 *   - `supportedUrls` lets the model declare which remote URLs it can ingest
 *     natively (images, audio, video) so the SDK skips local fetching.
 *   - Warnings are returned as data, not thrown, so unsupported settings
 *     degrade gracefully.
 */
import type { LanguageModelUsage, FinishReason, CallWarning } from '../core/generate-text.template';
import type { ProviderOptions } from '../core/call-settings.types';

export interface LanguageModelV2 {
  readonly specificationVersion: 'v2';
  readonly provider: string;
  readonly modelId: string;

  /**
   * URL patterns the model can ingest natively. Keyed by IANA media type
   * (globs allowed: `image/*`, `audio/*`). Values are regexes that match
   * URLs the model handles without the SDK downloading them first.
   */
  readonly supportedUrls: Record<string, RegExp[]>;

  doGenerate(options: LanguageModelV2CallOptions): Promise<LanguageModelV2Response>;

  doStream(options: LanguageModelV2CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV2StreamPart>;
    request?: { body?: unknown };
    response?: { headers?: Record<string, string> };
  }>;
}

// ---------- Call options ----------------------------------------------------

export interface LanguageModelV2CallOptions {
  /** Fully normalized prompt as `LanguageModelV2Message[]`. */
  prompt: LanguageModelV2Message[];

  /** Sampling and request settings. */
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  seed?: number;
  abortSignal?: AbortSignal;
  headers?: Record<string, string | undefined>;

  /** Tools and tool choice, as seen by the provider. */
  tools?: LanguageModelV2FunctionTool[];
  toolChoice?:
    | { type: 'auto' }
    | { type: 'none' }
    | { type: 'required' }
    | { type: 'tool'; toolName: string };

  /** Structured-output hint, if any. */
  responseFormat?:
    | { type: 'text' }
    | { type: 'json'; schema?: unknown; name?: string; description?: string };

  /** Provider-specific options (vendor escape hatch). */
  providerOptions?: ProviderOptions;
}

// ---------- Responses -------------------------------------------------------

export interface LanguageModelV2Response {
  content: LanguageModelV2Content[];
  finishReason: FinishReason;
  usage: LanguageModelUsage;
  warnings?: CallWarning[];
  providerMetadata?: Record<string, Record<string, unknown>>;
  request?: { body?: unknown };
  response?: {
    id?: string;
    timestamp?: Date;
    modelId?: string;
    headers?: Record<string, string>;
  };
}

export type LanguageModelV2Content =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; input: unknown }
  | {
      type: 'tool-result';
      toolCallId: string;
      toolName: string;
      output: unknown;
    }
  | { type: 'file'; data: Uint8Array | string; mediaType: string }
  | { type: 'source'; id: string; url?: string; title?: string };

// ---------- Streaming -------------------------------------------------------

export type LanguageModelV2StreamPart =
  | { type: 'text-delta'; id: string; delta: string }
  | { type: 'reasoning-delta'; id: string; delta: string }
  | { type: 'tool-input-delta'; id: string; delta: string }
  | {
      type: 'tool-call';
      toolCallId: string;
      toolName: string;
      input: unknown;
    }
  | { type: 'response-metadata'; id?: string; timestamp?: Date; modelId?: string }
  | {
      type: 'finish';
      finishReason: FinishReason;
      usage: LanguageModelUsage;
      providerMetadata?: Record<string, Record<string, unknown>>;
    }
  | { type: 'error'; error: unknown };

// ---------- Normalized messages passed to the provider ----------------------

export type LanguageModelV2Message =
  | { role: 'system'; content: string }
  | {
      role: 'user';
      content: Array<
        | { type: 'text'; text: string }
        | { type: 'image'; image: Uint8Array | string; mediaType?: string }
        | { type: 'file'; data: Uint8Array | string; mediaType: string }
      >;
    }
  | {
      role: 'assistant';
      content: Array<
        | { type: 'text'; text: string }
        | { type: 'reasoning'; text: string }
        | { type: 'tool-call'; toolCallId: string; toolName: string; input: unknown }
      >;
    }
  | {
      role: 'tool';
      content: Array<{
        type: 'tool-result';
        toolCallId: string;
        toolName: string;
        output: unknown;
      }>;
    };

// ---------- Function-tool declaration sent to providers --------------------

export interface LanguageModelV2FunctionTool {
  type: 'function';
  name: string;
  description?: string;
  /** JSON Schema for the tool's input. */
  inputSchema: unknown;
}

// ---------- Aliased exports for templates -----------------------------------

/** Convenience alias: the "language model" users interact with. */
export type LanguageModel = LanguageModelV2;
