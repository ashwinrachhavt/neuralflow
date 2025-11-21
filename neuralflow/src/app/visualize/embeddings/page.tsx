import dynamic from 'next/dynamic';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';

const EmbeddingsGraph = dynamic(() => import('@/components/visualize/EmbeddingsGraph'), { ssr: false });

export const metadata = { title: 'Embeddings Space', description: 'Explore tasks/notes via vector space' };

export default function EmbeddingsPage() {
  return (
    <PageShell>
      <SectionHeader title="Embeddings Space" description="UMAP-like PCA projection of your items" />
      <EmbeddingsGraph />
    </PageShell>
  );
}

