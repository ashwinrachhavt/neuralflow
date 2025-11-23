import { NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";
import { getUserOverview } from "@/server/db/userOverview";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const data = await getUserOverview((user as any).id as string);
  return NextResponse.json(data);
}

