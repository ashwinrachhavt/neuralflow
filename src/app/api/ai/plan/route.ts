import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: 'Planning has been removed.' }, { status: 404 });
}
