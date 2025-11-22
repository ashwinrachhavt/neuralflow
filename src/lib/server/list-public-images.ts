import fs from 'fs';
import path from 'path';

export type PublicImage = {
  src: string; // path from web root, e.g. "/gold.png"
  name: string; // human label
  slug: string; // derived from filename
};

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

export async function listPublicImages(): Promise<PublicImage[]> {
  const publicDir = path.join(process.cwd(), 'public');
  let files: string[] = [];
  try {
    files = await fs.promises.readdir(publicDir);
  } catch {
    return [];
  }

  return files
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const base = path.basename(f, path.extname(f));
      const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const name = base.replace(/[_-]+/g, ' ').trim();
      // Keep raw filename in the URL so Next can serve it; browsers handle spaces.
      return { src: `/${encodeURI(f)}`, name, slug } satisfies PublicImage;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
