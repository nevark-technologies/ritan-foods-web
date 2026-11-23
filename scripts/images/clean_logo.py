"""Neutralise the baked-in checkerboard in the supplied logo.

The wordmark is styled as a sticker with a white outline; the checker sits in
its counters. Flattening those achromatic greys to white makes the counters
read as part of the sticker on any background. Only the wordmark band is
touched, and only near-neutral light pixels, so faces, leaves and gold stay.

Usage: python -I scripts/images/clean_logo.py <logo.png> <out_dir>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
logo = Image.open(src).convert("RGBA")
px = np.array(logo).astype(np.int16)
r, g, b, a = px[..., 0], px[..., 1], px[..., 2], px[..., 3]
mx = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)
h, w = mx.shape

band = np.zeros_like(mx, dtype=bool)
band[int(h * 0.50):int(h * 0.86), int(w * 0.12):int(w * 0.92)] = True
neutral = ((mx - mn) < 14) & (mx > 188) & (a > 180)
target = neutral & band
# soften: also catch anti-aliased checker pixels next to targets
target = ndimage.binary_dilation(target, iterations=1) & ((mx - mn) < 22) & (mx > 175) & band

out_px = px.copy()
out_px[target, 0] = 255
out_px[target, 1] = 255
out_px[target, 2] = 255
clean = Image.fromarray(out_px.clip(0, 255).astype(np.uint8), "RGBA")
clean = clean.crop(clean.getbbox())
clean.save(out / "logo-clean.png", optimize=True)
for name, colour in (("cream", (251, 247, 238)), ("forest", (15, 42, 23))):
    p = Image.new("RGB", clean.size, colour)
    p.paste(clean, mask=clean.getchannel("A"))
    p.save(out / f"logo-preview-{name}.jpg", quality=90)
print("flattened px", int(target.sum()), "size", clean.size)
