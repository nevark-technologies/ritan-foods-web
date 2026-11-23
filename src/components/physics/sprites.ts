import type { SpriteId } from "@/lib/data/types";
import { PHOTO_SPRITES } from "./photo-sprites";

/**
 * Hand-drawn ingredient sprites (vector, so they rasterise crisply at any DPR).
 * `w`/`h` are base CSS px; `shape` drives the physics body. Ingredients big
 * enough to cut out of real photos (everything except the tiny grains, seeds and dal)
 * are drawn from photo-sprites.ts instead; these stay as their fallback.
 */
export interface SpriteDef {
  w: number;
  h: number;
  shape: "circle" | "rect";
  /** chamfer radius for rect bodies (px at scale 1) */
  chamfer?: number;
  /** body size relative to the drawn box (bodies hug the visible shape) */
  fit?: number;
  svg: string;
  label: string;
}

const svg = (w: number, h: number, inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;

const radial = (id: string, stops: [number, string][], cx = 0.38, cy = 0.32, r = 0.8) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</radialGradient>`;

export const SPRITES: Record<SpriteId, SpriteDef> = {
  curryLeaf: {
    w: 34,
    h: 72,
    shape: "rect",
    chamfer: 11,
    fit: 0.7,
    label: "Curry leaf",
    svg: svg(
      34,
      72,
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6BAA3C"/><stop offset=".55" stop-color="#2F6B26"/><stop offset="1" stop-color="#1B451B"/></linearGradient></defs>
      <path d="M17 1C29 14 33 34 27 52C24 62 20 68 17 71C14 68 10 62 7 52C1 34 5 14 17 1Z" fill="url(#g)"/>
      <path d="M17 4L17 70" stroke="#D3E6A4" stroke-opacity=".6" stroke-width="1.1" fill="none"/>
      <path d="M17 18L24 13M17 28L26 22M17 38L26 33M17 48L24 44M17 22L10 17M17 32L8 27M17 42L8 38M17 52L10 49" stroke="#D3E6A4" stroke-opacity=".32" stroke-width=".8" fill="none" stroke-linecap="round"/>
      <path d="M17 1C29 14 33 34 27 52" stroke="#fff" stroke-opacity=".2" stroke-width="1.6" fill="none"/>`,
    ),
  },
  moringa: {
    w: 18,
    h: 28,
    shape: "rect",
    chamfer: 7,
    fit: 0.78,
    label: "Moringa leaf",
    svg: svg(
      18,
      28,
      `<defs>${radial("g", [[0, "#9BD15A"], [0.65, "#4E9A2A"], [1, "#2E6A1C"]], 0.4, 0.35, 0.8)}</defs>
      <path d="M9 1C15 6 17 12 16.5 17C16 23 12.5 27 9 27C5.5 27 2 23 1.5 17C1 12 3 6 9 1Z" fill="url(#g)"/>
      <path d="M9 3L9 26" stroke="#DDF1B5" stroke-opacity=".55" stroke-width=".8"/>`,
    ),
  },
  chilli: {
    w: 92,
    h: 26,
    shape: "rect",
    chamfer: 7,
    fit: 0.82,
    label: "Dried red chilli",
    svg: svg(
      92,
      26,
      `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D8412F"/><stop offset=".5" stop-color="#A2211A"/><stop offset="1" stop-color="#65110C"/></linearGradient></defs>
      <path d="M14 13C24 4 54 3 90 9C70 18 40 24 16 20C12 19 11 15 14 13Z" fill="url(#g)"/>
      <path d="M22 11C40 8 62 8 84 10" stroke="#FF9C80" stroke-opacity=".4" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M30 15C34 13 38 16 42 14M50 15C54 13 58 16 62 14M68 13C71 12 74 14 77 12" stroke="#4A0A07" stroke-opacity=".35" stroke-width=".8" fill="none"/>
      <path d="M3 12C6 9 10 9 12.5 11L15 13C15 16 13 19 11 19C7 19 4.5 17 3 12Z" fill="#6E7F2C"/>
      <path d="M1.5 12.5C0.5 11 .8 9 2.6 8.6" stroke="#56631F" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
    ),
  },
  cardamom: {
    w: 18,
    h: 34,
    shape: "rect",
    chamfer: 8,
    fit: 0.86,
    label: "Cardamom",
    svg: svg(
      18,
      34,
      `<defs>${radial("g", [[0, "#CFDC93"], [0.6, "#93A955"], [1, "#5C7132"]], 0.36, 0.34, 0.8)}</defs>
      <path d="M9 1C15 6 17 14 16 22C15 28 12 32 9 33C6 32 3 28 2 22C1 14 3 6 9 1Z" fill="url(#g)"/>
      <path d="M9 3L9 31M5.5 7C4.5 14 4.5 22 6 29M12.5 7C13.5 14 13.5 22 12 29" stroke="#4A5C25" stroke-opacity=".35" stroke-width=".8" fill="none"/>
      <circle cx="9" cy="1.8" r="1.2" fill="#6E5A2A"/>`,
    ),
  },
  peanut: {
    w: 26,
    h: 18,
    shape: "rect",
    chamfer: 8,
    fit: 0.86,
    label: "Groundnut",
    svg: svg(
      26,
      18,
      `<defs>${radial("g", [[0, "#E8AE84"], [0.55, "#B5653A"], [1, "#77381B"]], 0.35, 0.3, 0.9)}</defs>
      <path d="M4 9C4 4 9 1.5 14 2C20 2.5 24 5 24 9.5C24 14 19.5 16.5 13 16C7.5 15.6 4 13.5 4 9Z" fill="url(#g)"/>
      <path d="M8 6C11 5 15 5 19 6.5" stroke="#F8D2B4" stroke-opacity=".55" stroke-width="1" fill="none" stroke-linecap="round"/>
      <path d="M3.5 9C2.5 8.5 1.8 9 2 10" stroke="#77381B" stroke-width="1" fill="none"/>`,
    ),
  },
  uradDal: {
    w: 14,
    h: 11,
    shape: "circle",
    fit: 0.86,
    label: "Urad dal",
    svg: svg(
      14,
      11,
      `<defs>${radial("g", [[0, "#FFFCF2"], [0.7, "#EDE2C6"], [1, "#C2B088"]], 0.4, 0.35, 0.8)}</defs>
      <ellipse cx="7" cy="5.5" rx="6.5" ry="5" fill="url(#g)"/>
      <path d="M2.5 7C4 9 9 9.5 11.5 7.5" stroke="#2E281F" stroke-opacity=".5" stroke-width=".7" fill="none"/>`,
    ),
  },
  chanaDal: {
    w: 14,
    h: 12,
    shape: "circle",
    fit: 0.88,
    label: "Chana dal",
    svg: svg(
      14,
      12,
      `<defs>${radial("g", [[0, "#FAE38C"], [0.7, "#E3B443"], [1, "#B0821F"]], 0.4, 0.35, 0.8)}</defs>
      <path d="M1 7C1 3 4 1 7 1C10.5 1 13 3.5 13 7C13 9.5 11 11 7 11C3 11 1 9.5 1 7Z" fill="url(#g)"/>
      <path d="M3 6C5 4.5 9 4.5 11 6" stroke="#FFF5C8" stroke-opacity=".65" stroke-width=".8" fill="none"/>`,
    ),
  },
  millet: {
    w: 9,
    h: 9,
    shape: "circle",
    fit: 0.92,
    label: "Millet",
    svg: svg(
      9,
      9,
      `<defs>${radial("g", [[0, "#FCE9AA"], [0.6, "#E0B04E"], [1, "#A57624"]], 0.38, 0.32, 0.75)}</defs>
      <circle cx="4.5" cy="4.5" r="4.2" fill="url(#g)"/><circle cx="3.3" cy="3.2" r="1" fill="#fff" fill-opacity=".45"/>`,
    ),
  },
  mustard: {
    w: 6,
    h: 6,
    shape: "circle",
    fit: 0.95,
    label: "Mustard seed",
    svg: svg(
      6,
      6,
      `<defs>${radial("g", [[0, "#7A5540"], [0.7, "#3A2418"], [1, "#1E120B"]], 0.38, 0.32, 0.75)}</defs>
      <circle cx="3" cy="3" r="2.8" fill="url(#g)"/><circle cx="2.2" cy="2.1" r=".6" fill="#fff" fill-opacity=".4"/>`,
    ),
  },
  sesame: {
    w: 6,
    h: 10,
    shape: "rect",
    chamfer: 3,
    fit: 0.9,
    label: "Sesame",
    svg: svg(
      6,
      10,
      `<defs>${radial("g", [[0, "#FFF8E6"], [0.7, "#EADBB8"], [1, "#C7B087"]], 0.4, 0.35, 0.8)}</defs>
      <path d="M3 .5C5 2.5 5.6 5.5 5 7.5C4.5 9 3.8 9.6 3 9.6C2.2 9.6 1.5 9 1 7.5C.4 5.5 1 2.5 3 .5Z" fill="url(#g)"/>`,
    ),
  },
  garlic: {
    w: 26,
    h: 34,
    shape: "rect",
    chamfer: 11,
    fit: 0.84,
    label: "Garlic",
    svg: svg(
      26,
      34,
      `<defs>${radial("g", [[0, "#FFFDF7"], [0.7, "#F1E7D6"], [1, "#D3BE9E"]], 0.4, 0.55, 0.75)}</defs>
      <path d="M13 1C15 4 19 9 22 16C25 24 22 32 13 33C4 32 1 24 4 16C7 9 11 4 13 1Z" fill="url(#g)"/>
      <path d="M13 3C12 12 12 24 13 32M8 12C7 18 7.5 26 10 31M18 12C19 18 18.5 26 16 31" stroke="#C9A39C" stroke-opacity=".55" stroke-width=".8" fill="none"/>
      <path d="M11 2.2L13 .6L15 2.2" stroke="#B49474" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    ),
  },
  almond: {
    w: 22,
    h: 34,
    shape: "rect",
    chamfer: 9,
    fit: 0.84,
    label: "Almond",
    svg: svg(
      22,
      34,
      `<defs>${radial("g", [[0, "#D99B66"], [0.6, "#A8653A"], [1, "#6B3A1D"]], 0.38, 0.4, 0.8)}</defs>
      <path d="M11 1C17 7 21 15 20.5 22C20 29 16 33 11 33C6 33 2 29 1.5 22C1 15 5 7 11 1Z" fill="url(#g)"/>
      <path d="M11 4C9.5 12 9.5 22 11 31M7 10C6 16 6 24 8 29M15 10C16 16 16 24 14 29" stroke="#5A2F16" stroke-opacity=".3" stroke-width=".8" fill="none"/>
      <path d="M8 6C9.5 4.5 10.5 3.6 11 3" stroke="#F4C79E" stroke-opacity=".6" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    ),
  },
  cashew: {
    w: 34,
    h: 22,
    shape: "rect",
    chamfer: 8,
    fit: 0.8,
    label: "Cashew",
    svg: svg(
      34,
      22,
      `<defs>${radial("g", [[0, "#FFF4DC"], [0.65, "#EBD2A2"], [1, "#C29C61"]], 0.4, 0.3, 0.9)}</defs>
      <path d="M3 9C3 4 8 1 14 1.5C22 2 30 6 32 12C33 16 31 20 27 20.5C24 21 22 18 22 15.5C22 12 19 9.5 14 9.5C10 9.5 8 12 6.5 13C4.5 14 3 12 3 9Z" fill="url(#g)"/>
      <path d="M8 5C14 3.5 22 4.5 27 9" stroke="#fff" stroke-opacity=".55" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    ),
  },
  bananaSlice: {
    w: 34,
    h: 34,
    shape: "circle",
    fit: 0.96,
    label: "Nendran banana",
    svg: svg(
      34,
      34,
      `<defs>${radial("g", [[0, "#FFF6D2"], [0.72, "#F6E19A"], [1, "#E0BF58"]], 0.45, 0.4, 0.7)}</defs>
      <circle cx="17" cy="17" r="16" fill="#C59C32"/><circle cx="17" cy="17" r="14.6" fill="url(#g)"/>
      <path d="M17 12L19.6 18.2L14.4 18.2Z" fill="none" stroke="#C7A44E" stroke-width=".9" stroke-opacity=".75"/>
      <circle cx="17" cy="11.4" r=".95" fill="#6E5016"/><circle cx="20.3" cy="18.7" r=".95" fill="#6E5016"/><circle cx="13.7" cy="18.7" r=".95" fill="#6E5016"/>`,
    ),
  },
  carrotSlice: {
    w: 30,
    h: 30,
    shape: "circle",
    fit: 0.96,
    label: "Carrot",
    svg: svg(
      30,
      30,
      `<defs>${radial("g", [[0, "#FFB061"], [0.7, "#F07A22"], [1, "#C4520D"]], 0.45, 0.4, 0.75)}</defs>
      <circle cx="15" cy="15" r="14" fill="url(#g)"/><circle cx="15" cy="15" r="7" fill="#F9A04A" fill-opacity=".85"/>
      <circle cx="15" cy="15" r="7" fill="none" stroke="#FFD09A" stroke-opacity=".6" stroke-width=".8"/>`,
    ),
  },
  beetSlice: {
    w: 32,
    h: 32,
    shape: "circle",
    fit: 0.96,
    label: "Beetroot",
    svg: svg(
      32,
      32,
      `<defs>${radial("g", [[0, "#C2275A"], [0.7, "#8E1240"], [1, "#5A0A28"]], 0.45, 0.4, 0.75)}</defs>
      <circle cx="16" cy="16" r="15" fill="url(#g)"/>
      <circle cx="16" cy="16" r="11" fill="none" stroke="#E05A8A" stroke-opacity=".55" stroke-width="1"/>
      <circle cx="16" cy="16" r="6.5" fill="none" stroke="#E05A8A" stroke-opacity=".45" stroke-width="1"/>`,
    ),
  },
  appleSlice: {
    w: 36,
    h: 32,
    shape: "circle",
    fit: 0.9,
    label: "Apple",
    svg: svg(
      36,
      32,
      `<defs>${radial("g", [[0, "#FFFBEA"], [0.75, "#F5EBC9"], [1, "#E6D3A0"]], 0.45, 0.45, 0.75)}</defs>
      <path d="M18 4C22 1 30 1 33 8C36 15 33 26 26 30C22 32 19 30.5 18 30C17 30.5 14 32 10 30C3 26 0 15 3 8C6 1 14 1 18 4Z" fill="#C8262E"/>
      <path d="M18 6C21.5 3.5 28.5 3.5 31 9C33.5 15 31 24.5 25 28C21.5 30 19 28.5 18 28C17 28.5 14.5 30 11 28C5 24.5 2.5 15 5 9C7.5 3.5 14.5 3.5 18 6Z" fill="url(#g)"/>
      <path d="M18 12L20 16L18 20L16 16Z" fill="none" stroke="#C9B57A" stroke-width=".9"/>
      <ellipse cx="18" cy="14.5" rx=".9" ry="1.6" fill="#5B3A1A"/><ellipse cx="18" cy="17.8" rx=".9" ry="1.6" fill="#5B3A1A"/>`,
    ),
  },
  mungBean: {
    w: 10,
    h: 7,
    shape: "circle",
    fit: 0.9,
    label: "Green gram",
    svg: svg(
      10,
      7,
      `<defs>${radial("g", [[0, "#9CC26A"], [0.7, "#5E8A2E"], [1, "#3B5E1A"]], 0.38, 0.32, 0.8)}</defs>
      <ellipse cx="5" cy="3.5" rx="4.7" ry="3.2" fill="url(#g)"/><ellipse cx="5" cy="2.6" rx="1.2" ry=".5" fill="#F2F5E6" fill-opacity=".8"/>`,
    ),
  },
  soybean: {
    w: 12,
    h: 10,
    shape: "circle",
    fit: 0.92,
    label: "Soybean",
    svg: svg(
      12,
      10,
      `<defs>${radial("g", [[0, "#FFF3C9"], [0.7, "#EED79A"], [1, "#C9AE62"]], 0.4, 0.35, 0.8)}</defs>
      <ellipse cx="6" cy="5" rx="5.6" ry="4.6" fill="url(#g)"/><path d="M4 4.6C5 4 7 4 8 4.6" stroke="#8C6E2E" stroke-opacity=".55" stroke-width=".7" fill="none"/>`,
    ),
  },
  date: {
    w: 18,
    h: 32,
    shape: "rect",
    chamfer: 8,
    fit: 0.86,
    label: "Date",
    svg: svg(
      18,
      32,
      `<defs>${radial("g", [[0, "#9A4B2A"], [0.6, "#5E2614"], [1, "#331109"]], 0.38, 0.34, 0.8)}</defs>
      <path d="M9 1C14 1 17 7 17 16C17 25 14 31 9 31C4 31 1 25 1 16C1 7 4 1 9 1Z" fill="url(#g)"/>
      <path d="M5 8C7 12 5 16 7 20C8 23 6 26 8 28M12 6C11 11 13 15 11 19" stroke="#1E0904" stroke-opacity=".4" stroke-width=".8" fill="none"/>
      <path d="M6 5C7 3.5 8.5 3 10 3.2" stroke="#D08A5E" stroke-opacity=".5" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    ),
  },
  horseGram: {
    w: 10,
    h: 8,
    shape: "circle",
    fit: 0.9,
    label: "Horse gram",
    svg: svg(
      10,
      8,
      `<defs>${radial("g", [[0, "#C49A6C"], [0.7, "#8A5E36"], [1, "#5C3B1F"]], 0.38, 0.32, 0.8)}</defs>
      <ellipse cx="5" cy="4" rx="4.7" ry="3.6" fill="url(#g)"/><circle cx="3.6" cy="3.4" r=".5" fill="#3A2412"/><circle cx="6.2" cy="4.8" r=".45" fill="#3A2412"/>`,
    ),
  },
};

/** Static sprite file for <img> use in pages: the real-photo SVG when there is one, else the vector copy (`npm run assets:sprites`). */
export const spriteSrc = (id: SpriteId) => PHOTO_SPRITES[id]?.[0]?.src ?? `/images/sprites/${id}.svg`;

/** Base size (CSS px at scale 1) of the art `spriteSrc` returns. */
export function spriteSize(id: SpriteId): { w: number; h: number } {
  const photo = PHOTO_SPRITES[id]?.[0];
  return photo ? { w: photo.w, h: photo.h } : { w: SPRITES[id].w, h: SPRITES[id].h };
}

export function spriteDataUrl(id: SpriteId) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SPRITES[id].svg.replace(/\s{2,}/g, " "))}`;
}
