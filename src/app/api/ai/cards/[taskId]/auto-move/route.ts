import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: 'Auto-move has been removed.' }, { status: 404 });
}
