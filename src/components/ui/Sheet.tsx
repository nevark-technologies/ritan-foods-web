"use client";

import { AnimatePresence, m, type TargetAndTransition } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { lockScroll, useLenisRef } from "@/components/motion/SmoothScroll";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type Side = "right" | "left" | "top" | "center";

const panelMotion: Record<Side, { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }> = {
  right: { initial: { x: "104%" }, animate: { x: 0 }, exit: { x: "104%" } },
  left: { initial: { x: "-104%" }, animate: { x: 0 }, exit: { x: "-104%" } },
  top: { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } },
  center: { initial: { opacity: 0, y: 24, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 12, scale: 0.98 } },
};

/**
 * Accessible modal sheet on the native <dialog> (focus containment, Esc,
 * inert background for free) with spring-driven enter/exit.
 */
export function Sheet({
  open,
  onClose,
  side = "right",
  label,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: Side;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const lenisRef = useLenisRef();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      lockScroll(lenisRef.current, true);
    }
  }, [open, lenisRef]);

  useEffect(() => () => lockScroll(lenisRef.current, false), [lenisRef]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-ink-900 backdrop:bg-transparent open:block"
    >
      <AnimatePresence
        onExitComplete={() => {
          ref.current?.close();
          lockScroll(lenisRef.current, false);
        }}
      >
        {open && (
          <>
            <m.div
              key="overlay"
              className="absolute inset-0 bg-forest-950/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              onClick={onClose}
            />
            <m.div
              key="panel"
              role="document"
              data-lenis-prevent
              className={cn(
                "absolute flex flex-col overflow-y-auto overscroll-contain bg-cream-50 shadow-2xl",
                side === "right" && "inset-y-0 right-0 w-full max-w-[460px]",
                side === "left" && "inset-y-0 left-0 w-full max-w-[520px]",
                side === "top" && "inset-x-0 top-0 max-h-[92dvh]",
                side === "center" && "left-1/2 top-[10vh] max-h-[80dvh] w-[min(680px,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl",
                className,
              )}
              {...panelMotion[side]}
              transition={side === "center" ? spring.snappy : spring.sheet}
            >
              {children}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </dialog>
  );
}
