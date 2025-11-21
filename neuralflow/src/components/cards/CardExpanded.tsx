"use client";

import { Fragment } from "react";

import { Dialog, Transition } from "@headlessui/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCard } from "@/hooks/api";
import { X } from "lucide-react";

import { CardAIDock } from "./CardAIDock";
import { CardContextSidebar } from "./CardContextSidebar";
import { CardMetadata } from "./CardMetadata";
import { CardTitleEditor } from "./CardTitleEditor";
import { CardTiptapEditor } from "./CardTiptapEditor";

export type CardExpandedProps = {
  taskId: string;
  open: boolean;
  onClose: () => void;
};

export function CardExpanded({ taskId, open, onClose }: CardExpandedProps) {
  const { data, isLoading } = useCard(taskId);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-3"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-2"
            >
              <Dialog.Panel className="flex h-[80vh] w-full max-w-[1100px] overflow-hidden rounded-2xl border bg-white shadow-2xl">
                <section className="flex flex-1 flex-col bg-white">
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                      {data ? (
                        <CardTitleEditor taskId={taskId} initialTitle={data.task.title} />
                      ) : (
                        <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
                      )}
                    </div>
                    <button className="rounded-full border p-2 text-slate-500 transition hover:bg-slate-100" onClick={onClose}>
                      <X className="size-4" />
                    </button>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-6 px-6 py-5">
                      {isLoading || !data ? (
                        <div className="space-y-4">
                          <div className="h-4 w-[60%] animate-pulse rounded bg-slate-100" />
                          <div className="h-[280px] animate-pulse rounded-xl bg-slate-50" />
                        </div>
                      ) : (
                        <>
                          <CardMetadata task={data.task} />
                          <CardTiptapEditor initialContent={data.note?.contentJson} noteId={data.note?.id} />
                          <CardAIDock taskId={taskId} />
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </section>

                <CardContextSidebar taskId={taskId} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
