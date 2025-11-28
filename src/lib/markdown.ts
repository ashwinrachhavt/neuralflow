import type { JSONContent } from '@tiptap/react';

type Node = JSONContent & { content?: Node[] };

function applyMarks(text: string, marks?: { type?: string; attrs?: any }[] | null): string {
  if (!marks || marks.length === 0) return text;
  let out = text;
  for (const m of marks) {
    switch (m?.type) {
      case 'bold':
        out = `**${out}**`;
        break;
      case 'italic':
        out = `*${out}*`;
        break;
      case 'strike':
        out = `~~${out}~~`;
        break;
      case 'code':
        out = `\`${out}\``;
        break;
      default:
        out = out;
    }
  }
  return out;
}

function serializeInline(nodes: Node[] | undefined): string {
  if (!nodes || nodes.length === 0) return '';
  return nodes.map((n) => {
    if (n.type === 'text') return applyMarks(n.text ?? '', n.marks as any);
    if (n.type === 'hardBreak') return '  \n';
    if (n.content) return serializeInline(n.content);
    return '';
  }).join('');
}

function indentLines(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line) => (line.length ? `${prefix}${line}` : prefix.trimEnd()))
    .join('\n');
}

function serializeNode(node: Node, depth = 0, olIndex = 1): string {
  const type = node.type;
  switch (type) {
    case 'doc':
      return (node.content ?? []).map((c) => serializeNode(c, depth)).filter(Boolean).join('\n\n').trim();
    case 'paragraph': {
      const text = serializeInline(node.content);
      return text.trim().length ? text : '';
    }
    case 'heading': {
      const level = Math.max(1, Math.min(6, (node.attrs as any)?.level ?? 1));
      const prefix = '#'.repeat(level);
      return `${prefix} ${serializeInline(node.content)}`.trim();
    }
    case 'bulletList': {
      return (node.content ?? [])
        .map((li) => serializeNode(li, depth + 1))
        .filter(Boolean)
        .join('\n');
    }
    case 'orderedList': {
      let index = ((node.attrs as any)?.start ?? 1) as number;
      return (node.content ?? [])
        .map((li) => serializeNode({ ...li, attrs: { ...(li.attrs || {}), _olIndex: index++ } as any }, depth + 1))
        .filter(Boolean)
        .join('\n');
    }
    case 'listItem': {
      const isOrdered = typeof (node.attrs as any)?._olIndex === 'number';
      const bullet = isOrdered ? `${(node.attrs as any)._olIndex}. ` : '- ';
      const lines = (node.content ?? []).map((c) => serializeNode(c, depth)).filter(Boolean).join('\n');
      const indented = indentLines(lines, '  ');
      const firstLine = indented.split('\n')[0] ?? '';
      const rest = indented.split('\n').slice(1).join('\n');
      return `${bullet}${firstLine}${rest ? `\n${rest}` : ''}`;
    }
    case 'taskList': {
      return (node.content ?? [])
        .map((li) => serializeNode(li, depth + 1))
        .filter(Boolean)
        .join('\n');
    }
    case 'taskItem': {
      const checked = !!(node.attrs as any)?.checked;
      const prefix = checked ? '- [x] ' : '- [ ] ';
      const body = (node.content ?? []).map((c) => serializeNode(c, depth)).filter(Boolean).join('\n');
      const indented = indentLines(body, '  ');
      const [first, ...rest] = indented.split('\n');
      return `${prefix}${first ?? ''}${rest.length ? `\n${rest.join('\n')}` : ''}`;
    }
    case 'blockquote': {
      const inner = (node.content ?? []).map((c) => serializeNode(c, depth)).filter(Boolean).join('\n\n');
      return indentLines(inner, '> ');
    }
    case 'codeBlock': {
      const lang = (node.attrs as any)?.language || '';
      const text = (node.content ?? []).map((t) => (t.text ?? '')).join('');
      return [
        '```' + lang,
        text.replace(/```/g, '\u200B```'),
        '```',
      ].join('\n');
    }
    case 'horizontalRule':
      return '---';
    default: {
      // Fallback: try inline
      return serializeInline(node.content);
    }
  }
}

export function tiptapJSONToMarkdown(input?: JSONContent | string | null): string {
  if (!input) return '';
  if (typeof input === 'string') return input; // assume raw markdown already
  try {
    return serializeNode(input).trim();
  } catch {
    return '';
  }
}

