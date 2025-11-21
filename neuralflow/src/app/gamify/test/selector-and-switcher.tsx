"use client";

import * as React from "react";
import type { PublicImage } from "@/lib/server/list-public-images";
import { StonePicker } from "@/components/gamification/stone-picker";
import { StoneSwitcher } from "@/components/gamification/stone-switcher";

export function SelectorAndSwitcher({ images }: { images: PublicImage[] }) {
  const [slug, setSlug] = React.useState<string | undefined>(images[0]?.slug);
  return (
    <div className="space-y-4">
      <StonePicker images={images} value={slug ?? null} onChange={(s) => setSlug(s)} />
      <StoneSwitcher images={images} selectedSlug={slug} onSelectedSlugChange={setSlug} />
    </div>
  );
}

