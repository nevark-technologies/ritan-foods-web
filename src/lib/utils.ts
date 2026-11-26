import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge that knows our custom type scale (otherwise `text-display-lg` is mistaken for a colour). */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-2xl", "display-xl", "display-lg", "display-md", "display-sm", "body-lg"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Money is stored as integer paise everywhere. */
export function formatINR(paise: number, precise = false) {
  const rupees = paise / 100;
  if (precise || !Number.isInteger(rupees)) return inrPrecise.format(rupees);
  return inr.format(rupees);
}

export function formatWeight(grams: number) {
  return grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Words from a slug for categories added in the admin: "millet-snacks" -> "Millet snacks". */
export function slugLabel(slug: string) {
  const words = slug.replace(/-/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-IN", opts).format(new Date(iso));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** WhatsApp click-to-chat link (no API, free). */
export function whatsappLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

/* ------------------------------------------------------------------ colour contrast */

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/(.)/g, "$1$1") : h;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio between two #rrggbb colours. */
export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function mixHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Keeps a brand colour as close to itself as possible while making it
 * readable: mixes `fg` toward `toward` until it reaches `min` contrast on `bg`
 * (4.5:1 = WCAG AA for small text).
 */
export function readableOn(fg: string, bg: string, toward: string, min = 4.5) {
  for (let step = 0; step <= 20; step++) {
    const c = mixHex(fg, toward, step / 20);
    if (contrastRatio(c, bg) >= min) return c;
  }
  return toward;
}
