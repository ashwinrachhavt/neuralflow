"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RewardImage } from './RewardImage';

type Props = {
  open: boolean;
  onClose: () => void;
  stone?: { name: string; image?: string; rarity?: string } | null;
  /** optional CSS selector for the rewards bag anchor to fly to */
  bagSelector?: string;
};

export function StoneCelebrateModal({ open, onClose, stone, bagSelector = '#jewels-anchor' }: Props) {
  // simple particle burst
  const [particles, setParticles] = useState(Array.from({ length: 24 }, (_, i) => i));
  const flyRef = useRef<HTMLDivElement | null>(null);
  const imgSrc = stone?.image ?? '/diamond.png';
  useEffect(() => { if (!open) setParticles(Array.from({ length: 24 }, (_, i) => i)); }, [open]);

  function handleCloseWithFly() {
    const bag = typeof document !== 'undefined' ? document.querySelector(bagSelector) as HTMLElement | null : null;
    const fly = flyRef.current;
    if (!bag || !fly) { onClose(); return; }
    const bagRect = bag.getBoundingClientRect();
    const flyRect = fly.getBoundingClientRect();
    const dx = bagRect.left + bagRect.width / 2 - (flyRect.left + flyRect.width / 2);
    const dy = bagRect.top + bagRect.height / 2 - (flyRect.top + flyRect.height / 2);
    // Animate via Framer motion state; close after 450ms
    setTimeout(() => { onClose(); }, 480);
    // Store offsets on element style for the motion component to pick up via CSS vars
    fly.style.setProperty('--tx', `${dx}px`);
    fly.style.setProperty('--ty', `${dy}px`);
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 grid place-items-center p-6">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card p-6 text-center shadow-2xl">
              {/* particle ring */}
              <div className="pointer-events-none absolute inset-0">
                {particles.map((i) => (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 block h-1 w-1 rounded-full bg-amber-400/80"
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 0], x: (Math.cos((i / particles.length) * Math.PI * 2) * 120), y: (Math.sin((i / particles.length) * Math.PI * 2) * 120), scale: [0.5, 1.2, 0.5] }}
                    transition={{ duration: 1.2, delay: 0.05 * i, repeat: 0 }}
                    style={{ transformOrigin: 'center' }}
                  />
                ))}
              </div>
              {/* Cropped & centered preview with spin reveal */}
              <motion.div
                ref={flyRef}
                initial={{ rotate: -12, scale: 0.92, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <RewardImage src={imgSrc} size={112} />
              </motion.div>
              <motion.h3 className="mt-3 text-lg font-semibold" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.24 }}>
                You earned {stone?.name ?? 'a Stone'}!
              </motion.h3>
              {stone?.rarity ? <p className="text-xs text-muted-foreground">Rarity: {stone.rarity}</p> : null}
              <div className="mt-4">
                <button onClick={handleCloseWithFly} className="rounded-full border border-border/60 px-4 py-2 text-sm hover:bg-foreground/10">Nice!</button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

// A small fixed container used to animate the gem flying to the bag icon
// FlyToBag component is currently unused; remove to satisfy lint
