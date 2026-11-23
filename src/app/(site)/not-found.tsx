import { ArrowRight } from "lucide-react";
import { LeafGlyph } from "@/components/home/MarqueeBand";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="relative grid min-h-[90svh] place-items-center overflow-hidden bg-cream-50 px-6 pt-[var(--header-h)] text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="font-display text-[42vw] italic leading-none text-forest-900/[0.05]">404</span>
      </div>
      <div className="relative">
        <LeafGlyph className="mx-auto h-16 w-auto rotate-12 text-leaf-500" />
        <h1 className="mt-6 font-display text-display-lg text-forest-900">
          This page went to <em className="display-italic text-leaf-500">the market.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-body-lg text-ink-700">We couldn&apos;t find what you were looking for — but the pantry is fully stocked.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop" size="lg">
            Shop the pantry <ArrowRight className="size-4" />
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="lg">
            Back home
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
