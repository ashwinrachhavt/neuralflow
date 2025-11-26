import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: 'AI report has been removed.' }, { status: 404 });
}
