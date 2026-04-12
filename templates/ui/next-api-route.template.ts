/**
 * Next.js App Router API route
 * ---------------------------------------------------------------------------
 * Canonical shape of a streaming chat route in the AI SDK. Mirrors the
 * `examples/next-openai/app/api/chat/route.ts` pattern.
 *
 * Convention:
 *   - Route file lives at `app/api/chat/route.ts` and exports `POST`.
 *   - The request body is `{ messages: UIMessage[]; id?: string }`.
 *   - The route calls `streamText(...)` and returns
 *     `result.toUIMessageStreamResponse()` - this is what `useChat` expects
 *     on the other end.
 *   - `maxDuration` lifts the default 10s Vercel timeout.
 *   - `convertToModelMessages` turns client `UIMessage`s into `ModelMessage`s.
 */
import type { UIMessage } from './ui-messages.types';
import type { ModelMessage } from '../core/messages.types';
import type { StreamTextResult } from '../core/stream-text.template';
import type { ToolSet } from '../tools/tool-set.types';

// These functions exist in the real SDK - declared here for the template.
declare function streamText<TOOLS extends ToolSet>(
  options: unknown,
): StreamTextResult<TOOLS>;
declare function convertToModelMessages(messages: UIMessage[]): ModelMessage[];
declare const openai: (id: string) => unknown;
declare const tools: ToolSet;

/** Allow up to 60 seconds of streaming on Vercel. */
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are a concise, helpful assistant.',
    messages: convertToModelMessages(messages),
    tools,
    // Stop after at most 5 LM calls in a tool-loop.
    stopWhen: ({ steps }: { steps: unknown[] }) => steps.length >= 5,
    onError({ error }) {
      console.error('streamText error:', error);
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      // Help some proxies avoid buffering SSE.
      'x-vercel-ai-ui-message-stream': 'v1',
    },
  });
}
