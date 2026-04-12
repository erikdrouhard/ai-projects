/**
 * generateObject / streamObject
 * ---------------------------------------------------------------------------
 * Structured-output generation. Mirrors `packages/ai/src/generate-object/*` in
 * vercel/ai. The SDK uses a `FlexibleSchema` type that accepts Zod, Valibot,
 * or plain JSON-schema-backed schemas.
 *
 * Convention:
 *   - `output` is one of `'object' | 'array' | 'enum' | 'no-schema'`.
 *   - When `output` is `'object'` the returned shape is inferred from the schema.
 *   - When `output` is `'array'` the returned shape is `Array<InferredItem>`.
 *   - When `output` is `'enum'` the returned shape is the union of `values`.
 *   - When `output` is `'no-schema'` the returned value is `unknown` / parsed JSON.
 */
import type { CallSettings, ProviderOptions } from './call-settings.types';
import type { Prompt } from './messages.types';
import type { LanguageModel } from '../providers/language-model-v2.types';
import type {
  FinishReason,
  LanguageModelUsage,
  CallWarning,
  LanguageModelRequestMetadata,
  LanguageModelResponseMetadata,
  TelemetrySettings,
} from './generate-text.template';

/**
 * FlexibleSchema is the generic "give me the schema in whatever form" type
 * the AI SDK uses. In practice you'll pass a Zod schema; this is a minimal
 * stand-in so the template compiles without a schema library.
 */
export interface FlexibleSchema<T> {
  /** Branding hook used by the SDK's `asSchema` helper. */
  readonly _type?: T;
  /** JSON Schema representation (used by providers for function calling). */
  jsonSchema?: unknown;
  /** Optional runtime validator. */
  validate?: (value: unknown) =>
    | { success: true; value: T }
    | { success: false; error: Error };
}

// ---------- Options ---------------------------------------------------------

interface BaseGenerateObjectOptions extends CallSettings {
  model: LanguageModel;
  schemaName?: string;
  schemaDescription?: string;
  mode?: 'auto' | 'json' | 'tool';
  experimental_repairText?: (options: {
    text: string;
    error: Error;
  }) => Promise<string | null>;
  experimental_telemetry?: TelemetrySettings;
  providerOptions?: ProviderOptions;
}

export type GenerateObjectOptions<T> =
  | (BaseGenerateObjectOptions & {
      output?: 'object';
      schema: FlexibleSchema<T>;
    } & Prompt)
  | (BaseGenerateObjectOptions & {
      output: 'array';
      schema: FlexibleSchema<T>;
    } & Prompt)
  | (BaseGenerateObjectOptions & {
      output: 'enum';
      enum: readonly T[];
    } & Prompt)
  | (BaseGenerateObjectOptions & {
      output: 'no-schema';
    } & Prompt);

// ---------- Function --------------------------------------------------------

export declare function generateObject<T>(
  options: GenerateObjectOptions<T>,
): Promise<GenerateObjectResult<T>>;

export declare function streamObject<T>(
  options: GenerateObjectOptions<T>,
): StreamObjectResult<T>;

// ---------- Result ----------------------------------------------------------

export interface GenerateObjectResult<T> {
  readonly object: T;
  readonly finishReason: FinishReason;
  readonly usage: LanguageModelUsage;
  readonly warnings?: CallWarning[];
  readonly request?: LanguageModelRequestMetadata;
  readonly response?: LanguageModelResponseMetadata;
  readonly providerMetadata?: Record<string, Record<string, unknown>>;
}

export interface StreamObjectResult<T> {
  /** Partial object stream. Each yielded value is a deeper-filled-in version. */
  readonly partialObjectStream: AsyncIterable<Partial<T>>;
  /** Awaitable final value. */
  readonly object: Promise<T>;
  readonly usage: Promise<LanguageModelUsage>;
  readonly finishReason: Promise<FinishReason>;
  toTextStreamResponse(init?: ResponseInit): Response;
}
