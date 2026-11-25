import { Suspense, type ReactNode } from "react";
import { Hero, type HeroPack } from "@/components/home/Hero";
import { MarqueeBand } from "@/components/home/MarqueeBand";
import { Message } from "@/components/home/Message";
import { PantryGrid } from "@/components/home/PantryGrid";
import { Process } from "@/components/home/Process";
import { ReviewsCarousel } from "@/components/home/ReviewsCarousel";
import { StoryTeaser } from "@/components/home/StoryTeaser";
import { TrustStats } from "@/components/home/TrustStats";
import { ValuesBowl } from "@/components/home/ValuesBowl";
import { PageTransition } from "@/components/motion/PageTransition";
import { getCatalog, getCategories, getHighlightReviews } from "@/lib/data/queries";

/** Hero drum order: Idli Podi faces front, ABC Malt to its right, Sprouted Millet to its left, the rest round the back. */
const HERO_FRONT = ["idli-podi", "abc-malt"];
const HERO_LEFT = "sprouted-millet-health-mix";

export default async function HomePage() {
  const [products, categories, reviews] = await Promise.all([getCatalog(), getCategories(), getHighlightReviews(10)]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const ring = [
    ...HERO_FRONT.flatMap((s) => (bySlug.has(s) ? [bySlug.get(s)!] : [])),
    ...products.filter((p) => !HERO_FRONT.includes(p.slug) && p.slug !== HERO_LEFT),
    ...(bySlug.has(HERO_LEFT) ? [bySlug.get(HERO_LEFT)!] : []),
  ];
  const packs: HeroPack[] = ring.map((p) => ({ slug: p.slug, name: p.name, image: p.image, width: p.imageWidth, height: p.imageHeight }));
  const productNames = Object.fromEntries(products.map((p) => [p.slug, p.name]));

  return (
    <PageTransition>
      {/* The hero stays in the shell (not an island) so it paints with the very first frame. */}
      <Hero packs={packs} />
      <Island>
        <MarqueeBand />
      </Island>
      <Island deferRender>
        <StoryTeaser />
      </Island>
      <Island deferRender>
        <PantryGrid products={products} categories={categories} />
      </Island>
      <Island deferRender>
        <Process />
      </Island>
      <Island deferRender>
        <ValuesBowl />
      </Island>
      <Island deferRender>
        <TrustStats />
      </Island>
      <Island deferRender>
        <ReviewsCarousel reviews={reviews} productNames={productNames} />
      </Island>
      <Island deferRender>
        <Message />
      </Island>
    </PageTransition>
  );
}

/**
 * Each section is its own Suspense boundary. The HTML is still fully
 * prerendered, but React hydrates every boundary separately at idle priority
 * (time-sliced), so start-up never becomes one long main-thread task and the
 * first paint isn't held back by hydration. `deferRender` adds
 * content-visibility on small screens (see `.cv-auto`).
 */
function Island({ children, deferRender = false }: { children: ReactNode; deferRender?: boolean }) {
  const content = <Suspense fallback={null}>{children}</Suspense>;
  // Below-the-fold islands also skip rendering on small screens until they near the viewport.
  return deferRender ? <div className="cv-auto">{content}</div> : content;
}
