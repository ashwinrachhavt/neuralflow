import { NextResponse } from 'next/server';
import { STONE_POINT_WEIGHTS } from '@/lib/gamification/config';

export async function GET() {
  return NextResponse.json({ stonePointWeights: STONE_POINT_WEIGHTS });
}

