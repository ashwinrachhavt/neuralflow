import { Suspense } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';
import EmbeddingsGraph from '@/components/visualize/EmbeddingsGraph';

export const metadata = { title: 'Embeddings Space', description: 'Explore tasks/notes via vector space' };

export default function EmbeddingsPage() {
  return (
    <PageShell>
      <SectionHeader title="Embeddings Space" description="UMAP-like PCA projection of your items" />
      <Suspense fallback={<div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">Loading embeddings…</div>}>
        <EmbeddingsGraph />
      </Suspense>
    </PageShell>
  );
}
