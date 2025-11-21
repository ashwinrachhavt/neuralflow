import { NextResponse } from "next/server";
import { GEM_META, GEM_ICON_PATHS, type GemSlug } from "@/lib/gamification/catalog";

export async function GET() {
  const items = (Object.keys(GEM_META) as GemSlug[]).map((slug) => ({
    slug,
    name: GEM_META[slug].name,
    theme: GEM_META[slug].theme,
    rarity: GEM_META[slug].rarity,
    image: GEM_ICON_PATHS[slug] ?? null,
  }));
  return NextResponse.json({ stones: items });
}

