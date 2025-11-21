"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QuickAddDialog } from "@/components/shortcuts/QuickAddDialog";
import { ShortcutsHelp } from "@/components/shortcuts/ShortcutsHelp";

function isTypingTarget(el: EventTarget | null) {
  if (!el || !(el as any).closest) return false;
  const node = (el as Element).closest('input, textarea, [contenteditable="true"], select');
  return !!node;
}

export function GlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [openQuick, setOpenQuick] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);

  useEffect(() => {
    let timer: number | null = null;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Help: Shift+/
      if (e.key === '/' && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpenHelp(v => !v);
        return;
      }

      // Ignore when typing in inputs, except navigation combos starting with 'g'
      const typing = isTypingTarget(e.target);

      // Quick add: n or mod+n
      if (!typing && ((e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n'))) {
        e.preventDefault();
        if (pathname?.startsWith('/todos')) {
          window.dispatchEvent(new CustomEvent('focus-todos-quick-add'));
        } else {
          setOpenQuick(true);
        }
        return;
      }

      // Sequence handling for 'g x'
      const key = e.key.toLowerCase();
      const allowed = ['g','t','f','b','d'];
      if (!typing && allowed.includes(key)) {
        if (timer) window.clearTimeout(timer);
        setSequence(prev => {
          const next = prev.length === 0 ? [key] : [...prev, key];
          timer = window.setTimeout(() => setSequence([]), 800) as unknown as number;
          // Evaluate combos
          if (next.length === 2 && next[0] === 'g') {
            e.preventDefault();
            if (next[1] === 't') router.push('/todos');
            if (next[1] === 'f') router.push('/pomodoro');
            if (next[1] === 'b') router.push('/boards');
            if (next[1] === 'd') router.push('/dashboard');
            return [];
          }
          return next;
        });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname, router]);

  return (
    <>
      <QuickAddDialog open={openQuick} onClose={() => setOpenQuick(false)} />
      <ShortcutsHelp open={openHelp} onClose={() => setOpenHelp(false)} />
    </>
  );
}

