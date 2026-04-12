/**
 * ToolLoopAgent
 * ---------------------------------------------------------------------------
 * Reference implementation of `Agent` that runs tools in a loop. Mirrors
 * `packages/ai/src/agent/tool-loop-agent.ts` in vercel/ai.
 *
 * Loop behavior (same as the SDK):
 *   - Each step calls the LM. If there are tool calls, execute them and
 *     call the LM again in a new step with the tool results.
 *   - Terminate when:
 *       * the LM returns text without tool calls, OR
 *       * a called tool has no `execute` (client-side / approval needed), OR
 *       * any `stopWhen` condition resolves true, OR
 *       * the default `stepCountIs(20)` is hit.
 *
 * Implementation shape:
 *   - Constructor takes a `ToolLoopAgentSettings`.
 *   - `generate` and `stream` delegate to the standalone `generateText` /
 *     `streamText` functions after merging settings with per-call options.
 *   - Callback sources (agent-level + call-level) are composed via
 *     `mergeListeners`.
 */
import type {
  Agent,
  AgentCallParameters,
  AgentStreamParameters,
  Context,
} from './agent.types';
import type {
  GenerateTextOptions,
  GenerateTextResult,
  StopCondition,
  PrepareStepFunction,
} from '../core/generate-text.template';
import type {
  StreamTextOptions,
  StreamTextResult,
  StreamTextTransform,
} from '../core/stream-text.template';
import type { ToolSet, ToolChoice } from '../tools/tool-set.types';
import type { LanguageModel } from '../providers/language-model-v2.types';
import type { Prompt } from '../core/messages.types';

// These functions exist in the real SDK - declared here for the template.
declare function generateText<TOOLS extends ToolSet, USER_CONTEXT, OUTPUT>(
  options: GenerateTextOptions<TOOLS, USER_CONTEXT, OUTPUT> & Prompt,
): Promise<GenerateTextResult<TOOLS, USER_CONTEXT, OUTPUT>>;

declare function streamText<TOOLS extends ToolSet, USER_CONTEXT, OUTPUT>(
  options: StreamTextOptions<TOOLS, USER_CONTEXT, OUTPUT> & Prompt,
): StreamTextResult<TOOLS, USER_CONTEXT, OUTPUT>;

declare function stepCountIs<TOOLS extends ToolSet>(
  n: number,
): StopCondition<TOOLS>;

// ---------- Settings --------------------------------------------------------

export interface ToolLoopAgentSettings<
  CALL_OPTIONS,
  TOOLS extends ToolSet,
  USER_CONTEXT extends Context,
  OUTPUT,
> {
  id?: string;
  model: LanguageModel;
  tools?: TOOLS;
  toolChoice?: ToolChoice<TOOLS>;

  /** System instructions injected on every call. */
  instructions?: string;

  /** Default stop condition(s). Defaults to `stepCountIs(20)`. */
  stopWhen?: StopCondition<TOOLS> | Array<StopCondition<TOOLS>>;

  /** Default per-step customization. */
  prepareStep?: PrepareStepFunction<TOOLS, USER_CONTEXT>;

  /**
   * Merge agent-level `CALL_OPTIONS` + per-call options into the shape
   * that `generateText` / `streamText` accept.
   */
  prepareCall?: (event: {
    callOptions?: CALL_OPTIONS;
  }) => Partial<GenerateTextOptions<TOOLS, USER_CONTEXT, OUTPUT>>;

  // Experimental agent-level callbacks - merged with per-call callbacks.
  experimental_onStart?: () => void | Promise<void>;
  experimental_onStepStart?: () => void | Promise<void>;
  experimental_onToolCallStart?: (call: unknown) => void | Promise<void>;
  experimental_onToolCallFinish?: (result: unknown) => void | Promise<void>;
  onStepFinish?: (step: unknown) => void | Promise<void>;
}

// ---------- Implementation --------------------------------------------------

export class ToolLoopAgent<
  CALL_OPTIONS = never,
  TOOLS extends ToolSet = {},
  USER_CONTEXT extends Context = Context,
  OUTPUT = never,
> implements Agent<CALL_OPTIONS, TOOLS, USER_CONTEXT, OUTPUT> {
  readonly version = 'agent-v1' as const;
  readonly id: string | undefined;
  readonly tools: TOOLS;

  constructor(
    private readonly settings: ToolLoopAgentSettings<
      CALL_OPTIONS,
      TOOLS,
      USER_CONTEXT,
      OUTPUT
    >,
  ) {
    this.id = settings.id;
    this.tools = (settings.tools ?? ({} as TOOLS));
  }

  generate(
    options: AgentCallParameters<CALL_OPTIONS, TOOLS, USER_CONTEXT> & Prompt,
  ): Promise<GenerateTextResult<TOOLS, USER_CONTEXT, OUTPUT>> {
    return generateText<TOOLS, USER_CONTEXT, OUTPUT>(this.buildOptions(options));
  }

  stream(
    options: AgentStreamParameters<CALL_OPTIONS, TOOLS, USER_CONTEXT> & Prompt,
  ): StreamTextResult<TOOLS, USER_CONTEXT, OUTPUT> {
    return streamText<TOOLS, USER_CONTEXT, OUTPUT>({
      ...this.buildOptions(options),
      experimental_transform: options.experimental_transform as
        | StreamTextTransform<TOOLS>
        | Array<StreamTextTransform<TOOLS>>
        | undefined,
    } as StreamTextOptions<TOOLS, USER_CONTEXT, OUTPUT> & Prompt);
  }

  /**
   * Merge agent defaults with per-call parameters. Concrete implementations
   * would also call `mergeListeners(...)` here for lifecycle callbacks.
   */
  private buildOptions(
    options: AgentCallParameters<CALL_OPTIONS, TOOLS, USER_CONTEXT> & Prompt,
  ): GenerateTextOptions<TOOLS, USER_CONTEXT, OUTPUT> & Prompt {
    const { callOptions, stopWhen, prepareStep, ...rest } = options;
    const prepared = this.settings.prepareCall?.({ callOptions }) ?? {};

    return {
      model: this.settings.model,
      tools: this.settings.tools,
      toolChoice: this.settings.toolChoice,
      system: this.settings.instructions,
      stopWhen: stopWhen ?? this.settings.stopWhen ?? stepCountIs<TOOLS>(20),
      prepareStep: prepareStep ?? this.settings.prepareStep,
      onStepFinish: this.settings.onStepFinish,
      experimental_onStart: this.settings.experimental_onStart,
      experimental_onStepStart: this.settings.experimental_onStepStart,
      experimental_onToolCallStart: this.settings.experimental_onToolCallStart,
      experimental_onToolCallFinish: this.settings.experimental_onToolCallFinish,
      ...prepared,
      ...rest,
    } as GenerateTextOptions<TOOLS, USER_CONTEXT, OUTPUT> & Prompt;
  }
}
