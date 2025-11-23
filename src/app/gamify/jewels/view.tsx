"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Dialog, DialogBackdrop, DialogPanel, Transition } from "@headlessui/react";
import type { PublicImage } from "@/lib/server/list-public-images";
import { cn } from "@/lib/utils";

export function JewelsGrid({ images }: { images: any[] }) {
  const [openSlug, setOpenSlug] = React.useState<string | null>(null);
  const current = openSlug ? images.find(i => i.slug === openSlug) ?? null : null;
  const currentIndex = openSlug ? images.findIndex(i => i.slug === openSlug) : -1;

  // Keyboard navigation within the lightbox
  React.useEffect(() => {
    if (!current) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (currentIndex + 1 + images.length) % images.length;
        setOpenSlug(images[next]?.slug ?? null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (currentIndex - 1 + images.length) % images.length;
        setOpenSlug(images[prev]?.slug ?? null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, currentIndex, images]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {images.map((im, idx) => (
          <motion.button
            key={im.slug}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            onClick={() => setOpenSlug(im.slug)}
            whileHover={{ scale: 1.015 }}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-4 text-left shadow-sm outline-none ring-0 transition hover:bg-card/90",
              im.unlocked ? "border-primary/20 bg-primary/5" : "border-border/60 bg-card/80"
            )}
          >
            <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full ring-2 ring-foreground/10">
              {/* Shared element for soft zoom */}
              <motion.div layoutId={`jewel-${im.slug}`} className="absolute inset-0">
                <Image
                  src={im.src}
                  alt={im.name}
                  fill
                  className={cn(
                    "object-cover object-center transition-all duration-500",
                    im.unlocked ? "opacity-100 blur-0" : "opacity-40 blur-[1px] grayscale"
                  )}
                />
              </motion.div>
              {!im.unlocked && (
                <div className="absolute inset-0 grid place-items-center bg-black/40 text-[10px] uppercase tracking-widest text-white">Locked</div>
              )}
            </div>
            <div className="mt-3 text-center">
              <div className="text-sm font-semibold line-clamp-1" title={im.name}>{im.name}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {im.theme}
              </div>
              {im.unlocked && (
                <div className="mt-2 text-[10px] font-medium text-primary">
                  UNLOCKED
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Zoom Lightbox (not full-screen, elegant panel) */}
      <Transition show={!!current} as={React.Fragment}>
        <Dialog onClose={() => setOpenSlug(null)} className="relative z-50">
          <Transition.Child as={React.Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 grid place-items-center p-4">
            <Transition.Child as={React.Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
              <DialogPanel className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
                {current ? (
                  <div className="relative">
                    <div className="relative aspect-square w-full">
                      {/* Subtle scale/rotate on zoom for flair */}
                      <motion.div initial={{ scale: 0.98, rotate: -1 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} className="absolute inset-0">
                        <motion.div layoutId={`jewel-${current.slug}`} className="absolute inset-0">
                          <Image
                            src={current.src}
                            alt={current.name}
                            fill
                            className={cn(
                              "object-contain transition-all duration-500",
                              current.unlocked ? "opacity-100 blur-0" : "opacity-40 blur-[1px] grayscale"
                            )}
                          />
                        </motion.div>
                      </motion.div>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
                    </div>
                    {!current.unlocked && (
                      <div className="absolute right-3 top-3 rounded-full border border-border/60 bg-foreground/10 px-3 py-1 text-[10px] uppercase tracking-widest text-foreground/90">Locked</div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{current.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{current.theme}</p>
                      <div className="mt-3 text-right">
                        <button onClick={() => setOpenSlug(null)} className="rounded-full border border-border/60 px-4 py-1.5 text-sm hover:bg-foreground/10">Close</button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DialogPanel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
