/**
 * React useChat component
 * ---------------------------------------------------------------------------
 * Canonical shape of a React chat UI on top of `@ai-sdk/react`. Mirrors
 * `packages/react/src/use-chat.ts` and the `next-openai` example.
 *
 * Convention:
 *   - `useChat<UIMessage>()` is generic over the message type so you get
 *     type-safe `metadata` and `data-*` parts.
 *   - Rendering walks `message.parts` - it never reads `message.content`.
 *   - Input state is managed by the component (the hook does not own it).
 *   - Every tool part carries an explicit `state`; the UI switches on it.
 */
import type { UIMessage } from './ui-messages.types';

// Types from @ai-sdk/react, declared here so the template compiles standalone.
interface UseChatHelpers<M extends UIMessage> {
  id: string;
  messages: M[];
  status: 'ready' | 'submitted' | 'streaming' | 'error';
  error: Error | undefined;
  setMessages: (messages: M[] | ((prev: M[]) => M[])) => void;
  sendMessage: (message: { text: string }) => Promise<void>;
  regenerate: () => Promise<void>;
  stop: () => void;
  resumeStream: () => Promise<void>;
  clearError: () => void;
  addToolOutput: (args: { toolCallId: string; output: unknown }) => void;
  addToolApprovalResponse: (args: {
    toolCallId: string;
    approved: boolean;
  }) => void;
}

declare function useChat<M extends UIMessage = UIMessage>(options?: {
  id?: string;
  api?: string;
  experimental_throttle?: number;
  resume?: boolean;
  onFinish?: (args: { message: M }) => void;
  onError?: (error: Error) => void;
}): UseChatHelpers<M>;

// Your app-specific message type. Narrowing `data-*` parts and `metadata`
// happens here via the generic parameters.
type AppMessage = UIMessage<
  { createdAt: string },
  { weather: { location: string; temperatureC: number } }
>;

import { useState } from 'react';

export function Chat() {
  const { messages, status, error, sendMessage, stop } = useChat<AppMessage>({
    api: '/api/chat',
    experimental_throttle: 50,
  });

  const [input, setInput] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage({ text });
  };

  return (
    <div className="chat">
      <ol className="messages">
        {messages.map((message) => (
          <li key={message.id} data-role={message.role}>
            {message.parts.map((part, index) => {
              switch (part.type) {
                case 'text':
                  return <p key={index}>{part.text}</p>;

                case 'reasoning':
                  return (
                    <details key={index}>
                      <summary>thinking</summary>
                      <pre>{part.text}</pre>
                    </details>
                  );

                case 'data-weather':
                  return (
                    <aside key={index} className="weather-card">
                      {part.data.location}: {part.data.temperatureC}°C
                    </aside>
                  );

                case 'dynamic-tool':
                  return (
                    <pre key={index}>
                      {part.toolName} [{part.state}]
                    </pre>
                  );

                default:
                  // Every tool-* part goes here; switch on `part.state`.
                  if (part.type.startsWith('tool-')) {
                    const toolPart = part as {
                      type: `tool-${string}`;
                      state: string;
                      input?: unknown;
                      output?: unknown;
                      errorText?: string;
                    };
                    return (
                      <pre key={index}>
                        {toolPart.type} [{toolPart.state}]
                      </pre>
                    );
                  }
                  return null;
              }
            })}
          </li>
        ))}
      </ol>

      {error ? <p className="error">{error.message}</p> : null}

      <form onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          disabled={status !== 'ready'}
        />
        {status === 'streaming' ? (
          <button type="button" onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="submit" disabled={status !== 'ready' || !input.trim()}>
            Send
          </button>
        )}
      </form>
    </div>
  );
}
