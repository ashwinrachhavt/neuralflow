import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: 'Todo agent has been removed.' }, { status: 404 });
}
