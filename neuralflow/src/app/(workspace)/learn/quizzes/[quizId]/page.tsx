"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

type QuizDetail = {
  id: string;
  title: string;
  createdAt: string;
  questions: { id: string; promptMarkdown: string; correctAnswer: any }[];
};

export default function QuizDetailPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId;
  const { data, isLoading } = useQuery<QuizDetail>({
    queryKey: ["quiz", quizId],
    queryFn: async () => (await (await fetch(`/api/learn/quizzes/${quizId}`)).json()) as QuizDetail,
  });

  return (
    <main>
      {isLoading ? <div>Loading…</div> : null}
      {data ? (
        <div>
          <h1 className="text-2xl font-semibold">{data.title}</h1>
          <p className="mb-6 text-sm text-muted-foreground">{new Date(data.createdAt).toLocaleString()}</p>
          <ol className="space-y-3 list-decimal pl-5">
            {data.questions.map(q => (
              <li key={q.id} className="rounded-lg border p-4">
                <div className="font-medium">{q.promptMarkdown}</div>
                {q.correctAnswer ? (
                  <div className="mt-2 text-sm text-muted-foreground">Answer: {typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer)}</div>
                ) : null}
              </li>
            ))}
            {data.questions.length === 0 && (
              <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground list-none">No questions in this quiz yet</li>
            )}
          </ol>
        </div>
      ) : null}
    </main>
  );
}

