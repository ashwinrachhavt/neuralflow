import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function GET() {
  // Public endpoint: returns the catalog of all potential gems.
  await gamificationEngine.ensureCatalog();
  const stones = await prisma.stoneDefinition.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({
    catalog: stones.map((s) => ({
      slug: s.slug,
      name: s.name,
      rarity: s.rarity,
      theme: s.description,
      image: s.imagePath,
    })),
  });
}

