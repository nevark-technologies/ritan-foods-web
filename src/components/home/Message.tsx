import { Parallax } from "@/components/motion/Parallax";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { LeafGlyph } from "./MarqueeBand";

/** A message from Ritan Foods — words fill in as you scroll. */
export function Message() {
  return (
    <section aria-labelledby="message-title" className="relative overflow-hidden bg-forest-900 py-32 text-cream-50 lg:py-48">
      <Parallax speed={-0.35} className="pointer-events-none absolute -left-24 top-10 opacity-[0.07]">
        <LeafGlyph className="h-[38rem] w-auto rotate-[-24deg] text-sprout-300" />
      </Parallax>
      <Parallax speed={0.3} className="pointer-events-none absolute -right-20 bottom-0 opacity-[0.06]">
        <LeafGlyph className="h-[30rem] w-auto rotate-[30deg] text-sprout-300" />
      </Parallax>
      <div className="container-x relative">
        <p id="message-title" className="eyebrow text-center text-sprout-300">
          A message from Ritan Foods
        </p>
        <SplitReveal as="blockquote" fill className="mx-auto mt-10 max-w-5xl text-center font-display text-[clamp(1.9rem,4vw,3.9rem)] leading-[1.15]">
          “Every product has a story, every ingredient carries goodness, and every meal brings families together. Our happiness is to be a part of your family’s journey towards taste,
          tradition and healthier food choices.”
        </SplitReveal>
        <p className="mt-12 text-center font-display text-2xl italic text-sprout-300 lg:text-3xl">— A Mother’s Love in Every Bite.</p>
      </div>
    </section>
  );
}
