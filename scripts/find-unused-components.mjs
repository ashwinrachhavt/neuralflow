#!/usr/bin/env node
// Simple unused components check (no external deps):
// - Scans src/components/**/*.tsx
// - Treats a file as used if its basename (without extension) or its path is referenced anywhere in src/
// - Excludes index barrels and ui primitives intentionally kept

import { execSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const root = process.cwd();
const SRC = join(root, 'src');
const COMPONENTS_DIR = join(SRC, 'components');

const EXCLUDES = new Set([
  // barrels or special files
  'index.ts',
]);

function listTsx(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listTsx(full));
    else if (entry.endsWith('.tsx') && !EXCLUDES.has(entry)) out.push(full);
  }
  return out;
}

function rgAvailable() {
  try { execSync('rg --version', { stdio: 'ignore' }); return true; } catch { return false; }
}

if (!rgAvailable()) {
  console.error('ripgrep (rg) is required for unused component check.');
  process.exit(0); // do not fail CI if rg is missing
}

const files = listTsx(COMPONENTS_DIR);
const UNUSED = [];
for (const file of files) {
  const rel = relative(SRC, file).replaceAll('\\', '/');
  const name = basename(file).replace(/\.tsx$/, '');
  // Search for import paths or jsx usage by name
  const query = [
    `'${rel}'`,
    `"${rel}"`,
    name + '\\s*[:/>]', // jsx usage heuristic
  ];
  const cmd = `rg -n -S -g '!${rel}' -g '!**/*.test.*' -g '!**/__tests__/**' "${query.join('|')}" ${SRC}`;
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (!out.trim()) UNUSED.push(rel);
  } catch {
    // no matches
    UNUSED.push(rel);
  }
}

if (UNUSED.length) {
  console.error('Unused components detected:\n' + UNUSED.map(f => ` - ${f}`).join('\n'));
  process.exit(1);
}
console.log('No unused components detected');

