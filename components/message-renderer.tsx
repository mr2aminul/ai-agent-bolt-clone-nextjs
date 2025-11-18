'use client';

import CodeBlock from './code-block';
import { parseMarkdownContent } from '@/lib/markdown-parser';

interface MessageRendererProps {
  content: string;
}

export default function MessageRenderer({ content }: MessageRendererProps) {
  const blocks = parseMarkdownContent(content);

  return (
    <div className="space-y-3 text-gray-100">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'code':
            return (
              <CodeBlock
                key={index}
                code={block.content}
                language={block.language}
                filename={block.filename}
              />
            );
          case 'heading':
            return (
              <h3 key={index} className="text-lg font-semibold text-white mt-3 mb-2">
                {block.content}
              </h3>
            );
          case 'list':
            return (
              <ul key={index} className="list-disc list-inside space-y-1 text-gray-300">
                {block.content.split('\n').map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );
          case 'quote':
            return (
              <blockquote
                key={index}
                className="border-l-4 border-blue-500 pl-4 py-2 my-2 text-gray-400 italic"
              >
                {block.content}
              </blockquote>
            );
          default:
            return (
              <p key={index} className="whitespace-pre-wrap leading-relaxed">
                {block.content}
              </p>
            );
        }
      })}
    </div>
  );
}
