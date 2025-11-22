"use client";

import { selectRewardAsset } from './reward-asset';
import type { GemSlug } from '@/lib/gamification/catalog';
import { cn } from '@/lib/utils';

type Props = {
  slug?: GemSlug;
  src?: string;
  className?: string;
  size?: number; // px side, defaults to 112 (h-28 w-28)
  rounded?: boolean;
};

export function RewardImage({ slug, src, className, size = 112, rounded = true }: Props) {
  const cfg = selectRewardAsset({ slug, image: src });
  return (
    <div
      className={cn('overflow-hidden bg-white/80 shadow-inner ring-2', cfg.bg ?? 'bg-white/80', cfg.ring ?? 'ring-foreground/10', rounded ? 'rounded-full' : 'rounded-xl', className)}
      style={{ width: size, height: size }}
    >
      <img
        src={cfg.src}
        alt={slug ?? 'stone'}
        className="h-full w-full"
        style={{ objectFit: cfg.fit ?? 'cover', objectPosition: cfg.pos ?? 'center', transform: `scale(${cfg.scale ?? 1}) rotate(${(cfg.rotate ?? 0)}deg)` }}
      />
    </div>
  );
}

