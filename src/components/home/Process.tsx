"use client";

import { CookingPot, Flame, Package, Truck, Wheat } from "lucide-react";
import { useRef } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { useMediaQuery } from "@/components/motion/SmoothScroll";
import { spriteSize, spriteSrc } from "@/components/physics/sprites";
import type { SpriteId } from "@/lib/data/types";
import { useGsap } from "@/lib/motion/useGsap";

const STEPS: { title: string; body: string; icon: typeof Wheat; sprites: SpriteId[] }[] = [
  { title: "Select", body: "We begin with carefully selected grains, lentils, greens and spices.", icon: Wheat, sprites: ["millet", "uradDal", "curryLeaf"] },
  { title: "Prepare", body: "Roasted, sprouted or dried the traditional way — following recipes passed down through generations.", icon: Flame, sprites: ["chilli", "chanaDal", "peanut"] },
  { title: "Blend", body: "Ground and blended to the familiar taste and texture of a home kitchen.", icon: CookingPot, sprites: ["cardamom", "garlic", "sesame"] },
  { title: "Pack", body: "Packed with care for freshness and food safety, in sizes from 100 g to 1 kg.", icon: Package, sprites: ["almond", "cashew", "date"] },
  { title: "Deliver", body: "Dispatched across India with DTDC and India Post — at your door in 3–5 days.", icon: Truck, sprites: ["bananaSlice", "carrotSlice", "moringa"] },
];

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const Icon = step.icon;
  return (
    <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-cream-50/10 bg-forest-800/60 p-8 lg:p-10">
      <div className="flex items-start justify-between">
        {/* Decorative numeral drawn via CSS content, so it isn't read out or audited as text */}
        <span aria-hidden data-num={`0${index + 1}`} className="font-display text-[5.5rem] leading-none text-sprout-300/25 before:content-[attr(data-num)] lg:text-[7rem]" />
        <span className="grid size-14 place-items-center rounded-full bg-cream-50/10 text-sprout-300">
          <Icon className="size-6" />
        </span>
      </div>
      <div aria-hidden className="relative my-6 h-24">
        {step.sprites.map((id, k) => {
          // balanced but still true to size: area grows gently with the real size, so a
          // grain stays a small grain beside a chilli (~38px dal, ~170px chilli)
          const { w, h } = spriteSize(id);
          const fit = Math.sqrt((3136 * ((w * h) / 1000) ** 0.4) / (w * h));
          return (
            // eslint-disable-next-line @next/next/no-img-element -- static SVG sprite
            <img key={id} src={spriteSrc(id)} alt="" width={Math.round(w * fit)} height={Math.round(h * fit)} loading="lazy" decoding="async" className="absolute drop-shadow-lg" style={{ left: `${12 + k * 26}%`, top: `${(k % 2) * 34}%`, transform: `rotate(${k * 38 - 30}deg)` }} />
          );
        })}
      </div>
      <div>
        <h3 className="font-display text-4xl text-cream-50">{step.title}</h3>
        <p className="mt-3 text-body-lg text-cream-50/75">{step.body}</p>
      </div>
    </article>
  );
}

/** "From our kitchen to yours": horizontal pinned scroll on desktop, stacked cards on mobile. */
export function Process() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  // The horizontal track only exists on large screens (built on the client;
  // the h-screen frame is in the server HTML so nothing shifts).
  const desktop = useMediaQuery("(min-width: 1024px)");

  useGsap(
    ({ gsap }) => {
      if (!desktop) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(bar.current, { scaleX: self.progress }),
          },
        });
        // cards lean into the motion, then straighten (velocity-aware tilt)
        const cards = el.querySelectorAll<HTMLElement>("[data-step]");
        cards.forEach((card) => {
          gsap.fromTo(
            card,
            { rotate: 4, y: 40 },
            { rotate: 0, y: 0, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "center center", scrub: true } },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [desktop] },
  );

  return (
    <section ref={root} aria-labelledby="process-title" className="relative overflow-hidden bg-forest-900 text-cream-50">
      {/* Desktop horizontal track */}
      <div className="hidden h-screen items-center lg:flex">
        {desktop && (
          <>
            <div ref={track} className="flex h-[72vh] items-stretch gap-8 pl-[var(--gutter)] pr-[12vw] will-change-transform">
              <div className="flex w-[34vw] shrink-0 flex-col justify-center pr-10">
                <p className="eyebrow text-sprout-300">How it&apos;s made</p>
                <h2 id="process-title" className="mt-5 font-display text-display-lg">
                  From our kitchen <em className="display-italic text-sprout-300">to yours.</em>
                </h2>
                <p className="mt-6 max-w-md text-body-lg text-cream-50/75">
                  Simple ingredients, traditional methods and a lot of care — this is how every pack of Ritan comes to your table.
                </p>
              </div>
              {STEPS.map((s, i) => (
                <div key={s.title} data-step className="w-[30vw] min-w-[380px] shrink-0">
                  <StepCard step={s} index={i} />
                </div>
              ))}
            </div>
            <div className="absolute inset-x-[var(--gutter)] bottom-10 h-[2px] overflow-hidden rounded-full bg-cream-50/10">
              <div ref={bar} className="h-full origin-left scale-x-0 bg-sprout-300" />
            </div>
          </>
        )}
      </div>

      {/* Mobile stack */}
      <div className="container-x py-24 lg:hidden">
        <p className="eyebrow text-sprout-300">How it&apos;s made</p>
        <h2 id={desktop ? undefined : "process-title"} className="mt-4 font-display text-display-md">
          From our kitchen <em className="display-italic text-sprout-300">to yours.</em>
        </h2>
        <Reveal className="mt-10 grid gap-5 sm:grid-cols-2" stagger={0.1}>
          {STEPS.map((s, i) => (
            <div key={s.title} data-reveal-item>
              <StepCard step={s} index={i} />
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
