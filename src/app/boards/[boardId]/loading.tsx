export default function Loading() {
  return (
    <div className="p-6 mx-auto max-w-6xl">
      <div className="h-6 w-40 rounded bg-muted animate-pulse mb-4" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-64 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

