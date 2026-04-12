/**
 * Custom provider factory
 * ---------------------------------------------------------------------------
 * Template for building a provider package in the style of
 * `@ai-sdk/openai`, `@ai-sdk/anthropic`, etc.
 *
 * Convention:
 *   - Export a `create<Name>` factory that accepts `...Settings` and returns
 *     a `...Provider`.
 *   - The provider is both CALLABLE (`provider('model-id')`) and has named
 *     methods (`provider.languageModel(...)`, `provider.chat(...)`, etc.).
 *   - Also export a default singleton (`<name>`) constructed with zero
 *     settings so `import { openai } from '@ai-sdk/openai'` just works.
 *   - Keep secrets out of the default singleton: read from
 *     `process.env` lazily on first use.
 *   - Provider metadata constants live in a separate `*-metadata.ts` file.
 */
import type { LanguageModelV2 } from './language-model-v2.types';

// ---------- Settings & provider shape --------------------------------------

export interface MyProviderSettings {
  /** API key. Falls back to `process.env.MY_PROVIDER_API_KEY`. */
  apiKey?: string;

  /** Base URL override, for self-hosted / proxy deployments. */
  baseURL?: string;

  /** Additional headers merged into every request. */
  headers?: Record<string, string>;

  /** Custom fetch implementation (intercept / test double). */
  fetch?: typeof fetch;

  /** Organization / project IDs when the provider supports them. */
  organization?: string;
  project?: string;
}

export interface MyProvider {
  (modelId: MyChatModelId, settings?: MyChatModelSettings): LanguageModelV2;

  languageModel(modelId: MyChatModelId, settings?: MyChatModelSettings): LanguageModelV2;

  chat(modelId: MyChatModelId, settings?: MyChatModelSettings): LanguageModelV2;

  completion(modelId: MyCompletionModelId, settings?: MyChatModelSettings): LanguageModelV2;

  embedding(modelId: MyEmbeddingModelId): EmbeddingModel;

  image(modelId: MyImageModelId): ImageModel;
}

// ---------- Model ids & per-call settings ----------------------------------

/** String literal union of supported chat model ids - narrow where possible. */
export type MyChatModelId =
  | 'my-provider-small'
  | 'my-provider-medium'
  | 'my-provider-large'
  | (string & {}); // allow-unknown escape hatch

export type MyCompletionModelId = 'my-provider-completion' | (string & {});

export type MyEmbeddingModelId =
  | 'my-provider-embed-v1'
  | 'my-provider-embed-v2'
  | (string & {});

export type MyImageModelId = 'my-provider-image' | (string & {});

export interface MyChatModelSettings {
  /** Provider-specific tuning knobs. */
  user?: string;
  logprobs?: boolean;
}

// ---------- Placeholder model classes --------------------------------------

declare class MyChatLanguageModel implements LanguageModelV2 {
  readonly specificationVersion: 'v2';
  readonly provider: string;
  readonly modelId: string;
  readonly supportedUrls: Record<string, RegExp[]>;
  doGenerate: LanguageModelV2['doGenerate'];
  doStream: LanguageModelV2['doStream'];
}

declare class MyCompletionLanguageModel extends MyChatLanguageModel {}

export interface EmbeddingModel {
  readonly specificationVersion: 'v2';
  readonly provider: string;
  readonly modelId: string;
  doEmbed(options: { values: string[]; abortSignal?: AbortSignal }): Promise<{
    embeddings: number[][];
    usage?: { tokens?: number };
  }>;
}

export interface ImageModel {
  readonly specificationVersion: 'v2';
  readonly provider: string;
  readonly modelId: string;
  doGenerate(options: { prompt: string; size?: string; n?: number }): Promise<{
    images: Array<Uint8Array | string>;
  }>;
}

declare class MyEmbeddingModel implements EmbeddingModel {
  readonly specificationVersion: 'v2';
  readonly provider: string;
  readonly modelId: string;
  doEmbed: EmbeddingModel['doEmbed'];
}

declare class MyImageModel implements ImageModel {
  readonly specificationVersion: 'v2';
  readonly provider: string;
  readonly modelId: string;
  doGenerate: ImageModel['doGenerate'];
}

// ---------- Factory ---------------------------------------------------------

/**
 * Build a new provider. The returned object is also callable so that
 * `myProvider('model-id')` and `myProvider.languageModel('model-id')` are
 * equivalent. This matches `createOpenAI` in the AI SDK exactly.
 */
export function createMyProvider(settings: MyProviderSettings = {}): MyProvider {
  const loadApiKey = (): string => {
    const key = settings.apiKey ?? process.env.MY_PROVIDER_API_KEY;
    if (!key) {
      throw new Error(
        'MY_PROVIDER_API_KEY is not set. Pass `apiKey` to createMyProvider or set the env var.',
      );
    }
    return key;
  };

  const baseURL = settings.baseURL ?? 'https://api.my-provider.example/v1';

  const makeConfig = () => ({
    provider: 'my-provider',
    baseURL,
    headers: () => ({
      authorization: `Bearer ${loadApiKey()}`,
      ...(settings.organization
        ? { 'my-provider-organization': settings.organization }
        : {}),
      ...(settings.project ? { 'my-provider-project': settings.project } : {}),
      ...(settings.headers ?? {}),
    }),
    fetch: settings.fetch,
  });

  const createChatModel = (
    modelId: MyChatModelId,
    _modelSettings: MyChatModelSettings = {},
  ): LanguageModelV2 =>
    new MyChatLanguageModel(/* modelId, modelSettings, makeConfig() */);

  const createCompletionModel = (
    modelId: MyCompletionModelId,
    _modelSettings: MyChatModelSettings = {},
  ): LanguageModelV2 =>
    new MyCompletionLanguageModel(/* modelId, modelSettings, makeConfig() */);

  const createEmbeddingModel = (modelId: MyEmbeddingModelId): EmbeddingModel =>
    new MyEmbeddingModel(/* modelId, makeConfig() */);

  const createImageModel = (modelId: MyImageModelId): ImageModel =>
    new MyImageModel(/* modelId, makeConfig() */);

  const provider = function (
    modelId: MyChatModelId,
    modelSettings?: MyChatModelSettings,
  ) {
    return createChatModel(modelId, modelSettings);
  } as MyProvider;

  provider.languageModel = createChatModel;
  provider.chat = createChatModel;
  provider.completion = createCompletionModel;
  provider.embedding = createEmbeddingModel;
  provider.image = createImageModel;

  // Silence "unused" lint for the config builder in template form.
  void makeConfig;

  return provider;
}

/** Default singleton, constructed lazily from environment variables. */
export const myProvider: MyProvider = createMyProvider();
