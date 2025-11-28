import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const pub = join(process.cwd(), 'public');
    const files = await readdir(pub);
  const imgs = files.filter((f: string) => /\.(png|jpg|jpeg|gif|webp)$/i.test(f)).sort();
    return NextResponse.json({ files: imgs });
  } catch (e: any) {
    return NextResponse.json({ files: [], error: String(e?.message ?? e) }, { status: 500 });
  }
}
