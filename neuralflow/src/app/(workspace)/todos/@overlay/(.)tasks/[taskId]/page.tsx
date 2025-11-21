"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardSheet } from '@/components/cards/CardSheet';

export default function TodosTaskOverlay({ params }: { params: Promise<{ taskId: string }> }) {
  const router = useRouter();
  const [taskId, setTaskId] = useState<string | null>(null);
  useEffect(() => { params.then(p => setTaskId(p.taskId)); }, [params]);
  if (!taskId) return null;
  return (
    <CardSheet taskId={taskId} open={true} onClose={() => router.back()} onOpenFull={(id) => router.push(`/tasks/${id}`)} />
  );
}
