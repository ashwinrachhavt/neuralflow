/*
 Simple search over the built graph.
 - If embeddings exist and OPENAI_API_KEY is set, embeds the query and does vector search.
 - Otherwise falls back to keyword search over titles.

 Usage:
   pnpm mindpalace:search -- --graph data/graph.json --query "cognitive biases" --top 5
*/

import fs from 'node:fs/promises';
import { embed } from 'ai';
import { cosineSimilarity } from 'ai';
import { embeddingModel } from '../../src/lib/ai/config';

type Graph = { nodes: Array<{ id: string; title: string; content: string; embedding?: number[] }>; edges: any[] };

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((s) => {
    const [k, v] = s.startsWith('--') ? s.slice(2).split('=') : [s, 'true'];
    return [k, v ?? 'true'];
  }));
  const graphPath = args.graph || 'data/graph.json';
  const query = args.query || '';
  const top = Number(args.top || 5);
  if (!query) { console.error('Provide --query "..."'); process.exit(1); }

  const raw = await fs.readFile(graphPath, 'utf8');
  const graph: Graph = JSON.parse(raw);

  const embeddedCount = graph.nodes.filter(n => n.embedding).length;
  if (embeddedCount > 0 && process.env.OPENAI_API_KEY) {
    const { embedding } = await embed({ model: embeddingModel(), value: String(query) });
    const scored = graph.nodes.map(n => ({ n, score: n.embedding ? cosineSimilarity(n.embedding, embedding) : -1 })).sort((a,b) => b.score - a.score);
    console.log(`Top ${top} for: "${query}"`);
    for (const { n, score } of scored.slice(0, top)) {
      console.log(`- ${n.title} (${n.id})  •  sim=${score.toFixed(3)}`);
    }
  } else {
    // fallback keyword search in titles
    const q = String(query).toLowerCase();
    const hits = graph.nodes.filter(n => n.title.toLowerCase().includes(q)).slice(0, top);
    console.log(`Top ${top} (keyword) for: "${query}"`);
    for (const n of hits) console.log(`- ${n.title} (${n.id})`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

