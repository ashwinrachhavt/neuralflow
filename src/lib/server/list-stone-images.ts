import { prisma } from "@/lib/prisma";
import { gamificationEngine } from "@/lib/gamification/engine";
import { listPublicImages, type PublicImage } from "@/lib/server/list-public-images";

export async function listStoneImages(): Promise<PublicImage[]> {
  // 1) DB-backed stones (authoritative catalog)
  await gamificationEngine.ensureCatalog();
  const stones = await prisma.stoneDefinition.findMany({ orderBy: { name: "asc" } });
  const dbImages: PublicImage[] = stones.map((stone) => ({
    slug: stone.slug,
    name: stone.name,
    src: stone.imagePath,
  }));

  // 2) All public images
  const publicImages = await listPublicImages();

  // 3) Merge: include any public image not already present in DB list (by src)
  const existingSrc = new Set(dbImages.map((i) => i.src));
  const extras = publicImages.filter((im) => !existingSrc.has(im.src));

  return [...dbImages, ...extras].sort((a, b) => a.name.localeCompare(b.name));
}
