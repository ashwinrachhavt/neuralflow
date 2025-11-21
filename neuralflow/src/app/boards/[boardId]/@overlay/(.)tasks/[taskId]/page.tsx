"use client";

import { useRouter } from 'next/navigation';
import { CardSheet } from '@/components/cards/CardSheet';

export default function BoardTaskOverlay({ params }: { params: Promise<{ boardId: string; taskId: string }> }) {
  // Next 16: params is a Promise in client route segments
  const [boardId, taskId] = useParamsSync(params);
  const router = useRouter();
  if (!taskId) return null;
  return (
    <CardSheet
      taskId={taskId}
      open={true}
      onClose={() => router.back()}
      onOpenFull={(id) => router.push(`/tasks/${id}`)}
      layoutIdBase="kanban-"
    />
  );
}

function useParamsSync(p: Promise<{ boardId: string; taskId: string }>): [string | null, string | null] {
  const [vals, setVals] = (require('react') as typeof import('react')).useState<[string | null, string | null]>([null, null]);
  (require('react') as typeof import('react')).useEffect(() => {
    p.then(({ boardId, taskId }) => setVals([boardId, taskId]));
  }, [p]);
  return vals;
}

