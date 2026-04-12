/**
 * Agent interface
 * ---------------------------------------------------------------------------
 * Mirrors `packages/ai/src/agent/agent.ts` in vercel/ai. An Agent bundles a
 * model, a tool set, instructions, and stop conditions into a single
 * reusable unit that can be `generate`d or `stream`ed just like a one-off
 * `generateText` call.
 *
 * Convention:
 *   - Generics: <CALL_OPTIONS, TOOLS, USER_CONTEXT, OUTPUT>.
 *   - `version` is a bumped literal ('agent-v1') so that implementations can
 *     coexist.
 *   - Both methods return `PromiseLike<...>`, not `Promise<...>`, so thenable
 *     fakes (e.g. Remotion's delayed promises) can satisfy the interface.
 *   - `generate` and `stream` return the SAME shapes as the standalone
 *     `generateText` / `streamText` functions.
 */
import type {
  GenerateTextResult,
  StopCondition,
  PrepareStepFunction,
} from '../core/generate-text.template';
import type { StreamTextResult } from '../core/stream-text.template';
import type { ToolSet } from '../tools/tool-set.types';
import type { Prompt } from '../core/messages.types';
import type { CallSettings } from '../core/call-settings.types';

export type Context = Record<string, unknown>;

export interface AgentCallParameters<
  CALL_OPTIONS,
  TOOLS extends ToolSet,
  USER_CONTEXT,
> extends CallSettings {
  /** Per-call options defined by the agent implementation. */
  callOptions?: CALL_OPTIONS;

  /** User context handed to tools / callbacks for this call. */
  context?: USER_CONTEXT;

  /** Stop conditions; if omitted the agent's default applies. */
  stopWhen?: StopCondition<TOOLS> | Array<StopCondition<TOOLS>>;

  /** Per-call prepareStep override. */
  prepareStep?: PrepareStepFunction<TOOLS, USER_CONTEXT>;

  // Lifecycle callbacks - same shape as generateText.
  onStepFinish?: (step: unknown) => void | Promise<void>;
  experimental_onStart?: () => void | Promise<void>;
  experimental_onStepStart?: () => void | Promise<void>;
  experimental_onToolCallStart?: (call: unknown) => void | Promise<void>;
  experimental_onToolCallFinish?: (result: unknown) => void | Promise<void>;
}

export type AgentStreamParameters<
  CALL_OPTIONS,
  TOOLS extends ToolSet,
  USER_CONTEXT,
> = AgentCallParameters<CALL_OPTIONS, TOOLS, USER_CONTEXT> & {
  experimental_transform?: unknown;
};

export interface Agent<
  CALL_OPTIONS = never,
  TOOLS extends ToolSet = {},
  USER_CONTEXT extends Context = Context,
  OUTPUT = never,
> {
  readonly version: 'agent-v1';
  readonly id: string | undefined;
  readonly tools: TOOLS;

  generate(
    options: AgentCallParameters<CALL_OPTIONS, TOOLS, USER_CONTEXT> & Prompt,
  ): PromiseLike<GenerateTextResult<TOOLS, USER_CONTEXT, OUTPUT>>;

  stream(
    options: AgentStreamParameters<CALL_OPTIONS, TOOLS, USER_CONTEXT> & Prompt,
  ): PromiseLike<StreamTextResult<TOOLS, USER_CONTEXT, OUTPUT>>;
}
