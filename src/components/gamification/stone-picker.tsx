"use client";

import * as React from "react";
import Image from "next/image";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { SwitcherImage } from "@/components/gamification/stone-switcher";
import { cn } from "@/lib/utils";

type Props = {
  images: SwitcherImage[];
  value?: string | null; // slug
  onChange?: (slug: string) => void;
  placeholder?: string;
};

export function StonePicker({ images, value, onChange, placeholder = "Search stones by name" }: Props) {
  const [open, setOpen] = React.useState(false);
  const current = value ? images.find((i) => i.slug === value) ?? null : null;

  function choose(slug: string) {
    onChange?.(slug);
    setOpen(false);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
          <Search className="size-4" />
          {current ? current.name : "Choose stone"}
        </Button>
        {current ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="relative size-7 overflow-hidden rounded-full border">
              <img src={current.src} alt={current.name} className="h-full w-full object-cover" />
            </div>
            <span className="truncate max-w-[160px]">{current.name}</span>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => onChange?.(images[0]?.slug ?? "")}> 
              <X className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} title="Select stone" description="Pick a stone image from /public">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No stones found.</CommandEmpty>
            <CommandGroup heading="Stones">
              {images.map((im) => (
                <CommandItem key={im.slug} onSelect={() => choose(im.slug)} className="gap-3">
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-md border">
                    <Image src={im.src} alt={im.name} fill className="object-cover" />
                  </div>
                  <span className={cn("truncate", im.slug === value ? "font-semibold" : undefined)}>
                    {im.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
