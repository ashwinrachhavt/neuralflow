"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Claimable = {
  slug: string;
  name: string;
  rarity: string;
  image: string;
  shards: { current: number; target: number };
  ownedCount: number;
};

export function Claimables() {
  const [items, setItems] = React.useState<Claimable[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [unauthorized, setUnauthorized] = React.useState(false);
  const [action, setAction] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      setUnauthorized(false);
      const res = await fetch("/api/gamify/claimables", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) setUnauthorized(true);
        setItems([]);
        return;
      }
      const json = await res.json();
      setItems(json.claimables ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const claim = async (slug: string) => {
    try {
      setAction(slug);
      const res = await fetch("/api/gamify/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.reason ?? "Failed to claim");
      toast.success("Gem claimed! ✨");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to claim");
    } finally {
      setAction(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available to Claim</CardTitle>
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

  if (unauthorized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available to Claim</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sign in to view and claim your gems.</p>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available to Claim</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No gems ready to claim. Keep earning shards!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Available to Claim</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((g) => (
            <div key={g.slug} className="rounded-lg border p-3 text-center">
              <div className="mx-auto mb-2 h-12 w-12">
                <Image src={g.image} alt={g.name} width={48} height={48} />
              </div>
              <div className="text-xs font-medium">{g.name}</div>
              <div className="text-[10px] text-muted-foreground">{g.shards.current}/{g.shards.target} shards</div>
              <div className="mt-2">
                <Button size="sm" className="w-full" disabled={action === g.slug} onClick={() => claim(g.slug)}>
                  {action === g.slug ? "Claiming…" : "Claim"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
