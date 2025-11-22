"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, Transition } from "@headlessui/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function QuickAddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setTitle("");
    }
  }, [open]);

  const addMutation = useMutation({
    mutationFn: async (t: string) => {
      const res = await fetch('/api/tasks/quick', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t }) });
      if (!res.ok) throw new Error('failed');
      return (await res.json()) as { id: string };
    },
    onSuccess: async (r) => {
      try { await qc.invalidateQueries(); } catch (e) { void e; }
      try { router.push(`/todos/tasks/${r.id}`); } catch (e) { void e; }
      onClose();
    }
  });

  const submit = () => {
    const v = title.trim();
    if (!v) return;
    addMutation.mutate(v);
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <DialogBackdrop className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-2">
              <DialogPanel className="w-full max-w-md rounded-xl border border-border/60 bg-background/95 p-4 shadow-xl backdrop-blur-md">
                <div className="mb-3 text-sm font-semibold text-muted-foreground">Quick add task</div>
                <div className="flex items-center gap-2">
                  <Input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
                  <Button onClick={submit} disabled={addMutation.isPending}>Add</Button>
                </div>
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
