"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 mx-auto max-w-6xl">
      <h2 className="text-xl font-semibold">Something went wrong loading the board</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button className="mt-4 rounded border px-3 py-2" onClick={() => reset()}>Try again</button>
    </div>
  );
}

