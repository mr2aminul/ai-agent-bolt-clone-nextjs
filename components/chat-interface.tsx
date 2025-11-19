'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/lm-studio/client';
import MessageRenderer from './message-renderer';

interface ChatInterfaceProps {
  modelPath: string | null;
  agentType?: string;
}

interface LocalMessage extends ChatMessage {
  id: string;
  finalized?: boolean;        // set true when streaming is done
  timestamp?: string | null;  // set when finalized
  streaming?: boolean;        // true while streaming
}

interface AbortableWS {
  abort: () => void;
}

export default function ChatInterface({ modelPath, agentType = 'default' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortableWS | null>(null);
  const messagesRef = useRef<LocalMessage[]>([]);

  // keep ref in sync for websocket callbacks (avoid stale closures)
  useEffect(() => { messagesRef.current = messages; scrollToBottom(); }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
    // find any message that is streaming and mark streaming false (it will remain with partial content)
    setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false, finalized: true, timestamp: new Date().toLocaleTimeString() } : m));
  };

  const sendMessage = () => {
    if (!input.trim() || !modelPath || loading) return;

    // create stable local message objects
    const userMessage: LocalMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      role: 'user',
      content: input.trim()
    };

    // assistant placeholder with an empty think block — streaming true until done
    const assistantMessage: LocalMessage = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      role: 'assistant',
      content: '<think></think>',
      streaming: true,
      finalized: false,
      timestamp: null
    };

    // push both messages to UI
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setLoading(true);

    // open WS and stream
    const ws = new WebSocket('ws://localhost:1235');
    abortControllerRef.current = { abort: () => ws.close() };

    // send payload using snapshot of conversation BEFORE assistant placeholder
    ws.onopen = () => {
      // use messagesRef.current which contains previous conversation (it doesn't include the new user & assistant yet)
      const convo = [...messagesRef.current.map(m => ({ role: m.role, content: m.content })), userMessage].map(m => ({ role: m.role, content: m.content }));
      ws.send(JSON.stringify({
        messages: convo,
        modelPath,
        agentType,
        maxTokens: 2000,
        temperature: 0.7,
        topP: 0.9,
      }));
    };

    let accumulated = '';

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);

        // handle server error
        if (data.error) {
          // replace streaming assistant last msg with an error
          setMessages(prev => {
            const updated = [...prev];
            // find the assistant placeholder we created (last assistant with streaming true)
            const idx = updated.slice().reverse().findIndex(m => m.role === 'assistant' && m.streaming);
            if (idx >= 0) {
              const realIdx = updated.length - 1 - idx;
              updated[realIdx] = {
                ...updated[realIdx],
                content: 'Error generating response',
                streaming: false,
                finalized: true,
                timestamp: new Date().toLocaleTimeString(),
              };
            }
            return updated;
          });
          setLoading(false);
          ws.close();
          abortControllerRef.current = null;
          return;
        }

        // streaming content chunk
        if (data.content) {
          accumulated += data.content;

          // update the assistant placeholder content with a <think> block (streaming)
          setMessages(prev => {
            const updated = [...prev];
            // find the last assistant that is streaming
            const idx = updated.slice().reverse().findIndex(m => m.role === 'assistant' && m.streaming);
            if (idx >= 0) {
              const realIdx = updated.length - 1 - idx;
              updated[realIdx] = {
                ...updated[realIdx],
                content: `<think>${accumulated}</think>`,
                streaming: true,
              };
            } else {
              // if no streaming assistant found, append a new assistant streaming message
              updated.push({
                id: `a-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                role: 'assistant',
                content: `<think>${accumulated}</think>`,
                streaming: true,
                finalized: false,
                timestamp: null
              });
            }
            return updated;
          });
        }

        // final signal
        if (data.done) {
          setMessages(prev => {
            const updated = [...prev];
            const idx = updated.slice().reverse().findIndex(m => m.role === 'assistant' && m.streaming);
            if (idx >= 0) {
              const realIdx = updated.length - 1 - idx;
              // mark finalized, keep final content but hide think details by default (MessageRenderer will hide)
              updated[realIdx] = {
                ...updated[realIdx],
                content: updated[realIdx].content.replace(/<think>\s*<\/think>/i, '<think></think>'), // keep structure if empty
                streaming: false,
                finalized: true,
                timestamp: new Date().toLocaleTimeString(),
              };
            }
            return updated;
          });

          setLoading(false);
          ws.close();
          abortControllerRef.current = null;
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
      // set last assistant placeholder to an error message
      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.slice().reverse().findIndex(m => m.role === 'assistant' && m.streaming);
        if (idx >= 0) {
          const realIdx = updated.length - 1 - idx;
          updated[realIdx] = {
            ...updated[realIdx],
            content: 'WebSocket error occurred',
            streaming: false,
            finalized: true,
            timestamp: new Date().toLocaleTimeString(),
          };
        }
        return updated;
      });
      setLoading(false);
      abortControllerRef.current = null;
      ws.close();
    };

    ws.onclose = () => {
      setLoading(false);
      abortControllerRef.current = null;
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b1020] rounded-lg border border-[#1f2937]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-lg">Start a conversation with the AI assistant</p>
            <p className="text-sm mt-2 text-gray-500">Type a message below to begin</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#0f1724] text-gray-100'
              }`}
            >
              <p className="text-xs font-semibold mb-1 opacity-60">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </p>

              <MessageRenderer
                content={msg.content}
                isThinking={!!msg.streaming}
                timestamp={msg.finalized ? msg.timestamp ?? undefined : undefined}
                // collapsedByDefault for finalized think blocks will be handled inside MessageRenderer
              />
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[#1f2937] p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={modelPath ? 'Type your message... (Enter to send)' : 'Please select a model first'}
            disabled={!modelPath || loading}
            className="flex-1 px-3 py-2 bg-[#07101a] border border-[#15202b] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-500 resize-none"
            rows={3}
          />
          <div className="flex flex-col gap-2">
            {loading ? (
              <button
                onClick={stopStreaming}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !modelPath}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
