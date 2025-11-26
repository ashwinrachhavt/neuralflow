import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: 'AI text generation has been removed for initial rollout.' }, { status: 404 });
}
