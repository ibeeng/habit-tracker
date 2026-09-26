#!/usr/bin/env python3
"""Generate Android launcher icons + splash for Rootine (lucide "Sprout", ISC).

Renders the same SVG source as scripts/make-icons.py via Inkscape into
android/app/src/main/res/**.

Usage: python3 scripts/make-android-icons.py
"""
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

BG = "#0a0f0a"  # terminal background
FG = "#33ff66"  # terminal green

SPROUT_PATHS = [
    "M7 20h10",
    "M10 20c5.5-2.5.8-6.4 3-10",
    "M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z",
    "M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z",
]

# density bucket -> legacy icon size / adaptive foreground size
BUCKETS = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}


def build_svg(size: int, content_frac: float, *, rounded: bool) -> str:
    content = size * content_frac
    scale = content / 24
    offset = (size - content) / 2
    radius = 0 if not rounded else max(8, size // 8)
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


def render(svg: str, out_path: str, size: int) -> None:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False, encoding="utf-8") as f:
        f.write(svg)
        svg_path = f.name
    try:
        subprocess.run(
            ["inkscape", svg_path, f"--export-filename={out_path}",
             f"--export-width={size}", f"--export-height={size}"],
            check=True, capture_output=True,
        )
    finally:
        os.unlink(svg_path)
    print(f"wrote {os.path.relpath(out_path, ROOT)} ({size}x{size})")


# legacy launcher icons + adaptive foreground
for bucket, (legacy, fg) in BUCKETS.items():
    mip = os.path.join(RES, f"mipmap-{bucket}")
    render(build_svg(legacy, 0.6, rounded=True), os.path.join(mip, "ic_launcher.png"), legacy)
    render(build_svg(legacy, 0.6, rounded=False), os.path.join(mip, "ic_launcher_round.png"), legacy)
    # adaptive foreground: glyph lives in the middle 2/3 safe zone
    render(build_svg(fg, 0.42, rounded=False), os.path.join(mip, "ic_launcher_foreground.png"), fg)

# adaptive icon background colour
bg_xml = os.path.join(RES, "values", "ic_launcher_background.xml")
with open(bg_xml, "w", encoding="utf-8") as f:
    f.write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        f'<resources>\n    <color name="ic_launcher_background">{BG}</color>\n</resources>\n'
    )
print(f"wrote {os.path.relpath(bg_xml, ROOT)}")

# splash screens: dark canvas + mark, portrait + landscape per density bucket
SPLASH = {
    "port-mdpi": (320, 480),
    "port-hdpi": (480, 800),
    "port-xhdpi": (720, 1280),
    "port-xxhdpi": (960, 1600),
    "port-xxxhdpi": (1280, 1920),
    "land-mdpi": (480, 320),
    "land-hdpi": (800, 480),
    "land-xhdpi": (1280, 720),
    "land-xxhdpi": (1600, 960),
    "land-xxxhdpi": (1920, 1280),
}


def build_splash_svg(w: int, h: int) -> str:
    mark = min(w, h) * 0.22
    scale = mark / 24
    paths = "\n    ".join(f'<path d="{d}"/>' for d in SPROUT_PATHS)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <rect width="{w}" height="{h}" fill="{BG}"/>
  <g transform="translate({(w - mark) / 2},{(h - mark) / 2 - h * 0.03}) scale({scale})"
     fill="none" stroke="{FG}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    {paths}
  </g>
</svg>
"""


def render_raw(svg: str, out_path: str, w: int, h: int) -> None:
    """render a non-square svg at an explicit size"""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False, encoding="utf-8") as f:
        f.write(svg)
        svg_path = f.name
    try:
        subprocess.run(
            ["inkscape", svg_path, f"--export-filename={out_path}",
             f"--export-width={w}", f"--export-height={h}"],
            check=True, capture_output=True,
        )
    finally:
        os.unlink(svg_path)
    print(f"wrote {os.path.relpath(out_path, ROOT)} ({w}x{h})")


for name, (w, h) in SPLASH.items():
    render_raw(build_splash_svg(w, h), os.path.join(RES, f"drawable-{name}", "splash.png"), w, h)

# fallback splash for tablets / odd densities
render_raw(build_splash_svg(480, 320), os.path.join(RES, "drawable", "splash.png"), 480, 320)
print("done")
