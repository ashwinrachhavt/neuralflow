import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, description: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rawTitle = (body?.title as string | undefined) ?? "";
  const title = rawTitle.trim();
  if (!title) return NextResponse.json({ message: "title is required" }, { status: 400 });
  const description = (body?.description as string | undefined)?.trim() || null;

  const project = await prisma.project.create({
    data: { userId: user.id, title, description },
    select: { id: true, title: true, description: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ project }, { status: 201 });
}

