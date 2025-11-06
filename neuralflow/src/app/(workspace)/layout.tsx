import type { ReactNode } from "react";

import { Navbar } from "@/components/navbar";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-6 py-12 lg:py-16">
        {children}
      </main>
    </div>
  );
}
