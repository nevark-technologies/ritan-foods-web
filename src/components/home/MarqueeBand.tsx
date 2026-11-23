import { Marquee } from "@/components/motion/Marquee";

const LINES = ["Made with Tradition", "Shared with Love", "A Mother’s Love in Every Bite", "Delivered across India", "Carefully Selected Ingredients"];

export function LeafGlyph({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 72" className={className} aria-hidden fill="none">
      <path d="M17 1C29 14 33 34 27 52C24 62 20 68 17 71C14 68 10 62 7 52C1 34 5 14 17 1Z" fill="currentColor" />
      <path d="M17 6V68" stroke="var(--color-forest-900)" strokeOpacity=".35" strokeWidth="1.5" />
    </svg>
  );
}

/** Velocity-reactive promise band between the hero and the story. */
export function MarqueeBand() {
  return (
    <section aria-label="Our promise" className="relative z-10 -mt-px overflow-hidden bg-forest-900 py-7 text-cream-50 lg:py-9">
      <Marquee speed={55}>
        {LINES.map((t) => (
          <span key={t} className="flex items-center gap-10 pr-10 font-display text-[clamp(2.2rem,4.6vw,4.4rem)] italic leading-none">
            {t}
            <LeafGlyph className="h-[0.75em] w-auto text-leaf-400" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}
