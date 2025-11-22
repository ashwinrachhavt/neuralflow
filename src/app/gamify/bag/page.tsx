"use client";

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';

type BagItem = { id: string; slug: string; name: string; image?: string; rarity: string; owned: number; shards: { current: number; target: number } };

export default function BagPage() {
  const [items, setItems] = useState<BagItem[]>([]);
  useEffect(() => { fetch('/api/gamify/bag').then(r=>r.json()).then(d=>setItems(d.items ?? [])); }, []);
  const ownedCount = items.reduce((a, i) => a + (i.owned > 0 ? 1 : 0), 0);

  return (
    <PageShell>
      <SectionHeader title="Jewels" description={`${ownedCount}/${items.length} gemstones collected`} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((it) => (
          <div key={it.id} className="group rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
            <div className="relative mx-auto">
              <div className="grid place-items-center">
                {/* jewels anchor for fly animation when on this page */}
                <div id="jewels-anchor" className="absolute -top-8 right-0 h-4 w-4"></div>
              </div>
              <div className="mx-auto">
                <img src={it.image ?? '/diamond.png'} alt="preload" className="hidden" />
              </div>
              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full ring-2 ring-foreground/10">
                <img src={it.image ?? '/diamond.png'} alt={it.name} className="h-full w-full object-cover object-center group-hover:scale-105 transition" />
                {it.owned === 0 ? <div className="absolute inset-0 grid place-items-center bg-black/40 text-[10px] uppercase tracking-widest text-white">Locked</div> : null}
              </div>
            </div>
            <div className="mt-3 text-center">
              <div className="text-sm font-semibold">{it.name}</div>
              <div className="text-[10px] text-muted-foreground">Rarity: {it.rarity}</div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.round((it.shards.current / it.shards.target) * 100))}%` }} />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">{it.shards.current}/{it.shards.target} shards • {it.owned} owned</div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
