/**
 * Minimal Markdown → HTML converter for blog post rendering.
 * Handles: headings, bold/italic, unordered + ordered lists, paragraphs, blockquotes, code.
 */

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const output: string[] = [];

  type ListType = 'ul' | 'ol';
  let listType: ListType | null = null;
  const listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    output.push(`<${tag}>${listItems.map((li) => `<li>${li}</li>`).join('')}</${tag}>`);
    listItems.length = 0;
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine;

    // Headings
    if (/^### /.test(line)) {
      flushList();
      output.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
      continue;
    }
    if (/^## /.test(line)) {
      flushList();
      output.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
      continue;
    }
    if (/^# /.test(line)) {
      flushList();
      output.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
      continue;
    }

    // Blockquote
    if (/^> /.test(line)) {
      flushList();
      output.push(`<blockquote>${inlineFormat(line.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (/^[*\-] /.test(line)) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(inlineFormat(line.slice(2)));
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\. (.*)/);
    if (olMatch) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(inlineFormat(olMatch[1]));
      continue;
    }

    // Empty line — flush list, emit spacing
    if (line.trim() === '') {
      flushList();
      output.push('');
      continue;
    }

    // Regular paragraph
    flushList();
    output.push(`<p>${inlineFormat(line)}</p>`);
  }

  flushList();
  return output.join('\n');
}

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/#{1,3} /g, '')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[*\-] /gm, '')
    .replace(/^\d+\. /gm, '')
    .replace(/^> /gm, '')
    .trim();
}
