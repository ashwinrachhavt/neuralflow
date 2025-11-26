import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: 'Suggest next action has been removed.' }, { status: 404 });
}
