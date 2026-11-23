"use client";

import type MatterNS from "matter-js";
import { AnimatePresence, m } from "motion/react";
import { MousePointer2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion/env";
import { physics } from "@/lib/motion/tokens";

const VALUES = [
  { key: "tradition", label: "Tradition", line: "Preserving our rich food heritage.", bg: "#1E4D2B", fg: "#FBF7EE" },
  { key: "health", label: "Health", line: "Encouraging balanced, nutritious food choices.", bg: "#3F7526", fg: "#FBF7EE" },
  { key: "quality", label: "Quality", line: "Giving importance to carefully selected ingredients and quality.", bg: "#C9A54C", fg: "#0F2A17" },
  { key: "trust", label: "Trust", line: "Building lasting relationships with our customers.", bg: "#A8322A", fg: "#FBF7EE" },
  { key: "care", label: "Care", line: "Approaching every product with dedication.", bg: "#D8962B", fg: "#0F2A17" },
] as const;

type ValueKey = (typeof VALUES)[number]["key"];

/** Bowl geometry in stage fractions (matches the SVG drawn below). */
const RIM_Y = 0.5;
const FLOOR_Y = 0.88;
const RIM_L = 0.1;
const RIM_R = 0.9;
const BASE_L = 0.3;
const BASE_R = 0.7;

export function ValuesBowl() {
  const stageRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selected, setSelected] = useState<ValueKey>("tradition");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let destroyed = false;
    let cleanup = () => {};

    const boot = async () => {
      const { default: M } = await import("matter-js");
      if (destroyed) return;
      cleanup = simulate(M, stage, pillRefs.current.filter(Boolean) as HTMLButtonElement[], (k) => setSelected(k as ValueKey));
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          void boot();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(stage);
    return () => {
      destroyed = true;
      io.disconnect();
      cleanup();
    };
  }, []);

  const current = VALUES.find((v) => v.key === selected)!;

  return (
    <section aria-labelledby="values-title" className="relative overflow-hidden bg-parchment-100 py-28 lg:py-40">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="eyebrow text-leaf-600">What we stand for</p>
          <SplitReveal as="h2" className="mt-4 font-display text-display-lg text-forest-900">
            Five values, <em className="display-italic text-leaf-500">one bowl.</em>
          </SplitReveal>
          <dl className="mt-8 space-y-6 text-body-lg text-ink-700">
            <div>
              <dt className="eyebrow text-forest-700">Our vision</dt>
              <dd className="mt-2">To make traditional, nutritious and quality food products accessible to families across the world.</dd>
            </div>
            <div>
              <dt className="eyebrow text-forest-700">Our mission</dt>
              <dd className="mt-2">To celebrate traditional food culture and encourage thoughtful food choices through quality products made with care and dedication.</dd>
            </div>
          </dl>
          <div className="mt-10 min-h-[7.5rem] rounded-3xl border border-forest-900/10 bg-cream-50 p-6" aria-live="polite">
            <AnimatePresence mode="wait">
              <m.div key={current.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <p className="font-display text-3xl" style={{ color: current.bg === "#C9A54C" || current.bg === "#D8962B" ? "#8a5a1a" : current.bg }}>
                  {current.label}
                </p>
                <p className="mt-1 text-ink-700">{current.line}</p>
              </m.div>
            </AnimatePresence>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
            <MousePointer2 className="size-3.5" /> Tap a value to read it · drag it around
          </p>
        </div>

        <div ref={stageRef} className="relative mx-auto aspect-square w-full max-w-[560px] touch-pan-y select-none [container-type:size]">
          {/* bowl shadow + body (U-section, pills sit inside) */}
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
            <defs>
              <linearGradient id="clay" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#C0784A" />
                <stop offset="0.55" stopColor="#8A5A3B" />
                <stop offset="1" stopColor="#5E3620" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="94" rx="36" ry="3.2" fill="#0f2a17" opacity="0.12" />
            <path d="M8 49 Q 14 84 30 90 L 70 90 Q 86 84 92 49" fill="none" stroke="url(#clay)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 58 Q 19 80 31 85 L 69 85 Q 81 80 86 58" fill="none" stroke="#E2C77F" strokeOpacity="0.55" strokeWidth="0.6" strokeDasharray="0.1 2.2" strokeLinecap="round" />
            <circle cx="8" cy="49" r="2.4" fill="#8A5A3B" />
            <circle cx="92" cy="49" r="2.4" fill="#8A5A3B" />
          </svg>
          {VALUES.map((v, i) => (
            <button
              key={v.key}
              ref={(el) => {
                pillRefs.current[i] = el;
              }}
              type="button"
              data-key={v.key}
              onClick={() => setSelected(v.key)}
              aria-pressed={selected === v.key}
              className="absolute left-0 top-0 rounded-full px-6 py-3 font-display text-xl shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)] will-change-transform focus-visible:outline-offset-4 sm:px-8 sm:py-4 sm:text-2xl"
              style={{
                background: v.bg,
                color: v.fg,
                // pre-physics resting layout in container units (also the no-JS fallback)
                transform: `translate(${[24, 50, 30, 52, 38][i]}cqw, ${[76, 75, 65, 64, 54][i]}cqh) rotate(${[-6, 5, 3, -4, 2][i]}deg)`,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function simulate(M: typeof MatterNS, stage: HTMLDivElement, pills: HTMLButtonElement[], onTap: (key: string) => void) {
  const { Engine, Bodies, Body, Composite, Constraint, Sleeping } = M;
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const reduced = prefersReducedMotion();
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.scale = physics.gravityScale * 1.1;

  const T = 24;
  const wall = (x1: number, y1: number, x2: number, y2: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    return Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, len + T, T, { isStatic: true, angle: Math.atan2(y2 - y1, x2 - x1), friction: 0.5 });
  };
  const statics = [
    wall(RIM_L * W, RIM_Y * H, BASE_L * W, FLOOR_Y * H),
    wall(BASE_L * W, FLOOR_Y * H + T / 4, BASE_R * W, FLOOR_Y * H + T / 4),
    wall(BASE_R * W, FLOOR_Y * H, RIM_R * W, RIM_Y * H),
    Bodies.rectangle(-T / 2, H / 2 - H, T, H * 4, { isStatic: true }),
    Bodies.rectangle(W + T / 2, H / 2 - H, T, H * 4, { isStatic: true }),
    Bodies.rectangle(W / 2, H + T / 2, W * 2, T, { isStatic: true }),
  ];
  Composite.add(engine.world, statics);

  const bodies = pills.map((el, i) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const b = Bodies.rectangle(W * (0.35 + 0.3 * ((i * 0.37) % 1)), -h - i * 90, w, h, {
      chamfer: { radius: h / 2 - 0.5 },
      restitution: 0.4,
      friction: 0.12,
      frictionAir: 0.012,
      density: 0.002,
      sleepThreshold: 60,
    });
    Body.setAngle(b, (i % 2 ? 1 : -1) * 0.25);
    return { el, b, w, h, added: false, at: i * 260 };
  });

  const paint = () => {
    for (const { el, b, w, h } of bodies) el.style.transform = `translate(${b.position.x - w / 2}px, ${b.position.y - h / 2}px) rotate(${b.angle}rad)`;
  };

  if (reduced) {
    bodies.forEach((x) => Composite.add(engine.world, x.b));
    for (let i = 0; i < 600; i++) Engine.update(engine, physics.step);
    paint();
    return () => Engine.clear(engine);
  }

  // Drag + tap
  let grab: MatterNS.Constraint | null = null;
  let down: { x: number; y: number; key: string } | null = null;
  const local = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: PointerEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-key]");
    if (!target) return;
    const hit = bodies.find((x) => x.el === target);
    if (!hit) return;
    const p = local(e);
    down = { ...p, key: target.dataset.key! };
    if (!isFinePointer() && e.pointerType !== "mouse") return; // touch: tap only, keep page scroll
    e.preventDefault();
    target.setPointerCapture(e.pointerId);
    grab = Constraint.create({ pointA: p, bodyB: hit.b, pointB: { x: p.x - hit.b.position.x, y: p.y - hit.b.position.y }, stiffness: 0.16, damping: 0.08, length: 0 });
    Composite.add(engine.world, grab);
    Sleeping.set(hit.b, false);
    start();
  };
  const onMove = (e: PointerEvent) => {
    if (grab) grab.pointA = local(e);
  };
  const onUp = (e: PointerEvent) => {
    if (grab) {
      Composite.remove(engine.world, grab);
      grab = null;
    }
    if (down) {
      const p = local(e);
      if (Math.hypot(p.x - down.x, p.y - down.y) < 8) {
        onTap(down.key);
        const hit = bodies.find((x) => x.el.dataset.key === down!.key);
        if (hit) {
          Sleeping.set(hit.b, false);
          Body.setVelocity(hit.b, { x: (Math.random() - 0.5) * 4, y: -9 });
          Body.setAngularVelocity(hit.b, (Math.random() - 0.5) * 0.2);
          start();
        }
      }
      down = null;
    }
  };
  stage.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);

  let raf = 0;
  let running = false;
  let last = 0;
  let acc = 0;
  let quiet = 0;
  const t0 = performance.now();
  const frame = (t: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    for (const x of bodies) {
      if (!x.added && t - t0 >= x.at) {
        Composite.add(engine.world, x.b);
        x.added = true;
      }
    }
    acc += Math.min(t - last, 64);
    last = t;
    let steps = 0;
    while (acc >= physics.step && steps < 4) {
      Engine.update(engine, physics.step);
      acc -= physics.step;
      steps++;
    }
    paint();
    const awake = grab !== null || bodies.some((x) => !x.added || !x.b.isSleeping);
    quiet = awake ? 0 : quiet + 1;
    if (quiet > 30) stop();
  };
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }
  start();

  return () => {
    stop();
    stage.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    Composite.clear(engine.world, false);
    Engine.clear(engine);
  };
}
