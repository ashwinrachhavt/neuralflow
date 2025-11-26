import fs from 'node:fs/promises';

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(p: string) {
    const entries = await fs.readdir(p, { withFileTypes: true });
    for (const e of entries) {
      const full = `${p}/${e.name}`;
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && /\.md$/i.test(e.name)) out.push(full);
    }
  }
  await walk(dir);
  return out;
}

export type FrontMatter = Record<string, any>;

// Minimal front-matter parser (YAML-like); supports simple key: value and JSON-ish arrays.
export function parseFrontMatter(raw: string): { data: FrontMatter; content: string } {
  if (!raw.startsWith('---')) return { data: {}, content: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: {}, content: raw };
  const header = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).replace(/^\s*\n/, '');
  const data: FrontMatter = {};
  for (const line of header.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      try { data[key] = JSON.parse(val); continue; } catch { /* ignore */ }
    }
    if (/^(true|false)$/i.test(val)) { data[key] = /^true$/i.test(val); continue; }
    if (/^-?\d+(\.\d+)?$/.test(val)) { data[key] = Number(val); continue; }
    data[key] = val.replace(/^"|"$/g, '');
  }
  return { data, content };
}

export function extractWikiLinks(markdown: string): string[] {
  const links: string[] = [];
  const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown))) {
    links.push(m[1].trim());
  }
  return links;
}

export function nowIso() {
  return new Date().toISOString();
}
