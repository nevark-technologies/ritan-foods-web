"""Build the photo sprites: real ingredient cut-outs inside an SVG, clipped by
their traced vector outline.

For every sprite id in photo-sprites.json the chosen masters (from cutouts.py)
are colour-adjusted and resized (long side = RES x the base CSS size), the alpha
outline is traced into an SVG clip path, and a convex collision hull is fitted.

Tiny grains, seeds and dal are not here: they stay vector (sprites.ts).

Writes:
  public/images/sprites/photo/<id>-<n>.<hash>.svg   WebP (base64) + clipPath
  src/components/physics/photo-sprites.ts           sizes, centroid offsets, hulls

Usage (tools venv, from the project root):
  python -I scripts/images/build_sprites.py scripts/images/photo-sprites.json assets-src/ingredients
"""

from __future__ import annotations

import base64
import hashlib
import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance
from scipy import ndimage
from scipy.spatial import ConvexHull
from skimage import measure

ROOT = Path(__file__).resolve().parents[2]
OUT_SVG = ROOT / "public" / "images" / "sprites" / "photo"
OUT_TS = ROOT / "src" / "components" / "physics" / "photo-sprites.ts"
RES = 3  # raster px per base CSS px: DPR 2 at the hero's desktop scale


def adjust(im: Image.Image, cfg: dict) -> Image.Image:
    rgb, a = im.convert("RGB"), im.getchannel("A")
    if "recolor" in cfg:  # duotone: map luminance onto a shadow -> highlight ramp
        lo, hi = (np.array(c, np.float32) for c in cfg["recolor"])
        lum = np.asarray(rgb.convert("L")).astype(np.float32) / 255
        lum = np.clip((lum - lum[np.asarray(a) > 200].min()) / max(1e-3, np.ptp(lum[np.asarray(a) > 200])), 0, 1) ** cfg.get("gamma", 0.8)
        rgb = Image.fromarray((lo + (hi - lo) * lum[..., None]).round().astype(np.uint8))
    for key, enh in (("brightness", ImageEnhance.Brightness), ("contrast", ImageEnhance.Contrast), ("saturation", ImageEnhance.Color)):
        if key in cfg:
            rgb = enh(rgb).enhance(cfg[key])
    out = rgb.convert("RGBA")
    out.putalpha(a)
    return out


def trace(alpha: np.ndarray, tolerance: float) -> np.ndarray:
    """Outer outline of the 50% alpha level, as (x, y) in SVG user units."""
    soft = ndimage.gaussian_filter(alpha, 0.6)
    contours = measure.find_contours(np.pad(soft, 1), 0.5)
    outline = max(contours, key=lambda c: len(c))
    poly = measure.approximate_polygon(outline, tolerance=tolerance)
    return poly[:-1, ::-1] - 0.5  # drop closing dup, (row, col) -> (x, y), pixel centres


def area_centroid(p: np.ndarray) -> tuple[float, np.ndarray]:
    x, y = p[:, 0], p[:, 1]
    xn, yn = np.roll(x, -1), np.roll(y, -1)
    cross = x * yn - xn * y
    area = cross.sum() / 2
    return area, np.array([((x + xn) * cross).sum(), ((y + yn) * cross).sum()]) / (6 * area)


def hull(outline: np.ndarray, max_points: int, inset: float) -> np.ndarray:
    pts = outline[ConvexHull(outline).vertices]
    while len(pts) > max_points:  # Visvalingam: drop the corner that matters least
        prev, nxt = np.roll(pts, 1, 0), np.roll(pts, -1, 0)
        tri = np.abs((pts[:, 0] - prev[:, 0]) * (nxt[:, 1] - prev[:, 1]) - (nxt[:, 0] - prev[:, 0]) * (pts[:, 1] - prev[:, 1]))
        pts = np.delete(pts, int(np.argmin(tri)), 0)
    _, c = area_centroid(pts)
    return c + (pts - c) * inset


def path_d(p: np.ndarray) -> str:
    out = [f"M{p[0, 0]:.1f} {p[0, 1]:.1f}"]
    prev = np.round(p[0], 1)
    for q in p[1:]:
        out.append(f"l{q[0] - prev[0]:.1f} {q[1] - prev[1]:.1f}")
        prev = np.round(prev + np.round(q - prev, 1), 1)
    return ("".join(out) + "z").replace(" -", "-").replace("l0.0 ", "l0 ").replace(".0 ", " ").replace(".0l", "l").replace(".0z", "z")


def build(sprite_id: str, cfg: dict, masters: Path) -> list[dict]:
    variants = []
    for n, piece in enumerate(cfg["pieces"], start=1):
        piece = piece if isinstance(piece, dict) else {"name": piece}
        im = adjust(Image.open(masters / f"{piece['name']}.png").convert("RGBA"), cfg)
        if piece.get("flip"):
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        major = cfg["major"] * piece.get("scale", 1)  # e.g. a clove beside whole bulbs
        long_px = min(round(major * RES), max(im.size))
        k = long_px / max(im.size)
        W, H = max(1, round(im.width * k)), max(1, round(im.height * k))
        im = im.resize((W, H), Image.LANCZOS)
        alpha = np.asarray(im.getchannel("A")).astype(np.float32) / 255
        outline = trace(alpha, tolerance=cfg.get("tolerance", 0.45))
        buf = io.BytesIO()
        im.convert("RGB").save(buf, "WEBP", quality=cfg.get("quality", 80), method=6)
        href = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            f'<clipPath id="c"><path d="{path_d(outline)}"/></clipPath>'
            f'<image width="{W}" height="{H}" clip-path="url(#c)" href="{href}"/></svg>\n'
        )
        digest = hashlib.sha1(svg.encode()).hexdigest()[:8]
        file = f"{sprite_id}-{n}.{digest}.svg"
        (OUT_SVG / file).write_text(svg, encoding="utf-8")
        base = major / max(W, H)  # base CSS px per raster px
        v = {"src": f"/images/sprites/photo/{file}", "w": round(W * base, 2), "h": round(H * base, 2)}
        body = hull(outline, cfg.get("hull_points", 10), cfg.get("inset", 0.97))
        _, c = area_centroid(body)
        if cfg.get("shape", "hull") == "hull":
            v["ox"], v["oy"] = round((c[0] - W / 2) * base, 2), round((c[1] - H / 2) * base, 2)
            v["hull"] = [round(float(t), 2) for t in ((body - c) * base).ravel()]
        variants.append(v)
        print(f"  {file:34} {W}x{H}px  base {v['w']}x{v['h']}  {len(svg) / 1024:.1f} KB  outline {len(outline)} pts")
    return variants


def main(spec_file: Path, masters: Path) -> None:
    spec = {k: v for k, v in json.loads(spec_file.read_text()).items() if not k.startswith("$")}
    OUT_SVG.mkdir(parents=True, exist_ok=True)
    for old in OUT_SVG.glob("*.svg"):
        old.unlink()
    table = {}
    for sprite_id, cfg in spec.items():
        print(sprite_id)
        table[sprite_id] = build(sprite_id, cfg, masters)
    lines = [
        "// Generated by scripts/images/build_sprites.py from real ingredient photos. Do not edit by hand.",
        'import type { SpriteId } from "@/lib/data/types";',
        "",
        "export interface PhotoVariant {",
        "  /** SVG holding the photo cut-out (WebP) clipped by its traced outline */",
        "  src: string;",
        "  /** drawn size at scale 1, CSS px */",
        "  w: number;",
        "  h: number;",
        "  /** collision-hull centroid relative to the image centre, CSS px (hull bodies only) */",
        "  ox?: number;",
        "  oy?: number;",
        "  /** convex collision hull around that centroid, flat [x0, y0, x1, y1, ...] in CSS px; circle body when absent */",
        "  hull?: readonly number[];",
        "}",
        "",
        "export const PHOTO_SPRITES: Partial<Record<SpriteId, readonly PhotoVariant[]>> = {",
    ]
    num = lambda t: f"{t:.2f}".rstrip("0").rstrip(".") if abs(t) >= 0.005 else "0"  # noqa: E731
    for sprite_id, variants in table.items():
        lines.append(f"  {sprite_id}: [")
        for v in variants:
            parts = [f'src: "{v["src"]}"', f"w: {num(v['w'])}", f"h: {num(v['h'])}"]
            if "hull" in v:
                parts += [f"ox: {num(v['ox'])}", f"oy: {num(v['oy'])}", f"hull: [{', '.join(num(t) for t in v['hull'])}]"]
            lines.append(f"    {{ {', '.join(parts)} }},")
        lines.append("  ],")
    lines.append("};")
    OUT_TS.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {OUT_TS.relative_to(ROOT)}")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
