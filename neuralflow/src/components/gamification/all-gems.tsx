"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type CatalogItem = { slug: string; name: string; rarity: string; theme: string; image: string };

export function AllGems() {
  const [items, setItems] = React.useState<CatalogItem[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/gamify/catalog", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load catalog (${res.status})`);
        const json = await res.json();
        if (active) setItems(json.catalog ?? []);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load catalog");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Gems</CardTitle>
          <CardDescription>Browse all potential unlocks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Gems</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Gems</CardTitle>
        <CardDescription>Browse all potential unlocks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {items?.map((g) => (
            <div key={g.slug} className="rounded-lg border p-3 text-center">
              <div className="mx-auto mb-2 h-12 w-12">
                <Image src={g.image} alt={g.name} width={48} height={48} />
              </div>
              <div className="text-xs font-medium">{g.name}</div>
              <div className="text-[10px] text-muted-foreground">{g.theme}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{g.rarity}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

