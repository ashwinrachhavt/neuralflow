import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function TodosLoading() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/15 p-3">
          <ul className="divide-y divide-border/50">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="py-2">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

