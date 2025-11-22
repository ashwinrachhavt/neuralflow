import type { GemSlug } from '@/lib/gamification/catalog';
import { GEM_ICON_PATHS } from '@/lib/gamification/catalog';

export type RewardAssetConfig = {
  src: string;
  fit?: 'cover' | 'contain';
  pos?: string; // object-position (e.g., 'center', '50% 40%')
  scale?: number; // transform scale
  rotate?: number; // degrees
  bg?: string; // background utility classes
  ring?: string; // ring utility classes
  sparkle?: string; // particle color class utility
};

// Map file basenames to display presets (cropping/positioning/scale)
const FILE_ASSET_MAP: Record<string, Omit<RewardAssetConfig, 'src'>> = {
  'quartz.png': { fit: 'cover', pos: 'center', scale: 1.05, bg: 'bg-card/80', ring: 'ring-rose-300/30' },
  'garnet.png': { fit: 'cover', pos: '50% 45%', scale: 1.08, ring: 'ring-red-300/30' },
  'topaz.png': { fit: 'cover', pos: 'center', scale: 1.06, ring: 'ring-amber-300/30' },
  'emerald.png': { fit: 'cover', pos: 'center', scale: 1.04, ring: 'ring-emerald-300/30' },
  'sapphire.png': { fit: 'cover', pos: 'center', scale: 1.03, ring: 'ring-sky-300/30' },
  'ruby.png': { fit: 'cover', pos: 'center', scale: 1.07, ring: 'ring-rose-400/40' },
  'diamond.png': { fit: 'contain', pos: 'center', scale: 1.0, ring: 'ring-indigo-300/40' },
};

function basename(path?: string) {
  if (!path) return '';
  try { return path.split('/').pop() ?? path; } catch { return path; }
}

export function selectRewardAsset(input: { slug?: GemSlug; image?: string }): RewardAssetConfig {
  const src = input.image ?? (input.slug ? GEM_ICON_PATHS[input.slug] : '/diamond.png');
  const name = basename(src);
  const preset = FILE_ASSET_MAP[name] ?? { fit: 'cover', pos: 'center', scale: 1.0, ring: 'ring-foreground/10' };
  return { src, ...preset };
}
