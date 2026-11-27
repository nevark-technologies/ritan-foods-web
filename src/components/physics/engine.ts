import type MatterNS from "matter-js";
import type { SpriteId } from "@/lib/data/types";
import { physics } from "@/lib/motion/tokens";
import { PHOTO_SPRITES, type PhotoVariant } from "./photo-sprites";
import type { PhysicsPreset } from "./presets";
import { SPRITES } from "./sprites";

type Matter = typeof MatterNS;

export interface SimOptions {
  /** Element whose box defines the world (usually the section). */
  host: HTMLElement;
  /** Sharp layer (behind the main subject). */
  back: HTMLCanvasElement;
  /** Optional blurred foreground layer (in front of the subject). */
  front: HTMLCanvasElement | null;
  /** Where pointer events are read from. */
  interaction: HTMLElement;
  reduced: boolean;
  fine: boolean;
  /** Delay before the first body spawns (ms). */
  delay?: number;
  onEmpty?: () => void;
}

export interface Simulation {
  destroy(): void;
  burst(x: number, y: number, strength?: number): void;
}

interface Sprite {
  img: HTMLCanvasElement;
  w: number;
  h: number;
  /** where the body's centre of mass sits relative to the image centre (photo hulls) */
  ox: number;
  oy: number;
}

/** What one body looks like: a real-photo variant, or the vector sprite (tiny grains, seeds, dal). */
interface Look {
  id: SpriteId;
  photo: PhotoVariant | null;
  w: number;
  h: number;
}

const vectorLook = (id: SpriteId): Look => ({ id, photo: null, w: SPRITES[id].w, h: SPRITES[id].h });
const lookFor = (id: SpriteId, n: number): Look => {
  const variants = PHOTO_SPRITES[id];
  if (!variants?.length) return vectorLook(id);
  const photo = variants[n % variants.length];
  return { id, photo, w: photo.w, h: photo.h };
};

interface PhotoArt {
  img: HTMLImageElement;
  clip: Path2D;
  vw: number;
  vh: number;
}

const photoCache = new Map<string, Promise<PhotoArt>>();

/** A photo sprite SVG holds a WebP cut-out and its traced outline; draw both directly so the clip is exact at any DPR. */
function loadPhoto(src: string): Promise<PhotoArt> {
  let job = photoCache.get(src);
  if (!job) {
    job = (async () => {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`${src}: ${res.status}`);
      const svg = await res.text();
      const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
      const d = /<path d="([^"]+)"/.exec(svg)?.[1];
      const href = /href="(data:image\/[^"]+)"/.exec(svg)?.[1];
      if (!box || !d || !href) throw new Error(`${src}: not a photo sprite`);
      const img = new Image();
      img.decoding = "async";
      img.src = href;
      await img.decode();
      return { img, clip: new Path2D(d), vw: Number(box[1]), vh: Number(box[2]) };
    })();
    job.catch(() => photoCache.delete(src));
    photoCache.set(src, job);
  }
  return job;
}

interface Item {
  body: MatterNS.Body;
  sprite: Sprite;
  fg: boolean;
}

const CAT_STATIC = 0x0001;
const CAT_BACK = 0x0002;
const CAT_FRONT = 0x0004;
const INTERACTIVE = "a, button, input, textarea, select, label, summary, [role='button'], [data-no-physics]";

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function svgAtSize(id: SpriteId, w: number, h: number) {
  const raw = SPRITES[id].svg.replace(/\s{2,}/g, " ").replace(/width="[\d.]+" height="[\d.]+"/, `width="${w}" height="${h}"`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw)}`;
}

const spriteCache = new Map<string, Promise<Sprite>>();
const spriteKey = (look: Look, scale: number, dpr: number, blur: number) => `${look.photo?.src ?? look.id}|${scale.toFixed(2)}|${dpr}|${blur}`;

/** Gives the browser a chance to paint / handle input between chunks of work. */
function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Rasterise a sprite once per (look, scale bucket, blur) at device resolution. */
function rasterize(look: Look, scale: number, dpr: number, blur: number): Promise<Sprite> {
  const key = spriteKey(look, scale, dpr, blur);
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const job = (async () => {
    const w = look.w * scale;
    const h = look.h * scale;
    const pad = Math.ceil(blur * 2.5);
    const c = document.createElement("canvas");
    c.width = Math.ceil((w + pad * 2) * dpr);
    c.height = Math.ceil((h + pad * 2) * dpr);
    const cx = c.getContext("2d")!;
    if (look.photo) {
      const art = await loadPhoto(look.photo.src);
      // clip and draw sharp first, then blur, so depth of field softens the edge too
      const sharp = blur ? document.createElement("canvas") : c;
      sharp.width = c.width;
      sharp.height = c.height;
      const sx = sharp.getContext("2d")!;
      sx.imageSmoothingQuality = "high";
      sx.setTransform((w * dpr) / art.vw, 0, 0, (h * dpr) / art.vh, pad * dpr, pad * dpr);
      sx.clip(art.clip);
      sx.drawImage(art.img, 0, 0, art.vw, art.vh);
      if (blur) {
        cx.filter = `blur(${blur * dpr}px)`;
        cx.drawImage(sharp, 0, 0);
      }
    } else {
      const img = new Image();
      img.decoding = "async";
      img.src = svgAtSize(look.id, Math.ceil(w * dpr), Math.ceil(h * dpr));
      await img.decode();
      if (blur) cx.filter = `blur(${blur * dpr}px)`;
      cx.drawImage(img, pad * dpr, pad * dpr, w * dpr, h * dpr);
    }
    return { img: c, w: w + pad * 2, h: h + pad * 2, ox: (look.photo?.ox ?? 0) * scale, oy: (look.photo?.oy ?? 0) * scale };
  })();
  spriteCache.set(key, job);
  return job;
}

/**
 * Horizontal rain band (fractions of the width). On wide screens the preset's
 * `keepClear` elements (small copy) are cut out, so ingredients never fall across
 * or settle on them: the widest gap left is used if it spans at least 30% of the
 * width, otherwise the preset band. Phones keep the full band (their copy spans it).
 */
function spawnBand(preset: PhysicsPreset, host: HTMLElement, root: HTMLElement, small: boolean): [number, number] {
  const [a, b] = preset.spawnX;
  const box = host.getBoundingClientRect();
  if (!preset.keepClear || small || !box.width) return [a, b];
  const pad = 0.02;
  // Measure the content (text ink), not the element box: a block-level line spans the full width.
  const contentBox = (el: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect();
  };
  const blocked = [...root.querySelectorAll<HTMLElement>(preset.keepClear)]
    .map(contentBox)
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r): [number, number] => [(r.left - box.left) / box.width - pad, (r.right - box.left) / box.width + pad])
    .sort((x, y) => x[0] - y[0]);
  let best: [number, number] = [a, a];
  let cursor = a;
  for (const [l, r] of blocked) {
    const end = Math.min(l, b);
    if (end - cursor > best[1] - best[0]) best = [cursor, end];
    cursor = Math.max(cursor, r);
  }
  if (b - cursor > best[1] - best[0]) best = [cursor, b];
  return best[1] - best[0] >= 0.3 ? best : [a, b];
}

export async function createSimulation(M: Matter, preset: PhysicsPreset, opts: SimOptions): Promise<Simulation> {
  const { Engine, Bodies, Body, Composite, Query, Constraint, Sleeping } = M;
  const { host, back, front, interaction } = opts;
  const dpr = Math.min(window.devicePixelRatio || 1, physics.maxDpr);
  const bctx = back.getContext("2d")!;
  const fctx = front?.getContext("2d") ?? null;

  let W = host.clientWidth;
  let H = host.clientHeight;
  const small = !opts.fine || W < 768;
  const globalScale = small ? preset.scale.mobile : preset.scale.desktop;
  const countFactor = small ? preset.mobileFactor : 1;

  const engine = Engine.create({ enableSleeping: true, positionIterations: 6, velocityIterations: 4 });
  engine.gravity.y = physics.gravityY;
  engine.gravity.scale = physics.gravityScale * preset.gravity;

  // --- World bounds -----------------------------------------------------
  const T = 400;
  const staticOpts = { isStatic: true, collisionFilter: { category: CAT_STATIC, mask: CAT_BACK | CAT_FRONT }, friction: 0.6 };
  const floor = preset.floorOffset !== null ? Bodies.rectangle(W / 2, H - preset.floorOffset + T / 2, 8000, T, staticOpts) : null;
  const left = Bodies.rectangle(-T / 2, -H, T, H * 6, staticOpts);
  const right = Bodies.rectangle(W + T / 2, -H, T, H * 6, staticOpts);
  Composite.add(engine.world, [left, right, ...(floor ? [floor] : [])]);

  const sizeCanvases = () => {
    for (const c of [back, front]) {
      if (!c) continue;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
    }
  };
  sizeCanvases();

  // --- Bodies -----------------------------------------------------------
  const plan: { look: Look; scale: number; fg: boolean }[] = [];
  for (const item of preset.items) {
    const count = Math.max(1, Math.round(item.count * countFactor));
    const first = Math.floor(Math.random() * 8); // cycle the photo variants from a random one
    for (let i = 0; i < count; i++) {
      const [a, b] = item.scale ?? [0.9, 1.1];
      // quantise scale so the raster cache stays small
      const s = Math.round(rand(a, b) * globalScale * 4) / 4;
      plan.push({ look: lookFor(item.sprite, first + i), scale: s, fg: false });
    }
  }
  // shuffle, then promote a few to the blurred foreground (bigger, closer)
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }
  if (front && preset.foreground > 0) {
    const n = Math.max(1, Math.round(plan.length * preset.foreground));
    const big = plan.filter((p) => p.look.w * p.look.h > 500).slice(0, n);
    for (const p of big) {
      p.fg = true;
      p.scale = Math.round(p.scale * 1.7 * 4) / 4;
    }
  }

  // Fetch + decode the photo sprites in parallel; any that fail fall back to the vector art.
  const photos = [...new Set(plan.flatMap((p) => (p.look.photo ? [p.look.photo.src] : [])))];
  const loaded = await Promise.allSettled(photos.map(loadPhoto));
  const failed = new Set(photos.filter((_, i) => loaded[i].status === "rejected"));
  for (const p of plan) if (p.look.photo && failed.has(p.look.photo.src)) p.look = vectorLook(p.look.id);

  // Rasterise one sprite per task (yielding in between) so start-up never
  // produces a long main-thread task, even with blur on slow phones.
  const sprites: Sprite[] = [];
  for (const p of plan) {
    const blur = p.fg ? 2.4 : 0;
    const cached = spriteCache.has(spriteKey(p.look, p.scale, dpr, blur));
    sprites.push(await rasterize(p.look, p.scale, dpr, blur));
    if (!cached) await yieldToMain();
  }

  const makeBody = (look: Look, s: number, x: number, y: number, fg: boolean) => {
    const def = SPRITES[look.id];
    const fit = def.fit ?? 0.9;
    const w = look.w * s * fit;
    const h = look.h * s * fit;
    const common = {
      restitution: physics.restitution,
      friction: physics.friction,
      frictionStatic: physics.frictionStatic,
      frictionAir: physics.frictionAir * (preset.airy && (look.id === "curryLeaf" || look.id === "moringa") ? 3.2 : 1),
      density: physics.density,
      sleepThreshold: 45,
      collisionFilter: fg ? { category: CAT_FRONT, mask: CAT_STATIC | CAT_FRONT } : { category: CAT_BACK, mask: CAT_STATIC | CAT_BACK },
    };
    const hull = look.photo?.hull;
    if (hull) {
      // convex hull traced from the photo outline, vertices around its centroid
      const pts = [];
      for (let i = 0; i < hull.length; i += 2) pts.push({ x: x + hull[i] * s, y: y + hull[i + 1] * s });
      return Bodies.fromVertices(x, y, [pts], common);
    }
    return def.shape === "circle"
      ? Bodies.circle(x, y, Math.max(w, h) / 2, common)
      : Bodies.rectangle(x, y, w, h, { ...common, chamfer: { radius: Math.max(0.5, Math.min((def.chamfer ?? 4) * s * fit, Math.min(w, h) / 2 - 0.5)) } });
  };

  const items: Item[] = [];
  const pending: { at: number; index: number }[] = [];
  const [sx0, sx1] = spawnBand(preset, host, interaction, small);
  // When the band was narrowed for the copy, an invisible wall at its left edge keeps
  // settled ingredients from rolling along the floor under that copy.
  const fence = sx0 > preset.spawnX[0] ? Bodies.rectangle(sx0 * W - T / 2, -H, T, H * 6, staticOpts) : null;
  if (fence) Composite.add(engine.world, fence);
  const spawnBody = (index: number) => {
    const p = plan[index];
    let x: number;
    let y: number;
    if (preset.spawn === "burst") {
      const [ox, oy] = preset.spawnOrigin ?? [0.5, 0.8];
      x = W * ox + rand(-30, 30);
      y = H * oy + rand(-10, 10);
    } else {
      x = W * rand(sx0, sx1);
      y = -rand(30, 220) - p.look.h * p.scale;
    }
    const body = makeBody(p.look, p.scale, x, y, p.fg);
    Body.setAngle(body, rand(0, Math.PI * 2));
    if (preset.spawn === "burst") {
      Body.setVelocity(body, { x: rand(-14, 14), y: rand(-26, -14) });
      Body.setAngularVelocity(body, rand(-0.3, 0.3));
    } else {
      Body.setVelocity(body, { x: rand(-1.2, 1.2), y: rand(0, 2) });
      Body.setAngularVelocity(body, rand(-0.08, 0.08));
    }
    Composite.add(engine.world, body);
    items.push({ body, sprite: sprites[index], fg: p.fg });
  };

  // --- Rendering --------------------------------------------------------
  const draw = () => {
    for (const ctx of [bctx, fctx]) {
      if (!ctx) continue;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    for (const it of items) {
      const ctx = it.fg && fctx ? fctx : bctx;
      const { x, y } = it.body.position;
      const c = Math.cos(it.body.angle) * dpr;
      const s = Math.sin(it.body.angle) * dpr;
      ctx.setTransform(c, s, -s, c, x * dpr, y * dpr);
      ctx.drawImage(it.sprite.img, -it.sprite.w / 2 - it.sprite.ox, -it.sprite.h / 2 - it.sprite.oy, it.sprite.w, it.sprite.h);
    }
  };

  // --- Reduced motion: pre-settle offline and paint once ------------------
  if (opts.reduced) {
    plan.forEach((_, i) => spawnBody(i));
    for (const it of items) Body.setPosition(it.body, { x: it.body.position.x, y: rand(-H * 0.6, H * 0.4) });
    for (let i = 0; i < 520; i++) Engine.update(engine, physics.step);
    draw();
    return {
      destroy() {
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      },
      burst() {},
    };
  }

  const t0 = performance.now() + (opts.delay ?? 0);
  plan.forEach((_, index) => {
    const at = preset.spawn === "burst" ? t0 + index * (preset.spawnMs / plan.length) * 0.3 : t0 + (index / plan.length) * preset.spawnMs + rand(0, 120);
    pending.push({ at, index });
  });

  // --- Pointer interaction ------------------------------------------------
  const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, inside: false, lastT: 0 };
  let grab: MatterNS.Constraint | null = null;
  let tap: { x: number; y: number; t: number } | null = null;

  const toLocal = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const wake = () => {
    if (!running) start();
  };

  const onMove = (e: PointerEvent) => {
    const p = toLocal(e);
    const now = performance.now();
    const dt = Math.max(8, now - pointer.lastT);
    pointer.vx = ((p.x - pointer.x) / dt) * 16;
    pointer.vy = ((p.y - pointer.y) / dt) * 16;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.lastT = now;
    pointer.inside = e.pointerType === "mouse";
    if (grab) grab.pointA = { x: p.x, y: p.y };
    if (pointer.inside) wake();
  };
  const onLeave = () => {
    pointer.inside = false;
  };
  const onDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE)) return;
    const p = toLocal(e);
    if (e.pointerType !== "mouse") {
      tap = { ...p, t: performance.now() };
      return;
    }
    if (!preset.drag) return;
    const hits = Query.point(
      items.map((i) => i.body),
      p,
    );
    if (!hits.length) return;
    const body = hits[hits.length - 1];
    e.preventDefault();
    interaction.setPointerCapture?.(e.pointerId);
    grab = Constraint.create({
      pointA: { x: p.x, y: p.y },
      bodyB: body,
      pointB: { x: p.x - body.position.x, y: p.y - body.position.y },
      stiffness: physics.dragStiffness,
      damping: 0.08,
      length: 0,
    });
    Composite.add(engine.world, grab);
    Sleeping.set(body, false);
    interaction.dataset.grabbing = "true";
    wake();
  };
  const onUp = (e: PointerEvent) => {
    if (grab) {
      Composite.remove(engine.world, grab);
      grab = null;
      delete interaction.dataset.grabbing;
    }
    if (tap && e.pointerType !== "mouse") {
      const p = toLocal(e);
      if (Math.hypot(p.x - tap.x, p.y - tap.y) < 12 && performance.now() - tap.t < 320) burst(p.x, p.y, 1);
      tap = null;
    }
  };

  function burst(x: number, y: number, strength = 1) {
    const R = 220;
    for (const it of items) {
      const b = it.body;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      const d = Math.hypot(dx, dy);
      if (d > R) continue;
      Sleeping.set(b, false);
      const k = (1 - d / R) * 0.035 * strength * b.mass;
      Body.applyForce(b, b.position, { x: (dx / (d || 1)) * k, y: -Math.abs(k) * 1.4 });
    }
    wake();
  }

  const applyPointerForces = () => {
    if (!preset.repel || !pointer.inside || grab) return;
    const R = physics.repelRadius;
    const speed = Math.min(Math.hypot(pointer.vx, pointer.vy), 60);
    for (const it of items) {
      const b = it.body;
      const dx = b.position.x - pointer.x;
      const dy = b.position.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > R * R || d2 < 1) continue;
      const d = Math.sqrt(d2);
      const falloff = 1 - d / R;
      const f = falloff * physics.repelStrength * b.mass * (it.fg ? 1.5 : 1) * (1 + speed * 0.06);
      if (b.isSleeping) Sleeping.set(b, false);
      Body.applyForce(b, b.position, {
        x: (dx / d) * f + pointer.vx * 0.000012 * b.mass * falloff,
        y: (dy / d) * f - f * 0.45 + pointer.vy * 0.000012 * b.mass * falloff,
      });
    }
    pointer.vx *= 0.85;
    pointer.vy *= 0.85;
  };

  interaction.addEventListener("pointermove", onMove, { passive: true });
  interaction.addEventListener("pointerleave", onLeave);
  interaction.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);

  // --- Loop ---------------------------------------------------------------
  let raf = 0;
  let running = false;
  let last = 0;
  let acc = 0;
  let quiet = 0;
  let visible = true;
  let destroyed = false;

  const frame = (t: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(t - last, 64);
    last = t;
    acc += dt;

    while (pending.length && pending[0] && pending[0].at <= t) {
      const next = pending.shift()!;
      spawnBody(next.index);
    }
    pending.sort((a, b) => a.at - b.at);

    let steps = 0;
    while (acc >= physics.step && steps < 4) {
      applyPointerForces();
      Engine.update(engine, physics.step);
      acc -= physics.step;
      steps++;
    }
    if (steps === 4) acc = 0;

    if (floor === null) {
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].body.position.y > H + 200) {
          Composite.remove(engine.world, items[i].body);
          items.splice(i, 1);
        }
      }
      if (!items.length && !pending.length) {
        draw();
        stop();
        opts.onEmpty?.();
        return;
      }
    }

    const awake = pending.length > 0 || grab !== null || pointer.inside || items.some((i) => !i.body.isSleeping);
    if (awake || steps > 0) draw();
    quiet = awake ? 0 : quiet + 1;
    if (quiet > 45) stop();
  };

  function start() {
    if (running || destroyed || !visible) return;
    running = true;
    last = performance.now();
    acc = 0;
    quiet = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting && document.visibilityState === "visible";
      if (visible) start();
      else stop();
    },
    { rootMargin: "120px" },
  );
  io.observe(host);
  const onVis = () => {
    if (document.visibilityState !== "visible") stop();
    else if (visible) start();
  };
  document.addEventListener("visibilitychange", onVis);

  const ro = new ResizeObserver(() => {
    const nw = host.clientWidth;
    const nh = host.clientHeight;
    if (nw === W && nh === H) return;
    W = nw;
    H = nh;
    sizeCanvases();
    if (floor) Body.setPosition(floor, { x: W / 2, y: H - (preset.floorOffset ?? 0) + T / 2 });
    Body.setPosition(right, { x: W + T / 2, y: -H });
    if (fence) Body.setPosition(fence, { x: sx0 * W - T / 2, y: -H });
    for (const it of items) {
      const b = it.body;
      if (b.position.x > W - 8 || b.position.x < 8) Body.setPosition(b, { x: Math.min(Math.max(b.position.x, 12), W - 12), y: Math.min(b.position.y, H - 40) });
      Sleeping.set(b, false);
    }
    draw();
    start();
  });
  ro.observe(host);

  start();

  if (process.env.NODE_ENV !== "production") {
    (host as HTMLElement & { __physics?: unknown }).__physics = {
      get running() {
        return running;
      },
      get visible() {
        return visible;
      },
      get pending() {
        return pending.length;
      },
      items,
      engine,
    };
  }

  return {
    destroy() {
      destroyed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      interaction.removeEventListener("pointermove", onMove);
      interaction.removeEventListener("pointerleave", onLeave);
      interaction.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    },
    burst,
  };
}
