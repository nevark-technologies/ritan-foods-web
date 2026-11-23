"""Cut editorial food details out of the scene photos and upscale them 2x.

Usage: python -I scripts/images/editorial.py <weights.pth> <refs_dir> <out_dir>
Crops are in the 1254px reference frame: (file, x0, y0, x1, y1).
"""

import sys
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from upscale import RRDBNet, upscale_rgb  # noqa: E402

CROPS = {
    "idlis": ("Idli Podi", 900, 600, 1254, 1060),
    "podi-bowl": ("Idli Podi", 0, 770, 430, 1100),
    "millet-bowl": ("Sprouted Millet Health Mix", 0, 720, 400, 1180),
    "curry-rice": ("Curry Leaf Rice Mix", 0, 540, 420, 880),
    "dosa": ("Curry Leaf Rice Mix", 900, 400, 1254, 800),
    "bananas": ("Nendrum Banana", 0, 380, 330, 1060),
    "abc-fruits": ("ABC Mix", 0, 560, 340, 1240),
    "garlic-chilli": ("Garlic Idli Podi", 0, 820, 340, 1210),
}


def main() -> None:
    weights, refs, out = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    out.mkdir(parents=True, exist_ok=True)
    state = torch.load(weights, map_location="cpu", weights_only=True)
    model = RRDBNet(scale=2)
    model.load_state_dict(state.get("params_ema", state), strict=True)
    model.eval()
    for name, (src, x0, y0, x1, y1) in CROPS.items():
        t = time.time()
        crop = np.array(Image.open(refs / f"{src}.jpeg").convert("RGB").crop((x0, y0, x1, y1)))
        up = Image.fromarray(upscale_rgb(model, crop), "RGB")
        up.save(out / f"{name}.webp", "WEBP", quality=88, method=6)
        print(f"ok {name} {up.size} {time.time() - t:.0f}s", flush=True)


if __name__ == "__main__":
    main()
