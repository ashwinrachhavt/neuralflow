# Mind-Palace / Exocortex Starter

This starter lets you build a small personal knowledge graph (PKG) from Markdown notes, optionally add embeddings, and query it.

## Layout

- `data/vault/` — your Markdown notes (with minimal front‑matter)
- `scripts/mindpalace/build-graph.ts` — scans notes → builds graph (`data/graph.json`)
- `scripts/mindpalace/search.ts` — simple search over graph (keyword or vector)

## Front‑matter (minimal)

```md
---
id: unique-id-or-slug
title: Note Title
topics: [Topic A, Topic B]
tags: [optional, tags]
links: [other-note-id-or-title]
---

Body of the note. You can also link with [[wikilinks]].
```

## Build the graph

```bash
pnpm mindpalace:build -- --vault data/vault --out data/graph.json

# With embeddings (requires OPENAI_API_KEY) and semantic edges
pnpm mindpalace:build -- --vault data/vault --out data/graph.json --embed
```

Env:

- `OPENAI_API_KEY` — required only when using `--embed`
- `MP_SIMILARITY_THRESHOLD` — optional (default `0.63`)

## Search the graph

```bash
pnpm mindpalace:search -- --graph data/graph.json --query "cognitive biases" --top 5
```

If embeddings exist and an API key is present, vector search is used; otherwise it falls back to keyword search over titles.

## Notes

- Data stays in Markdown + JSON; no vendor lock‑in.
- You can incrementally add fields (source, emotional_resonance, confidence, etc.). They’ll be preserved in `metadata`.
- Extend edges with more types (`analogy`, `contradiction`, `support`) as you iterate.

