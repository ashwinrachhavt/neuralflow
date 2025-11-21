"use client";

import { Fragment } from "react";
import { Dialog, DialogBackdrop, DialogPanel, Transition } from "@headlessui/react";

type Shortcut = { keys: string; description: string };

export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const global: Shortcut[] = [
    { keys: "?", description: "Toggle shortcuts help" },
    { keys: "g t", description: "Go to Todos" },
    { keys: "g f", description: "Go to Focus (Pomodoro)" },
    { keys: "g b", description: "Go to Boards" },
    { keys: "n or ⌘/Ctrl + n", description: "Quick add task" },
  ];
  const context: Shortcut[] = [
    { keys: "Todos: a", description: "Open AI generator" },
    { keys: "Focus: space", description: "Start/Pause timer" },
    { keys: "Focus: s / r", description: "Skip / Reset" },
    { keys: "Card: e", description: "Expand/collapse description" },
  ];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <DialogBackdrop className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-2">
              <DialogPanel className="w-full max-w-xl rounded-xl border border-border/60 bg-background/95 p-5 shadow-xl backdrop-blur-md">
                <h3 className="text-base font-semibold">Keyboard shortcuts</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[{ title: 'Global', list: global }, { title: 'Context', list: context }].map(section => (
                    <div key={section.title}>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</div>
                      <ul className="space-y-1.5">
                        {section.list.map((s, i) => (
                          <li key={i} className="flex items-center justify-between gap-4 rounded border px-3 py-2">
                            <span className="text-sm text-muted-foreground">{s.description}</span>
                            <span className="text-xs font-mono">{s.keys}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

