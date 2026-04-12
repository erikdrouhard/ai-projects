/**
 * CallSettings
 * ---------------------------------------------------------------------------
 * Shared sampling + request parameters that every top-level SDK call accepts.
 * Mirrors `packages/ai/src/prompt/call-settings.ts` in vercel/ai.
 *
 * Convention:
 *   - Every option is optional.
 *   - It is recommended to set either `temperature` OR `topP`, not both.
 *   - `maxRetries` defaults to 2 in the reference implementation.
 *   - Call-shaped options types always use `?` (never `| undefined`) so that
 *     `exactOptionalPropertyTypes` works cleanly.
 */
export interface CallSettings {
  /** Maximum number of tokens to generate. */
  maxOutputTokens?: number;

  /** Temperature setting (0..2 typical). Controls randomness. */
  temperature?: number;

  /** Nucleus sampling. Recommended alternative to `temperature`. */
  topP?: number;

  /** Only sample from the top K options for each subsequent token. */
  topK?: number;

  /** Presence penalty (-1..1). Penalizes information already in the prompt. */
  presencePenalty?: number;

  /** Frequency penalty (-1..1). Penalizes re-using the same words/phrases. */
  frequencyPenalty?: number;

  /** Stop sequences that terminate generation. */
  stopSequences?: string[];

  /** Integer seed for deterministic sampling (when supported by the model). */
  seed?: number;

  /** Reasoning effort, when supported by the provider (e.g. 'low'|'medium'|'high'). */
  reasoning?: ReasoningOptions;

  /** Max retry attempts for transient failures. Defaults to 2. */
  maxRetries?: number;

  /** AbortSignal for cancellation. */
  abortSignal?: AbortSignal;

  /** Extra HTTP headers forwarded to the provider request. */
  headers?: Record<string, string | undefined>;
}

/** Placeholder shape for reasoning options (providers extend this). */
export type ReasoningOptions =
  | 'low'
  | 'medium'
  | 'high'
  | { effort?: 'low' | 'medium' | 'high'; budgetTokens?: number };

/**
 * Provider-specific options bag. Keyed by provider id (e.g. 'openai',
 * 'anthropic'). Values are opaque and forwarded to the provider.
 */
export type ProviderOptions = Record<string, Record<string, unknown>>;
