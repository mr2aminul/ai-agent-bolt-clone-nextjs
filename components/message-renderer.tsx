'use client';

import { useEffect, useMemo, useState } from 'react';
import CodeBlock from './code-block';
import { parseMarkdownContent } from '@/lib/markdown-parser';

interface MessageRendererProps {
  content: string;           // may include one or more <think>...</think> blocks
  isThinking?: boolean;      // true while server is streaming this message
  timestamp?: string;        // set when message finalized
}

type Block = { type: 'think' | 'text'; content: string };

/** parse content into text and think blocks (keeps order) */
function parseContentWithThink(content: string): Block[] {
  const blocks: Block[] = [];
  const regex = /<think>([\s\S]*?)<\/think>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(content)) !== null) {
    if (m.index > lastIndex) {
      blocks.push({ type: 'text', content: content.slice(lastIndex, m.index) });
    }
    blocks.push({ type: 'think', content: m[1] ?? '' });
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return blocks;
}

/** Small helper to render a nice time string */
function TimeStamp({ ts }: { ts?: string }) {
  if (!ts) return null;
  return <div className="text-xs text-gray-400 mt-2 text-right select-none">{ts}</div>;
}

export default function MessageRenderer({ content, isThinking = false, timestamp }: MessageRendererProps) {
  // parse blocks only when content changes
  const blocks = useMemo(() => parseContentWithThink(content), [content]);

  // visibility state per think block (true = visible). Defaults:
  //  - if isThinking => hidden (false) so UX shows "Thinking..." indicator by default
  //  - if finalized (isThinking==false but block exists) => hidden by default (previous chats should hide thinked details)
  const initialVisibility = blocks.map(() => false);
  const [thinkVisible, setThinkVisible] = useState<boolean[]>(initialVisibility);

  // Reset visibilities when blocks or isThinking change.
  useEffect(() => {
    // When streaming is active, keep thinks hidden by default (user can reveal)
    setThinkVisible(blocks.map(() => false));
  }, [content, isThinking]);

  const toggleThink = (idx: number) => {
    setThinkVisible(prev => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  return (
    <div className="space-y-3 text-gray-100">
      {blocks.map((block, idx) => {
        if (block.type === 'think') {
          // THINK BLOCK: if isThinking is true and this block contains the current streaming content,
          // show "Thinking..." chip by default. If user toggles visibility, reveal the partial/final content.
          const visible = thinkVisible[idx];

          return (
            <div key={idx} className="relative">
              {/* header row with small toggle */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs text-yellow-300">
                  {isThinking && !visible ? (
                    // Streaming indicator (pulsing) when hidden
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                      <span>Thinking…</span>
                    </>
                  ) : (
                    <span className="text-yellow-300 font-medium">{visible ? 'Thoughts' : 'Thoughts (hidden)'}</span>
                  )}
                </div>

                <button
                  onClick={() => toggleThink(idx)}
                  className="text-xs text-gray-300 hover:text-white px-2 py-1 bg-transparent rounded"
                  aria-pressed={visible}
                >
                  {visible ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* content area: either hidden overlay or actual content */}
              {visible ? (
                <div className="whitespace-pre-wrap rounded-md p-3 bg-[#071727] border border-[#12303b] text-gray-100 text-sm">
                  {/* parse inner markdown for think content */}
                  {renderMarkdownBlocks(block.content)}
                </div>
              ) : (
                // hidden preview area (small subtle box) — make clickable as well
                <div
                  onClick={() => toggleThink(idx)}
                  className="cursor-pointer rounded-md p-2 bg-gradient-to-r from-yellow-900/10 to-transparent border border-yellow-900/10 text-yellow-200 text-sm italic flex items-center gap-2"
                >
                  <span className="opacity-80">[ hidden thought ]</span>
                  <span className="ml-auto text-xs opacity-60">click to show</span>
                </div>
              )}
            </div>
          );
        }

        // normal text block -> render markdown pieces
        return (
          <div key={idx} className="text-sm leading-relaxed text-gray-100">
            {renderMarkdownBlocks(block.content)}
          </div>
        );
      })}

      {/* timestamp (shows only once message finalized by parent) */}
      <TimeStamp ts={timestamp} />
    </div>
  );
}

/** Helper used by both think content and normal text content to render internal markdown pieces */
function renderMarkdownBlocks(content: string) {
  const mdBlocks = parseMarkdownContent(content);
  return mdBlocks.map((mb, i) => {
    switch (mb.type) {
      case 'code':
        return <CodeBlock key={i} code={mb.content} language={mb.language} filename={mb.filename} />;
      case 'heading':
        return <h3 key={i} className="text-lg font-semibold text-white mt-2 mb-2">{mb.content}</h3>;
      case 'list':
        return (
          <ul key={i} className="list-disc list-inside space-y-1 text-gray-300">
            {mb.content.split('\n').map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        );
      case 'quote':
        return <blockquote key={i} className="border-l-4 border-blue-500 pl-4 py-2 my-2 text-gray-400 italic">{mb.content}</blockquote>;
      default:
        return <p key={i} className="whitespace-pre-wrap">{mb.content}</p>;
    }
  });
}
