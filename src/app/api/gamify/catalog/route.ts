import { NextResponse } from "next/server";
import { gamificationEngine } from "@/lib/gamification/engine";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await gamificationEngine.ensureCatalog();
  const stones = await prisma.stoneDefinition.findMany({ orderBy: { name: "asc" } });
  const catalog = stones.map((s: any) => ({
    slug: s.slug,
    name: s.name,
    rarity: s.rarity,
    theme: s.description,
    image: s.imagePath,
  }));
  return NextResponse.json({ catalog });
}
