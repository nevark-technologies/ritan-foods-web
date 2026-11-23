"""Builds the self-hosted web fonts in src/app/fonts from assets-src/fonts.

Fraunces ships with four variation axes (opsz, wght, SOFT, WONK); the site
only ever uses opsz 144 + SOFT 100 (WONK 0 upright, 1 italic), so those axes
are pinned and only a trimmed weight axis remains — a fraction of the bytes.
The rupee sign lives in Google's latin-ext files, so it gets its own tiny
face (unicode-range U+20B9) instead of pulling in the whole latin-ext file.

Run with the tools venv:  python -I scripts/fonts/build_fonts.py
"""

from io import BytesIO
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets-src" / "fonts"
OUT = ROOT / "src" / "app" / "fonts"
RUPEE = 0x20B9


def build(source: str, target: str, axes: dict, unicodes=None) -> None:
    font = TTFont(SRC / source)
    if axes:
        font = instantiateVariableFont(font, axes, updateFontNames=False)
        # Round-trip so the subsetter sees fully materialised gvar data.
        buffer = BytesIO()
        font.save(buffer)
        buffer.seek(0)
        font = TTFont(buffer)
    options = Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.hinting = False
    options.desubroutinize = True
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = Subsetter(options)
    subsetter.populate(unicodes=unicodes if unicodes is not None else list(font.getBestCmap().keys()))
    subsetter.subset(font)
    font.flavor = "woff2"
    OUT.mkdir(parents=True, exist_ok=True)
    font.save(OUT / target)
    print(f"{target:32} {(OUT / target).stat().st_size / 1024:6.1f} KB  (from {(SRC / source).stat().st_size / 1024:.1f} KB)")


# "Core" = what the site's copy actually uses (ASCII + the typographic marks
# below); it is the only file preloaded. The rest of Google's latin set
# (accented letters etc.) becomes a separate face that only downloads if a
# page contains one of those characters.
CORE = set(range(0x20, 0x7F)) | {0xA0, 0xA9, 0xAE, 0xB0, 0xB7, 0xD7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x2122, 0x2212}


def cmap_of(source: str) -> set:
    return set(TTFont(SRC / source).getBestCmap().keys())


def ranges(codepoints: set) -> str:
    """CSS unicode-range for a set of code points (merging runs)."""
    out, run = [], []
    for cp in sorted(codepoints):
        if run and cp == run[-1] + 1:
            run.append(cp)
            continue
        if run:
            out.append(f"U+{run[0]:X}" if len(run) == 1 else f"U+{run[0]:X}-{run[-1]:X}")
        run = [cp]
    if run:
        out.append(f"U+{run[0]:X}" if len(run) == 1 else f"U+{run[0]:X}-{run[-1]:X}")
    return ", ".join(out)


FRAUNCES_WGHT = (300, 700)
UPRIGHT = {"opsz": 144, "SOFT": 100, "WONK": 0, "wght": FRAUNCES_WGHT}
ITALIC = {"opsz": 144, "SOFT": 100, "WONK": 1, "wght": FRAUNCES_WGHT}

for name, source, axes in [
    ("fraunces-normal", "fraunces-normal-latin.woff2", UPRIGHT),
    ("fraunces-italic", "fraunces-italic-latin.woff2", ITALIC),
    ("manrope", "manrope-latin.woff2", {}),
]:
    available = cmap_of(source)
    build(source, f"{name}.woff2", axes, sorted(available & CORE))
    build(source, f"{name}-rest.woff2", axes, sorted(available - CORE))
    print(f"  {name}-rest unicode-range: {ranges(available - CORE)}")

build("fraunces-normal-latinext.woff2", "fraunces-normal-rupee.woff2", UPRIGHT, [RUPEE])
build("fraunces-italic-latinext.woff2", "fraunces-italic-rupee.woff2", ITALIC, [RUPEE])
build("manrope-latinext.woff2", "manrope-rupee.woff2", {}, [RUPEE])
