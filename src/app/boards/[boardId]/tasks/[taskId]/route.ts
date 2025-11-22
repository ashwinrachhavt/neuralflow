import { NextResponse } from 'next/server';

type Ctx = { params: Promise<{ boardId: string; taskId: string }> };

// This endpoint exists to gracefully handle POSTs issued by client libs
// (e.g., server action pings) against the current page route. We simply
// acknowledge with 204 to avoid noisy 404s. No state changes here.
export async function POST(_req: Request, _ctx: Ctx) {
  return new NextResponse(null, { status: 204 });
}

