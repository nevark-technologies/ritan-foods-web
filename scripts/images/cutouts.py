"""Cut single ingredients out of stock photos for the photo sprites.

Only ingredients big enough to cut out cleanly come from photos (chilli, curry
leaf, cardamom, peanut, garlic, almond, cashew, date, moringa and the fruit and
veg slices); tiny grains, seeds and dal stay vector (sprites.ts).

Each photo gets a foreground alpha (BiRefNet, cached), then touching objects
are separated with a seeded watershed on the colour gradient:
every wanted object has a seed polyline drawn along it, neighbours get manual
"others" seeds and/or automatic ones (distance-transform peaks). Each object
keeps its own soft alpha, its edge colours are bled from the opaque interior
(no white or black halo on the green hero), it is turned to align its long axis,
and saved as an RGBA master.

Usage (tools venv, from the project root):
  set U2NET_HOME=D:\\PROJECTS\\ritan-tools\\models
  python -I scripts/images/cutouts.py scripts/images/cutouts.json <photos> <cache> assets-src/ingredients [photo-prefix]
  (review sheets: <cache>/_review; masters feed build_sprites.py)

Spec (JSON) per photo stem:
  auto:    {"min_distance": px, "min_depth": px, "keep_out": px}
           automatic seeds for neighbours (distance-transform peaks)
  others:  [[[x, y], ...], ...]                         manual neighbour seeds
  others_width, smooth                                  seed width / gradient blur
  objects: {name: {seed: [[x, y], ...] | box: [x0, y0, x1, y1], width: px,
                   orient: h | v | keep, rot: deg, flip: bool,
                   convex: bool, open: px (see reshape), mirror: bool (see mirror_fill)}}
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage.feature import peak_local_max
from skimage.filters import sobel
from skimage.segmentation import watershed

CREAM, FOREST = (251, 247, 238), (30, 77, 43)


def ramp(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return np.clip((x - lo) / (hi - lo), 0, 1)


def flat(photo: Path) -> Image.Image:
    """The photo as RGB; transparent PNGs are laid on white first (their hidden RGB is junk)."""
    im = Image.open(photo)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        return Image.alpha_composite(Image.new("RGBA", im.size, (255, 255, 255, 255)), im).convert("RGB")
    return im.convert("RGB")


def foreground(photo: Path, cache: Path) -> np.ndarray:
    """BiRefNet foreground alpha, cached per photo (one run takes ~30 s on CPU)."""
    f = cache / f"{photo.stem}.png"
    if not f.exists():
        from rembg import new_session, remove

        mask = remove(flat(photo), session=new_session("birefnet-general"), only_mask=True, post_process_mask=False)
        mask.save(f)
    return np.asarray(Image.open(f).convert("L")).astype(np.float32) / 255


def draw_seed(canvas: ImageDraw.ImageDraw, pts: list, label: int, width: int = 7) -> None:
    """A seed is a polyline (fat lines claim most of an object up front) or a disk."""
    pts = [tuple(p) for p in pts]
    if len(pts) > 1:
        canvas.line(pts, fill=label, width=width, joint="curve")
    r = max(4, width // 2) if len(pts) > 1 or width != 7 else 9
    for x, y in pts:
        canvas.ellipse([x - r, y - r, x + r, y + r], fill=label)


def segment(rgb: np.ndarray, alpha: np.ndarray, spec: dict):
    """Watershed labels: 1..n = wanted objects (seed order), n+1 = everything else."""
    h, w = alpha.shape
    names = [k for k, o in spec["objects"].items() if "seed" in o]
    seeds = Image.new("I", (w, h), 0)
    d = ImageDraw.Draw(seeds)
    for i, name in enumerate(names, start=1):
        draw_seed(d, spec["objects"][name]["seed"], i, spec["objects"][name].get("width", 7))
    other = len(names) + 1
    for pts in spec.get("others", []):
        draw_seed(d, pts, other, spec.get("others_width", 7))
    markers = np.asarray(seeds).astype(np.int32)
    solid = alpha > 0.5
    if "auto" in spec:
        dist = ndimage.distance_transform_edt(solid)
        near = ndimage.distance_transform_edt(~np.isin(markers, list(range(1, other)))) < spec["auto"].get("keep_out", 22)
        for y, x in peak_local_max(dist, min_distance=spec["auto"]["min_distance"], threshold_abs=spec["auto"].get("min_depth", 4), labels=solid.astype(int), exclude_border=False):
            if not near[y, x] and markers[y, x] == 0:
                r = max(2, int(dist[y, x] * 0.5))
                markers[max(0, y - r) : y + r + 1, max(0, x - r) : x + r + 1] = np.where(
                    solid[max(0, y - r) : y + r + 1, max(0, x - r) : x + r + 1], other, markers[max(0, y - r) : y + r + 1, max(0, x - r) : x + r + 1]
                )
    markers[alpha < 0.3] = 0
    sigma = spec.get("smooth", 1.2)  # raise for textured surfaces (peanut shells)
    smooth = ndimage.gaussian_filter(rgb, sigma=(sigma, sigma, 0))
    grad = np.max(np.stack([sobel(smooth[..., c]) for c in range(3)]), axis=0)
    return names, watershed(grad, markers, mask=alpha > 0.12)


def mirror_fill(rgb: np.ndarray, a: np.ndarray, theirs: np.ndarray):
    """Rebuild the part of a near-symmetric object (peanut shell) hidden under a
    neighbour: reflect it about its long axis (offset fitted by overlap) and take
    the reflection only where the neighbour covered it - never into open background."""
    mine = a > 0.5
    ys, xs = np.nonzero(mine)
    pts = np.stack([xs, ys], 1).astype(np.float64)
    c = pts.mean(0)
    vals, vecs = np.linalg.eigh(np.cov((pts - c).T))
    n = vecs[:, int(np.argmin(vals))]  # normal of the long axis
    h, w = a.shape
    gy, gx = np.mgrid[0:h, 0:w].astype(np.float64)

    def reflect(field, d, order):
        dist = (gx - c[0]) * n[0] + (gy - c[1]) * n[1] - d
        return ndimage.map_coordinates(field, [gy - 2 * dist * n[1], gx - 2 * dist * n[0]], order=order, mode="constant")

    best = max(range(-40, 41, 2), key=lambda d: (mine & (reflect(mine.astype(np.float32), d, 0) > 0.5)).sum() / max(1, (mine | (reflect(mine.astype(np.float32), d, 0) > 0.5)).sum()))
    a_ref = reflect(a, best, 1)
    hidden = ndimage.binary_dilation(theirs, iterations=2) & (a_ref > a)
    out_rgb = rgb.copy()
    for ch in range(3):
        out_rgb[..., ch] = np.where(hidden, reflect(rgb[..., ch], best, 1), rgb[..., ch])
    return np.where(hidden, a_ref, a), out_rgb


def isolate(alpha: np.ndarray, mine: np.ndarray, theirs: np.ndarray) -> np.ndarray:
    region = ndimage.binary_dilation(mine, iterations=3) & ~theirs
    a = alpha * region
    a *= 1 - ndimage.gaussian_filter(theirs.astype(np.float32), 0.7)
    lab, n = ndimage.label(a > 0.5)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(a), lab, index=range(1, n + 1))
        a *= ndimage.binary_dilation(lab == (1 + int(np.argmax(sizes))), iterations=3)
    return a


def reshape(a: np.ndarray, obj: dict) -> np.ndarray:
    """convex: fill occlusion bites with the convex hull, in photo space, so the
    filled area shows real pixels (usually the same-coloured leaf that covered it).
    open: px of opening first, to drop a thin leaf stalk before taking the hull."""
    if not obj.get("convex"):
        return a
    from skimage.morphology import convex_hull_image

    m = ndimage.binary_fill_holes(ndimage.binary_opening(a > 0.5, iterations=obj.get("open", 2)))
    lab, n = ndimage.label(m)
    if n > 1:
        m = lab == 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
    m = convex_hull_image(m)
    return np.clip(ndimage.gaussian_filter(m.astype(np.float32), 0.9) * 1.6 - 0.3, 0, 1)


def finish(rgb: np.ndarray, a: np.ndarray, obj: dict) -> Image.Image:
    a = reshape(a, obj)
    a = ramp(a, 0.12, 0.88)  # firm up the soft rim a little
    ys, xs = np.nonzero(a > 0.02)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    pad = 6
    y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
    y1, x1 = min(a.shape[0], y1 + pad), min(a.shape[1], x1 + pad)
    a, rgb = a[y0:y1, x0:x1], rgb[y0:y1, x0:x1]
    im = Image.fromarray(np.dstack([(rgb * 255).round().astype(np.uint8), (a * 255).round().astype(np.uint8)]), "RGBA")
    angle = 0.0
    if obj.get("orient", "keep") != "keep":
        yy, xx = np.nonzero(a > 0.5)
        cov = np.cov(np.vstack([xx, yy]).astype(np.float64))
        vals, vecs = np.linalg.eigh(cov)
        vx, vy = vecs[:, int(np.argmax(vals))]
        angle = math.degrees(math.atan2(vy, vx))
        if obj["orient"] == "v":
            angle -= 90
        angle = (angle + 90) % 180 - 90  # smallest turn
    angle += obj.get("rot", 0)
    if angle:
        im = im.rotate(angle, resample=Image.BICUBIC, expand=True)
    if obj.get("flip"):
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    bbox = Image.fromarray((np.asarray(im)[..., 3] > 4).astype(np.uint8) * 255).getbbox()
    return bleed(im.crop((bbox[0] - 2, bbox[1] - 2, bbox[2] + 2, bbox[3] + 2)))


def bleed(im: Image.Image) -> Image.Image:
    """Copy the nearest opaque colour into every see-through pixel, so edges never
    carry the photo's backdrop (no white/black halo) and resizing stays clean."""
    arr = np.asarray(im).copy()
    core = arr[..., 3] >= 235
    if core.any():
        iy, ix = ndimage.distance_transform_edt(~core, return_distances=False, return_indices=True)
        arr[..., :3] = np.where(core[..., None], arr[..., :3], arr[iy, ix, :3])
    return Image.fromarray(arr, "RGBA")


def review(pieces: dict[str, Image.Image], title: str, cell: int = 200, cols: int = 8) -> Image.Image:
    """Each piece over cream and forest green (halo check), scaled to fill its cell."""
    rows = max(1, -(-len(pieces) // cols))
    band = 2 * cell + 18
    sheet = Image.new("RGB", (min(cols, max(1, len(pieces))) * cell, rows * band + 20), (40, 40, 40))
    d = ImageDraw.Draw(sheet)
    d.text((6, 4), title, fill=(255, 255, 255))
    for i, (name, p) in enumerate(pieces.items()):
        ox, oy = (i % cols) * cell, 20 + (i // cols) * band
        k = min((cell - 20) / p.width, (cell - 20) / p.height)
        t = p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS)
        for row, bg in enumerate((CREAM, FOREST)):
            tile = Image.new("RGB", (cell - 8, cell - 8), bg)
            tile.paste(t, ((tile.width - t.width) // 2, (tile.height - t.height) // 2), t)
            sheet.paste(tile, (ox + 4, oy + row * cell + 4))
        d.text((ox + 6, oy + 2 * cell + 2), f"{name} {p.width}x{p.height}", fill=(255, 255, 255))
    return sheet


def overlay(rgb: np.ndarray, labels: np.ndarray, n: int) -> Image.Image:
    palette = np.array([[0, 0, 0], [255, 60, 60], [60, 200, 255], [255, 210, 0], [180, 90, 255], [0, 230, 120], [255, 120, 0], [255, 0, 200], [120, 255, 255], [200, 255, 60]], np.float32) / 255
    col = np.zeros_like(rgb)
    for k in range(1, n + 1):
        col[labels == k] = palette[1 + (k - 1) % 9]
    col[labels == n + 1] = (0.45, 0.45, 0.45)
    edge = ndimage.morphological_gradient(labels, size=3) > 0
    out = np.where((labels > 0)[..., None], rgb * 0.55 + col * 0.45, rgb * 0.35)
    out[edge] = 1
    im = Image.fromarray((out * 255).astype(np.uint8))
    im.thumbnail((1100, 1100))
    return im


def main(spec_file: Path, photos: Path, cache: Path, out: Path, only: str | None) -> None:
    specs = json.loads(spec_file.read_text())
    out.mkdir(parents=True, exist_ok=True)
    (cache / "_review").mkdir(parents=True, exist_ok=True)
    for stem, spec in specs.items():
        if stem.startswith("$") or (only and not stem.startswith(only)):
            continue
        photo = next(photos.glob(f"{stem}.*"))
        rgb = np.asarray(flat(photo)).astype(np.float32) / 255
        alpha = foreground(photo, cache)
        objects = spec.get("objects", {})
        names, labels = segment(rgb, alpha, spec) if any("seed" in o for o in objects.values()) else ([], None)
        pieces = {}
        for name, obj in objects.items():
            if "seed" in obj:
                k = names.index(name) + 1
                theirs = (labels > 0) & (labels != k)
                a = isolate(alpha, labels == k, theirs)
                if obj.get("mirror"):
                    win = ndimage.find_objects((ndimage.binary_dilation(a > 0.02, iterations=60)).astype(int))[0]
                    a_w, rgb_w = mirror_fill(rgb[win], a[win], theirs[win])
                    pieces[name] = finish(rgb_w, a_w, obj)
                    pieces[name].save(out / f"{name}.png")
                    continue
            else:
                x0, y0, x1, y1 = obj["box"]
                a = np.zeros_like(alpha)
                a[y0:y1, x0:x1] = alpha[y0:y1, x0:x1]
                a = isolate(a, ndimage.binary_dilation(a > 0.5, iterations=1), np.zeros_like(a, bool))
            pieces[name] = finish(rgb, a, obj)
            pieces[name].save(out / f"{name}.png")
        review(pieces, stem).save(cache / "_review" / f"{stem}.jpg", quality=88)
        if labels is not None:
            overlay(rgb, labels, len(names)).save(cache / "_review" / f"{stem}-labels.jpg", quality=85)
        print(f"{stem:26} {len(pieces)} pieces: {', '.join(f'{k} {v.width}x{v.height}' for k, v in pieces.items())}")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4]), sys.argv[5] if len(sys.argv) > 5 else None)
