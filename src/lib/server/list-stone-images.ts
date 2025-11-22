import { prisma } from "@/lib/prisma";
import { gamificationEngine } from "@/lib/gamification/engine";
import type { PublicImage } from "@/lib/server/list-public-images";

export async function listStoneImages(): Promise<PublicImage[]> {
  await gamificationEngine.ensureCatalog();
  const stones = await prisma.stoneDefinition.findMany({ orderBy: { name: "asc" } });
  return stones.map((stone) => ({
    slug: stone.slug,
    name: stone.name,
    src: stone.imagePath,
  }));
}
