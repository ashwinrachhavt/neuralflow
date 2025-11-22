import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";

export async function getUserOr401() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return user;
}

export async function readJson<T = any>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

