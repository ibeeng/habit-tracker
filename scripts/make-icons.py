#!/usr/bin/env python3
"""Generate PWA icons for Rootine — lucide "Sprout" (ISC license, open source).

Renders an SVG (dark rounded bg + green stroke glyph) to PNG via Inkscape.
Usage: python3 scripts/make-icons.py
"""
import os
import subprocess
import tempfile

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public")
os.makedirs(OUT, exist_ok=True)

BG = "#0a0f0a"  # dark terminal background
FG = "#33ff66"  # terminal green

# lucide v0.460.0 "Sprout" — https://lucide.dev (ISC)
SPROUT_PATHS = [
    "M7 20h10",
    "M10 20c5.5-2.5.8-6.4 3-10",
    "M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z",
    "M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z",
]


def build_svg(size: int, *, maskable: bool = False, rounded: bool = True) -> str:
    # glyph box as fraction of canvas (maskable needs a larger safe-zone margin)
    content_frac = 0.52 if maskable else 0.64
    content = size * content_frac
    scale = content / 24
    offset = (size - content) / 2
    radius = 0 if maskable or not rounded else max(8, size // 8)
    paths = "\n    ".join(f'<path d="{d}"/>' for d in SPROUT_PATHS)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <rect width="{size}" height="{size}" rx="{radius}" fill="{BG}"/>
  <g transform="translate({offset},{offset}) scale({scale})" fill="none" stroke="{FG}"
     stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    {paths}
  </g>
</svg>
"""


def make_icon(size: int, filename: str, *, maskable: bool = False, rounded: bool = True):
    svg_path = None
    out_path = os.path.join(OUT, filename)
    try:
        with tempfile.NamedTemporaryFile(
            "w", suffix=".svg", delete=False, encoding="utf-8"
        ) as f:
            f.write(build_svg(size, maskable=maskable, rounded=rounded))
            svg_path = f.name
        subprocess.run(
            [
                "inkscape",
                svg_path,
                f"--export-filename={out_path}",
                f"--export-width={size}",
                f"--export-height={size}",
            ],
            check=True,
            capture_output=True,
        )
    finally:
        if svg_path and os.path.exists(svg_path):
            os.unlink(svg_path)
    print(f"wrote {out_path} ({size}x{size})")


make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
make_icon(512, "icon-maskable-512.png", maskable=True, rounded=False)
make_icon(180, "apple-touch-icon.png", rounded=False)
make_icon(64, "icon-64.png")
print("done")
