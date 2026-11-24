"use client";

import { ArrowDown, ArrowRight, MousePointer2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Magnetic } from "@/components/motion/Magnetic";
import { PhysicsField } from "@/components/physics/PhysicsField";
import { heroPreset } from "@/components/physics/presets";
import { ButtonLink } from "@/components/ui/Button";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion/env";
import { useGsap } from "@/lib/motion/useGsap";
import { depth } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export interface HeroPack {
  slug: string;
  name: string;
  image: string;
  width: number;
  height: number;
}

/**
 * Pack drum: every pack stands on a slowly rolling cylinder (see .hero-drum in
 * globals.css). Phones see one pack face on, fitted between the caption and the
 * "Shop the pantry" row; tablet/desktop three. On desktop the trio sits right of
 * centre, sized so its tops stay just clear of the giant word "Tradition,".
 * The section height and pack sizes in globals.css (.hero-stage) mirror the copy's
 * classes below: change a headline size or spacing here, update them there too.
 */
const ROLL_MS = 1200; // matches --roll in globals.css
const HOLD_MS = 2200;
const FLOATS = [
  { y: 16, r: 1.8, d: 5.2 },
  { y: 11, r: 3, d: 4.8 },
  { y: 12, r: -2.5, d: 4.4 },
];
/** The front pouch keeps its exact sizes so the LCP image request is unchanged. */
const FRONT_SIZES = "(min-width: 1024px) 22vw, (min-width: 640px) 28vw, 52vw";
const packSizes = (aspect: number) => `(min-width: 1024px) ${Math.ceil(30.9 / aspect)}vw, (min-width: 640px) ${Math.ceil(41.3 / aspect)}vw, ${Math.ceil(82.5 / aspect)}vw`;

export function Hero({ packs }: { packs: HeroPack[] }) {
  const section = useRef<HTMLElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [wide, setWide] = useState(true);
  const n = packs.length;

  // Packs round the back of the drum mount once the page has loaded and gone idle, never competing with LCP.
  useEffect(() => {
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mount = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      else timer = setTimeout(() => setReady(true), 250);
    };
    if (document.readyState === "complete") mount();
    else window.addEventListener("load", mount, { once: true });
    return () => {
      window.removeEventListener("load", mount);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);

  // Phones show one pack face on; wider screens three.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Roll on one pack at a time, endlessly; hold while hovered or focused, off-screen or in a background tab.
  useEffect(() => {
    const root = section.current;
    const drum = ring.current;
    if (!ready || n < 2 || !root || !drum || prefersReducedMotion()) return;
    let visible = true;
    let held = false;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(root);
    const hold = () => {
      held = true;
    };
    const release = () => {
      held = false;
    };
    // The copy row lies over the packs' lower half, so test the pointer against the facing packs' boxes.
    const onMove = (e: PointerEvent) => {
      held = [...drum.querySelectorAll(".hero-drum__item:not([inert]) a")].some((a) => {
        const r = a.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
    };
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", release);
    drum.addEventListener("focusin", hold);
    drum.addEventListener("focusout", release);
    let timer = setTimeout(function roll() {
      if (visible && !held && document.visibilityState === "visible") setStep((s) => s + 1);
      timer = setTimeout(roll, ROLL_MS + HOLD_MS);
    }, HOLD_MS);
    return () => {
      clearTimeout(timer);
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", release);
      drum.removeEventListener("focusin", hold);
      drum.removeEventListener("focusout", release);
    };
  }, [ready, n]);

  useGsap(
    ({ gsap }) => {
      const root = section.current;
      if (!root || prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);

      // Idle float - each pack breathes on its own rhythm; its shadow follows.
      q<HTMLElement>("[data-float]").forEach((el, i) => {
        const f = FLOATS[i % FLOATS.length];
        gsap.to(el, { y: -f.y, rotation: f.r, duration: f.d, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.6 + (i % 3) * 0.35 });
      });
      q<HTMLElement>("[data-shadow]").forEach((el, i) => {
        const f = FLOATS[i % FLOATS.length];
        gsap.to(el, { scaleX: 0.8, opacity: 0.55, duration: f.d, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.6 + (i % 3) * 0.35 });
      });

      // Scroll-out: the pack drum lifts and recedes, type drifts, copy fades.
      const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 } });
      tl.to(q("[data-scroll-pack]"), { yPercent: -26, scale: 0.9, ease: "none" }, 0);
      tl.to(q("[data-scroll-word]"), { yPercent: (i: number) => -24 - i * 16, ease: "none" }, 0).to(
        q("[data-scroll-copy]"),
        { yPercent: -50, opacity: 0, ease: "none" },
        0,
      );

      // Pointer parallax by depth (fine pointers only).
      if (!isFinePointer()) return;
      const layers = q<HTMLElement>("[data-depth]").map((el) => ({
        d: Number(el.dataset.depth),
        x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
      }));
      const onMove = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        for (const l of layers) {
          l.x(-nx * depth.pointerRange * l.d * 2);
          l.y(-ny * depth.pointerRange * l.d * 1.4);
        }
      };
      root.addEventListener("pointermove", onMove);
      return () => root.removeEventListener("pointermove", onMove);
    },
    { scope: section },
  );

  return (
    <section ref={section} aria-labelledby="hero-title" className="hero-stage relative isolate overflow-hidden bg-cream-50">
      {/* Back layer: soft light, warmth and a table-top arc */}
      <div aria-hidden data-depth={depth.back} className="absolute inset-[-4%] -z-10">
        <div className="absolute -right-[10%] -top-[25%] size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(198,217,163,0.55),transparent)]" />
        <div className="absolute -left-[15%] top-[30%] size-[55vw] rounded-full bg-[radial-gradient(closest-side,rgba(236,194,122,0.26),transparent)]" />
        <div className="absolute bottom-[-64vw] left-1/2 h-[100vw] w-[130vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,#efe5cf_72%,rgba(239,229,207,0))] lg:bottom-[-74vw]" />
        <KolamDots className="absolute right-[6%] top-[19%] w-32 text-gold-500/40 lg:right-[4%] lg:w-44" />
      </div>

      <div className="container-x relative flex h-full flex-col pt-[calc(var(--header-h)+2.5rem)] lg:pt-[calc(var(--header-h)+3rem)]">
        <p className="eyebrow fade-up relative z-40 text-leaf-600" style={{ ["--d" as string]: "0ms" }}>
          From our family kitchen in Chennai
        </p>

        {/* Line 2 sits behind the packs (z-5); lines 1 & 3 ride above everything. */}
        <h1 id="hero-title" className="mt-3 font-display text-forest-900 lg:mt-5">
          <span data-depth="0.18" data-scroll-word className="relative z-40 block">
            <span className="hero-line line-mask block text-[clamp(2.3rem,6vw,6.5rem)] leading-[0.95]" style={{ ["--i" as string]: 0 }}>
              <span>A Taste of</span>
            </span>
          </span>
          <span data-depth="0.3" data-scroll-word className="relative z-[5] block">
            <span
              className="hero-line line-mask block pl-[5vw] text-[min(19vw,15vh)] leading-[0.9] text-forest-700 lg:pl-[7vw] lg:text-[min(15vw,24vh)]"
              style={{ ["--i" as string]: 1 }}
            >
              <em className="display-italic">Tradition,</em>
            </span>
          </span>
          <span data-depth="0.22" data-scroll-word className="relative z-40 block">
            <span className="hero-line line-mask block text-[clamp(2.1rem,5.2vw,5.6rem)] leading-[1.02]" style={{ ["--i" as string]: 2 }}>
              <span>
                a Touch of <em className="display-italic text-leaf-500">Love.</em>
              </span>
            </span>
          </span>
        </h1>
        <p data-scroll-copy className="fade-up relative z-40 mt-5 max-w-[20rem] text-[0.98rem] leading-relaxed text-ink-700 lg:hidden" style={{ ["--d" as string]: "500ms" }}>
          Traditional podis, rice mixes and health mixes - from our family kitchen to yours.
        </p>

        <div data-scroll-copy className="relative z-40 mt-auto flex items-end justify-between gap-6 pb-[max(4rem,9vh)] lg:pb-[max(5.5rem,11vh)]">
          <div className="fade-up max-w-[26rem]" style={{ ["--d" as string]: "600ms" }}>
            <p className="hidden text-body-lg text-ink-700 lg:block">
              Podis, rice mixes, health mixes and malts made with traditional recipes and carefully selected ingredients - from our kitchen to yours.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:mt-6">
              <Magnetic>
                <ButtonLink href="/shop" size="lg" data-cursor="Shop">
                  Shop the pantry <ArrowRight className="size-4" />
                </ButtonLink>
              </Magnetic>
              <Link href="/our-story" className="group hidden items-center gap-2 text-sm font-semibold text-forest-800 sm:inline-flex">
                <span className="relative">
                  Our story
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-forest-800 transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
                </span>
                <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>
            <p className="mt-5 hidden items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-500 lg:flex">
              <MousePointer2 className="size-3.5" /> Psst - drag the curry leaves
            </p>
          </div>
          <a href="#story" className="fade-up relative grid size-16 shrink-0 place-items-center rounded-full text-forest-800" style={{ ["--d" as string]: "800ms" }}>
            <span className="sr-only">Scroll to our story</span>
            <ArrowDown className="size-4" aria-hidden />
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-[spin_16s_linear_infinite] motion-reduce:animate-none" aria-hidden>
              <defs>
                <path id="scroll-ring" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <text className="fill-forest-800 text-[10.5px] font-bold uppercase tracking-[0.32em]">
                <textPath href="#scroll-ring">scroll · scroll · scroll ·</textPath>
              </text>
            </svg>
          </a>
        </div>
      </div>

      {/* Packs: all of them on a rolling drum - Idli Podi faces front, ABC Malt and Sprouted Millet beside it */}
      <div className="hero-drum pointer-events-none absolute z-20">
        <div data-depth={0.66} className="absolute inset-0">
          <div data-scroll-pack className="absolute inset-0">
            <div className="hero-drum__scene">
              <div ref={ring} className="hero-drum__ring" style={{ ["--angle" as string]: `${(-step * 360) / n}deg`, ["--slot" as string]: `${360 / n}deg` }}>
                {packs.map((p, k) => {
                  const rel = (((k - step) % n) + n) % n;
                  const pos = rel > n / 2 ? rel - n : rel; // slots from the front: 0, ±1, ±2…
                  const front = k === 0;
                  const side = k === 1 || k === n - 1; // flank the front pack before the first roll
                  const live = pos === 0 || (wide && Math.abs(pos) === 1);
                  return (
                    <div
                      key={p.slug}
                      className="hero-drum__item"
                      data-pos={pos}
                      data-far={Math.abs(pos) > 2 || undefined}
                      inert={!live}
                      style={{ ["--k" as string]: k, ["--ar" as string]: p.height / p.width }}
                    >
                      <div className="hero-pack" style={{ ["--i" as string]: k === n - 1 ? 0 : k === 0 ? 1 : 2 }}>
                        <div data-float className="relative">
                          {(front || side || ready) && (
                            // flank packs stay unloaded on phones (one pack shows) until the page is idle
                            <Link href={`/products/${p.slug}`} className={cn("pointer-events-auto block", side && !ready && "max-sm:hidden")} data-cursor="View" aria-label={`View ${p.name}`}>
                              <Image
                                src={p.image}
                                alt={`${p.name} pack`}
                                width={p.width}
                                height={p.height}
                                preload={front}
                                fetchPriority={front ? "high" : side ? "auto" : "low"}
                                sizes={front ? FRONT_SIZES : packSizes(p.height / p.width)}
                                quality={90}
                                className="h-auto w-full drop-shadow-[0_28px_36px_rgba(15,42,23,0.28)]"
                              />
                            </Link>
                          )}
                        </div>
                        <div data-shadow aria-hidden className="mx-auto -mt-4 h-6 w-[72%] rounded-[50%] bg-forest-950/25 blur-md" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients: sharp layer behind the packs (z-10), blurred foreground (z-30) */}
      <PhysicsField preset={heroPreset} interactionRef={section} withFront backClassName="z-10" frontClassName="z-30" />

      {/* table-top shade where the ingredients settle */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[9] h-28 bg-gradient-to-t from-parchment-200/80 to-transparent" />
    </section>
  );
}

/** Kolam-inspired dot-and-loop ornament (South Indian threshold art). */
function KolamDots({ className }: { className?: string }) {
  const dots = [];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) dots.push(<circle key={`${x}-${y}`} cx={10 + x * 20} cy={10 + y * 20} r="1.6" fill="currentColor" />);
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="none">
      {dots}
      <path
        d="M10 30 Q20 20 30 30 T50 30 T70 30 T90 30 M10 70 Q20 80 30 70 T50 70 T70 70 T90 70 M30 10 Q20 20 30 30 T30 50 T30 70 T30 90 M70 10 Q80 20 70 30 T70 50 T70 70 T70 90"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
