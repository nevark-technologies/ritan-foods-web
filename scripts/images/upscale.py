"""2x super-resolution for product cut-outs (Real-ESRGAN x2plus, CPU).

Usage:
  python -I scripts/images/upscale.py <weights.pth> <in_dir> <out_dir> [--web <web_dir>]

RGB goes through the network; the alpha matte is upscaled with Lanczos and
lightly sharpened, then recombined. Writes <out_dir>/<name>.png (master) and,
with --web, <web_dir>/<name>.webp (quality 90, alpha kept).
"""

from __future__ import annotations

import argparse
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image, ImageFilter

torch.set_grad_enabled(False)


class ResidualDenseBlock(nn.Module):
    def __init__(self, nf: int = 64, gc: int = 32):
        super().__init__()
        self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1)
        self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
        self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
        self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, inplace=True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class RRDB(nn.Module):
    def __init__(self, nf: int, gc: int = 32):
        super().__init__()
        self.rdb1 = ResidualDenseBlock(nf, gc)
        self.rdb2 = ResidualDenseBlock(nf, gc)
        self.rdb3 = ResidualDenseBlock(nf, gc)

    def forward(self, x):
        out = self.rdb3(self.rdb2(self.rdb1(x)))
        return out * 0.2 + x


def pixel_unshuffle(x, scale):
    b, c, hh, hw = x.size()
    h, w = hh // scale, hw // scale
    x = x.view(b, c, h, scale, w, scale)
    return x.permute(0, 1, 3, 5, 2, 4).reshape(b, c * scale * scale, h, w)


class RRDBNet(nn.Module):
    def __init__(self, scale: int = 2, nf: int = 64, nb: int = 23, gc: int = 32):
        super().__init__()
        self.scale = scale
        in_ch = 3 * (4 if scale == 2 else 1)
        self.conv_first = nn.Conv2d(in_ch, nf, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(nf, gc) for _ in range(nb)])
        self.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_last = nn.Conv2d(nf, 3, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, inplace=True)

    def forward(self, x):
        feat = pixel_unshuffle(x, 2) if self.scale == 2 else x
        feat = self.conv_first(feat)
        feat = feat + self.conv_body(self.body(feat))
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode="nearest")))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode="nearest")))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))


def upscale_rgb(model: RRDBNet, rgb: np.ndarray, tile: int = 192, pad: int = 12) -> np.ndarray:
    """Tiled inference so memory stays flat on CPU."""
    h, w, _ = rgb.shape
    # x2 model needs even dims
    ph, pw = h % 2, w % 2
    img = np.pad(rgb, ((0, ph), (0, pw), (0, 0)), mode="reflect")
    t = torch.from_numpy(img.astype(np.float32) / 255.0).permute(2, 0, 1).unsqueeze(0)
    H, W = t.shape[2:]
    out = torch.zeros((1, 3, H * 2, W * 2))
    for y in range(0, H, tile):
        for x in range(0, W, tile):
            y0, x0 = max(y - pad, 0), max(x - pad, 0)
            y1, x1 = min(y + tile + pad, H), min(x + tile + pad, W)
            # keep tile dims even
            if (y1 - y0) % 2:
                y1 = y1 - 1 if y1 == H else y1 + 1
            if (x1 - x0) % 2:
                x1 = x1 - 1 if x1 == W else x1 + 1
            patch = t[:, :, y0:y1, x0:x1]
            res = model(patch)
            oy, ox = (y - y0) * 2, (x - x0) * 2
            th, tw = min(tile, H - y) * 2, min(tile, W - x) * 2
            out[:, :, y * 2:y * 2 + th, x * 2:x * 2 + tw] = res[:, :, oy:oy + th, ox:ox + tw]
    arr = (out.squeeze(0).permute(1, 2, 0).clamp(0, 1).numpy() * 255.0).round().astype(np.uint8)
    return arr[: h * 2, : w * 2]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("weights")
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--web")
    ap.add_argument("--only", nargs="*")
    args = ap.parse_args()

    torch.set_num_threads(max(1, torch.get_num_threads()))
    state = torch.load(args.weights, map_location="cpu", weights_only=True)
    state = state.get("params_ema", state.get("params", state))
    model = RRDBNet(scale=2)
    model.load_state_dict(state, strict=True)
    model.eval()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    web = Path(args.web) if args.web else None
    if web:
        web.mkdir(parents=True, exist_ok=True)

    for path in sorted(Path(args.src).glob("*.png")):
        if args.only and path.stem not in args.only:
            continue
        started = time.time()
        im = Image.open(path).convert("RGBA")
        rgb = np.array(im.convert("RGB"))
        alpha = im.getchannel("A")
        up = upscale_rgb(model, rgb)
        a2 = alpha.resize((up.shape[1], up.shape[0]), Image.Resampling.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        result = Image.fromarray(up, "RGB")
        result.putalpha(a2)
        result.save(out / f"{path.stem}.png", optimize=True)
        if web:
            result.save(web / f"{path.stem}.webp", "WEBP", quality=90, method=6, alpha_quality=95)
        print(f"ok {path.stem} {im.size} -> {result.size} in {time.time() - started:.0f}s", flush=True)


if __name__ == "__main__":
    main()
