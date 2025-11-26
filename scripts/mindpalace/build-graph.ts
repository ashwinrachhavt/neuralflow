/*
 Build a knowledge graph from Markdown notes (vault) with minimal front-matter.
 - Scans a vault directory for .md files
 - Parses front matter + content
 - Extracts manual links (front-matter `links` and [[wikilinks]])
 - Optionally computes embeddings (requires OPENAI_API_KEY)
 - Writes graph JSON to disk

 Usage:
   pnpm mindpalace:build -- --vault data/vault --out data/graph.json --embed
*/

import fs from 'node:fs/promises';
import path from 'node:path';
import { embedMany } from 'ai';
import { cosineSimilarity } from 'ai';
import { embeddingModel } from '../../src/lib/ai/config';
import { extractWikiLinks, listMarkdownFiles, parseFrontMatter, nowIso } from './utils';

type Node = {
  id: string;
  title: string;
  file: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
};

type Edge = { from: string; to: string; type: string; weight?: number; createdAt: string };

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((s) => {
    const [k, v] = s.startsWith('--') ? s.slice(2).split('=') : [s, 'true'];
    return [k, v ?? 'true'];
  }));

  const vaultDir = args.vault || 'data/vault';
  const outPath = args.out || 'data/graph.json';
  const doEmbed = args.embed === 'true' || args.embed === '' || args.embed === true;

  await fs.mkdir(path.dirname(outPath), { recursive: true });

  const files = await listMarkdownFiles(vaultDir).catch(() => []);
  if (files.length === 0) {
    console.log(`No notes found in ${vaultDir}. Add .md files and re-run.`);
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // pass 1: nodes
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const { data, content } = parseFrontMatter(raw);
    const id = (data.id as string) || path.basename(file, '.md');
    const title = (data.title as string) || id;
    nodes.push({ id, title, file: path.relative(process.cwd(), file), content, metadata: data });
  }

  // helper index by id/title for linking
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const byTitle = new Map(nodes.map((n) => [n.title, n]));

  // pass 2: edges
  for (const n of nodes) {
    const metaLinks = Array.isArray(n.metadata.links) ? n.metadata.links as string[] : [];
    const wikiLinks = extractWikiLinks(n.content);
    const all = [...new Set([...metaLinks, ...wikiLinks])];
    for (const ref of all) {
      const target = byId.get(ref) || byTitle.get(ref);
      if (!target || target.id === n.id) continue;
      edges.push({ from: n.id, to: target.id, type: 'manual_link', createdAt: nowIso() });
    }
  }

  // embeddings
  if (doEmbed) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  --embed requested but OPENAI_API_KEY not set. Skipping embeddings.');
    } else {
      const values = nodes.map((n) => n.content.slice(0, 4000) || n.title);
      console.log(`Embedding ${values.length} notes…`);
      const { embeddings } = await embedMany({ model: embeddingModel(), values });
      embeddings.forEach((vec, i) => (nodes[i].embedding = Array.from(vec)));

      // add semantic similarity edges for top pairs (lightweight heuristic)
      const THRESHOLD = Number(process.env.MP_SIMILARITY_THRESHOLD ?? 0.63);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]; if (!a.embedding) continue;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]; if (!b.embedding) continue;
          const sim = cosineSimilarity(a.embedding, b.embedding);
          if (sim >= THRESHOLD) {
            edges.push({ from: a.id, to: b.id, type: 'semantic_sim', weight: sim, createdAt: nowIso() });
          }
        }
      }
    }
  }

  const graph = { nodes, edges, stats: { nodes: nodes.length, edges: edges.length, embedded: nodes.filter(n => n.embedding).length } };
  await fs.writeFile(outPath, JSON.stringify(graph, null, 2), 'utf8');
  console.log(`Wrote graph to ${outPath} (nodes=${graph.stats.nodes}, edges=${graph.stats.edges})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

