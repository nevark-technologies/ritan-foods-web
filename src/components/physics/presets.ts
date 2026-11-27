import type { SpriteId } from "@/lib/data/types";

export interface PresetItem {
  sprite: SpriteId;
  count: number;
  /** random scale range applied on top of the preset scale */
  scale?: [number, number];
}

export interface PhysicsPreset {
  key: string;
  items: PresetItem[];
  /** multiplier on tokens.physics.gravityScale */
  gravity: number;
  /** rain: drop from above over spawnMs · burst: launch upward from spawnOrigin */
  spawn: "rain" | "burst";
  spawnMs: number;
  scale: { desktop: number; mobile: number };
  /** floor distance from the bottom edge (px). null = no floor (bodies fall away) */
  floorOffset: number | null;
  repel: boolean;
  drag: boolean;
  /** fraction of bodies promoted to the blurred foreground layer */
  foreground: number;
  /** body count factor on touch / small screens */
  mobileFactor: number;
  /** horizontal spawn band, fractions of width */
  spawnX: [number, number];
  /** burst origin, fractions of width/height */
  spawnOrigin?: [number, number];
  /** extra air friction for floaty items (leaves) */
  airy?: boolean;
  /** selector (inside the interaction root) for copy the rain must stay clear of on wide screens */
  keepClear?: string;
}

export const heroPreset: PhysicsPreset = {
  key: "hero",
  items: [
    { sprite: "curryLeaf", count: 10, scale: [0.85, 1.15] },
    { sprite: "chilli", count: 5, scale: [0.8, 1.05] },
    { sprite: "uradDal", count: 16 },
    { sprite: "chanaDal", count: 12 },
    { sprite: "millet", count: 22 },
    { sprite: "mustard", count: 14 },
    { sprite: "cardamom", count: 6 },
    { sprite: "peanut", count: 9 },
    { sprite: "garlic", count: 3 },
  ],
  gravity: 1,
  spawn: "rain",
  spawnMs: 2600,
  scale: { desktop: 1.45, mobile: 1.05 },
  floorOffset: 0,
  repel: true,
  drag: true,
  foreground: 0.08,
  mobileFactor: 0.42,
  spawnX: [0.04, 0.96],
  keepClear: "[data-keep-clear]",
};

export const footerPreset: PhysicsPreset = {
  key: "footer",
  items: [
    { sprite: "curryLeaf", count: 14, scale: [0.9, 1.3] },
    { sprite: "moringa", count: 10 },
    { sprite: "chilli", count: 3 },
    { sprite: "cardamom", count: 4 },
  ],
  gravity: 0.7,
  spawn: "rain",
  spawnMs: 3200,
  scale: { desktop: 1.3, mobile: 1 },
  floorOffset: 0,
  repel: true,
  drag: true,
  foreground: 0,
  mobileFactor: 0.5,
  spawnX: [0.02, 0.98],
  airy: true,
};

export function productPreset(sprites: SpriteId[], key: string): PhysicsPreset {
  const counts = [9, 8, 7, 6, 6];
  return {
    key: `pdp-${key}`,
    items: sprites.slice(0, 5).map((sprite, i) => ({ sprite, count: counts[i] ?? 5, scale: [0.9, 1.2] as [number, number] })),
    gravity: 0.9,
    spawn: "rain",
    spawnMs: 1800,
    scale: { desktop: 1.6, mobile: 1.2 },
    floorOffset: 0,
    repel: true,
    drag: true,
    foreground: 0.06,
    mobileFactor: 0.5,
    spawnX: [0.06, 0.94],
  };
}

export function confettiPreset(sprites: SpriteId[]): PhysicsPreset {
  return {
    key: "confetti",
    items: [...new Set<SpriteId>([...sprites, "curryLeaf", "chilli", "cardamom"])].slice(0, 6).map((sprite) => ({ sprite, count: 9, scale: [1, 1.4] as [number, number] })),
    gravity: 1.1,
    spawn: "burst",
    spawnMs: 500,
    scale: { desktop: 1.5, mobile: 1.15 },
    floorOffset: null,
    repel: false,
    drag: false,
    foreground: 0.15,
    mobileFactor: 0.6,
    spawnX: [0.3, 0.7],
    spawnOrigin: [0.5, 0.85],
  };
}
