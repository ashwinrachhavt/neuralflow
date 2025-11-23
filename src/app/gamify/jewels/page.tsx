import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { JewelsGrid } from "./view";
import { listPublicImages } from "@/lib/server/list-public-images";
import { GEM_META, GemSlug } from "@/lib/gamification/catalog";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Jewels",
  description: "Your collection of earned gems.",
};

export default async function JewelsPage() {
  const { userId } = await auth();

  // Fetch all stone definitions to map slugs to IDs
  const definitions = await prisma.stoneDefinition.findMany();

  // Fetch user's owned stones
  const ownedStones = userId
    ? await prisma.userStone.findMany({ where: { userId } })
    : [];

  const ownedStoneIds = new Set(ownedStones.map(s => s.stoneId));

  // Get ALL public images
  const publicImages = await listPublicImages();

  // Map all public images to view format
  const images = publicImages.map(img => {
    // Check if this image is in our catalog
    const catalogEntry = Object.entries(GEM_META).find(
      ([slug, meta]) => img.slug === slug || img.name.toLowerCase().includes(slug)
    );

    const slug = catalogEntry ? catalogEntry[0] as GemSlug : img.slug;
    const def = definitions.find(d => d.slug === slug);
    const isUnlocked = def ? ownedStoneIds.has(def.id) : false;

    return {
      slug: img.slug,
      name: catalogEntry ? GEM_META[slug as GemSlug].name : img.name,
      src: img.src,
      unlocked: isUnlocked,
      theme: catalogEntry ? GEM_META[slug as GemSlug].theme : "",
      rarity: catalogEntry ? GEM_META[slug as GemSlug].rarity : "COMMON" as const,
    };
  });

  return (
    <PageShell>
      <SectionHeader title="Jewels" description="Your collection of earned gems." />
      <JewelsGrid images={images} />
    </PageShell>
  );
}
