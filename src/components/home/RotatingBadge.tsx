import { cn } from "@/lib/utils";
import { LeafGlyph } from "./MarqueeBand";

/** Circular text seal: "Made with tradition · Shared with love ·". Rotates via CSS transform. */
export function RotatingBadge({ className, text = "Made with tradition · Shared with love · " }: { className?: string; text?: string }) {
  return (
    <div className={cn("grid place-items-center rounded-full bg-forest-800 text-cream-50 shadow-[0_20px_50px_-20px_rgba(15,42,23,0.7)]", className)} aria-hidden>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full animate-[spin_22s_linear_infinite] motion-reduce:animate-none">
        <defs>
          <path id="badge-ring" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text className="fill-cream-50 text-[9.6px] font-semibold uppercase tracking-[0.24em]">
          <textPath href="#badge-ring">{text}</textPath>
        </text>
      </svg>
      <LeafGlyph className="h-10 w-auto text-leaf-400" />
    </div>
  );
}
