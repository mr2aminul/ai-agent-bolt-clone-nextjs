interface ParsedContent {
  type: 'text' | 'code' | 'heading' | 'list' | 'quote';
  content: string;
  language?: string;
  filename?: string;
}

export function parseMarkdownContent(text: string): ParsedContent[] {
  const blocks: ParsedContent[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const match = line.match(/```(\w+)?(?:\s+(.+))?/);
      const language = match?.[1] || 'plaintext';
      const filename = match?.[2];
      const codeLines: string[] = [];

      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      blocks.push({
        type: 'code',
        content: codeLines.join('\n').trimEnd(),
        language,
        filename,
      });

      i++;
    } else if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      blocks.push({
        type: 'heading',
        content: line.slice(level + 1).trim(),
      });
      i++;
    } else if (line.startsWith('-') || line.startsWith('*')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].startsWith('-') || lines[i].startsWith('*'))) {
        listItems.push(lines[i].slice(1).trim());
        i++;
      }
      blocks.push({
        type: 'list',
        content: listItems.join('\n'),
      });
    } else if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].slice(1).trim());
        i++;
      }
      blocks.push({
        type: 'quote',
        content: quoteLines.join('\n'),
      });
    } else if (line.trim()) {
      let textContent = line;
      i++;
      while (i < lines.length && !lines[i].startsWith('#') && !lines[i].startsWith('```') &&
             !lines[i].startsWith('-') && !lines[i].startsWith('>') && lines[i].trim()) {
        textContent += '\n' + lines[i];
        i++;
      }
      blocks.push({
        type: 'text',
        content: textContent,
      });
    } else {
      i++;
    }
  }

  return blocks;
}
