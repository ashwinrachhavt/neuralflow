import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: 'Quiz generation has been removed.' }, { status: 404 });
}
