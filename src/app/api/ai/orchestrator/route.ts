import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: 'Orchestrator has been removed.' }, { status: 404 });
}
