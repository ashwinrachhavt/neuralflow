// Configure how many points each stone adds when awarded or simulated.
// Edit this file to tune your reward economy.

export const STONE_POINT_WEIGHTS: Record<string, number> = {
  // Core catalog
  quartz: 1,
  garnet: 1,
  topaz: 2,
  emerald: 2,
  sapphire: 3,
  ruby: 4,
  diamond: 5,

  // Optional extras if you use these assets
  gold: 3,
  silver: 2,
  opal: 2,
};

export function getStonePoints(slug: string): number {
  const key = slug.toLowerCase();
  return STONE_POINT_WEIGHTS[key] ?? 1;
}

