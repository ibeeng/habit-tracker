#!/usr/bin/env python3
"""Generate PWA icons for habit-tracker (terminal green on dark)."""
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public")
os.makedirs(OUT, exist_ok=True)

BG = (10, 15, 10)  # #0a0f0a
FG = (51, 255, 102)  # #33ff66
FG_DIM = (90, 138, 106)

FONT_PATHS = [
    "/home/waalidperfume/.local/share/fonts/fonts/ttf/JetBrainsMono-Bold.ttf",
    "/home/waalidperfume/.local/share/fonts/JetBrainsMonoNerdFontMono-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
]
FONT = next(p for p in FONT_PATHS if os.path.exists(p))


def make_icon(size: int, path: str, *, maskable: bool = False, rounded: bool = True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = 0 if maskable else max(8, size // 8)
    if maskable or rounded:
        # full-bleed background for maskable; rounded for normal
        if maskable:
            d.rectangle([0, 0, size, size], fill=BG)
        else:
            d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)
    else:
        d.rectangle([0, 0, size, size], fill=BG)

    # content safe zone for maskable: 80% centered
    content = int(size * (0.72 if maskable else 0.7))
    # draw [✓] using text
    text = "[✓]"
    font_size = int(content * 0.42)
    try:
        font = ImageFont.truetype(FONT, font_size)
    except Exception:
        font = ImageFont.load_default()

    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    d.text((x, y), text, font=font, fill=FG)

    # subtle prompt bar underneath for larger icons
    if size >= 192 and not maskable:
        bar_y = int(size * 0.72)
        bar_w = int(size * 0.36)
        bar_x = (size - bar_w) // 2
        d.rounded_rectangle(
            [bar_x, bar_y, bar_x + bar_w, bar_y + max(2, size // 64)],
            radius=size // 128,
            fill=FG_DIM,
        )

    img.save(path, "PNG")
    print(f"wrote {path} ({size}x{size})")


make_icon(192, os.path.join(OUT, "icon-192.png"))
make_icon(512, os.path.join(OUT, "icon-512.png"))
make_icon(512, os.path.join(OUT, "icon-maskable-512.png"), maskable=True, rounded=False)
make_icon(180, os.path.join(OUT, "apple-touch-icon.png"), rounded=False)
# favicon-ish extra
make_icon(64, os.path.join(OUT, "icon-64.png"))
print("done")
