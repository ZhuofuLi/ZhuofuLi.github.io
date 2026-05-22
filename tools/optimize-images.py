#!/usr/bin/env python3
"""Optimize site imagery and generate favicon / Open Graph assets.

Run from the repository root:

    python3 tools/optimize-images.py

Reads the original photos from ``images/`` and writes web-optimized,
responsive WebP + JPEG variants into ``assets/img/``. It then draws the
favicon PNGs and a 1200x630 Open Graph share image. Re-running requires the
original full-resolution photos to be present in ``images/``.

Requires Pillow (``pip install Pillow``).
"""
from __future__ import annotations

import glob
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "images"
OUT = ROOT / "assets" / "img"

# Brand colors (kept in sync with the --color-* tokens in assets/css/styles.css).
VOID = (5, 6, 13)
STELLAR = (110, 168, 255)
NEBULA = (179, 136, 255)
STARLIGHT = (244, 246, 255)

# (source filename, output stem, [responsive widths in px])
PHOTOS = [
    ("profile.jpg", "profile", [480, 960]),
    ("M16.jpeg", "m16", [800, 1600]),
    ("M31.jpeg", "m31", [800, 1600]),
    ("M42.jpeg", "m42", [800, 1600]),
    ("Rosette.jpeg", "rosette", [800, 1600]),
]


def load(src_name: str) -> Image.Image:
    """Open a source photo, apply EXIF orientation, drop metadata."""
    img = Image.open(SRC / src_name)
    img = ImageOps.exif_transpose(img)  # bake rotation in, then discard EXIF
    return img.convert("RGB")


def find_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Locate a usable system sans-serif, falling back to Pillow's default."""
    preferred = ["DejaVuSans", "LiberationSans", "FreeSans", "NotoSans", "Arial"]
    candidates: list[str] = []
    for root in ("/usr/share/fonts", "/usr/local/share/fonts", str(Path.home() / ".fonts")):
        candidates += glob.glob(f"{root}/**/*.ttf", recursive=True)
        candidates += glob.glob(f"{root}/**/*.otf", recursive=True)
    for family in preferred:
        for path in candidates:
            stem = Path(path).stem.lower().replace("-", "").replace(" ", "")
            if family.lower() not in stem:
                continue
            if bold == ("bold" in stem):
                return ImageFont.truetype(path, size)
    if candidates:
        return ImageFont.truetype(candidates[0], size)
    return ImageFont.load_default(size)  # scalable default (Pillow >= 10.1)


def optimize_photos() -> None:
    """Write responsive WebP + JPEG variants of every source photo."""
    print("Optimizing photos -> assets/img/")
    total = 0
    for src_name, stem, widths in PHOTOS:
        if not (SRC / src_name).exists():
            print(f"  ! skipped {src_name} (not found)")
            continue
        original = load(src_name)
        ow, oh = original.size
        for w in widths:
            h = round(oh * w / ow)
            resized = original.resize((w, h), Image.LANCZOS)
            jpg = OUT / f"{stem}-{w}.jpg"
            webp = OUT / f"{stem}-{w}.webp"
            resized.save(jpg, "JPEG", quality=82, optimize=True, progressive=True)
            resized.save(webp, "WEBP", quality=80, method=6)
            total += jpg.stat().st_size + webp.stat().st_size
            print(f"  {stem}-{w}: {w}x{h}  jpg {jpg.stat().st_size // 1024}KB"
                  f"  webp {webp.stat().st_size // 1024}KB")
    print(f"  -> {total / 1024 / 1024:.2f} MB total\n")


def star_points(cx: float, cy: float, outer: float, inner: float) -> list[tuple[float, float]]:
    """Eight vertices of a sharp four-point star (sparkle)."""
    pts = []
    for i in range(8):
        radius = outer if i % 2 == 0 else inner
        angle = math.radians(i * 45 - 90)
        pts.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return pts


def draw_star(draw: ImageDraw.ImageDraw, cx, cy, outer, inner, fill) -> None:
    draw.polygon(star_points(cx, cy, outer, inner), fill=fill)


def make_favicon(size: int, path: Path) -> None:
    """Render a four-point-star monogram favicon at the given size."""
    scale = 4  # supersample for clean anti-aliasing
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded deep-space tile.
    draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.22, fill=VOID + (255,))

    # Soft glow behind the primary star.
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    draw_star(gdraw, s * 0.44, s * 0.44, s * 0.40, s * 0.09, STELLAR + (170,))
    glow = glow.filter(ImageFilter.GaussianBlur(s * 0.05))
    img.alpha_composite(glow)

    # Primary star + small companion star.
    draw_star(draw, s * 0.44, s * 0.44, s * 0.34, s * 0.075, STARLIGHT + (255,))
    draw_star(draw, s * 0.74, s * 0.72, s * 0.13, s * 0.03, NEBULA + (255,))

    img.resize((size, size), Image.LANCZOS).save(path)
    print(f"  {path.name}: {size}x{size}")


def tracked_text(draw, xy, text, font, fill, tracking=0) -> int:
    """Draw letter-spaced text; return the total advance width."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return int(x - xy[0])


def make_og_image() -> None:
    """Compose the 1200x630 social share image from a nebula photograph."""
    w, h = 1200, 630
    base = load("M42.jpeg") if (SRC / "M42.jpeg").exists() else None
    if base is None:
        canvas = Image.new("RGB", (w, h), VOID)
    else:
        # Center-crop to a 1200x630 aspect ratio, then resize.
        bw, bh = base.size
        target = w / h
        if bw / bh > target:
            cw = int(bh * target)
            base = base.crop(((bw - cw) // 2, 0, (bw - cw) // 2 + cw, bh))
        else:
            ch = int(bw / target)
            base = base.crop((0, (bh - ch) // 2, bw, (bh - ch) // 2 + ch))
        canvas = base.resize((w, h), Image.LANCZOS)

    # Darken for legibility: flat dim + a bottom-weighted gradient.
    canvas = Image.blend(canvas, Image.new("RGB", (w, h), VOID), 0.45)
    ramp = Image.new("L", (1, h))
    for y in range(h):
        ramp.putpixel((0, y), int(40 + 200 * (y / h) ** 1.6))
    shade = Image.new("RGBA", (w, h), VOID + (0,))
    shade.putalpha(ramp.resize((w, h)))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shade).convert("RGB")

    draw = ImageDraw.Draw(canvas)
    pad = 90
    eyebrow = find_font(24)
    name = find_font(78, bold=True)
    role = find_font(34)

    draw.line([(pad, 250), (pad, 470)], fill=STELLAR, width=4)  # accent rule
    tx = pad + 36
    tracked_text(draw, (tx, 256), "ASTROPHYSICS · ASTROBIOLOGY · DATA SCIENCE",
                 eyebrow, STELLAR, tracking=3)
    draw.text((tx, 300), "Zhuofu (Chester) Li", font=name, fill=STARLIGHT)
    draw.text((tx, 410), "Dual Ph.D. Candidate · University of Washington",
              font=role, fill=(199, 204, 224))

    # A scatter of accent stars in the upper area.
    for cx, cy, r in [(1010, 120, 18), (1080, 240, 9), (930, 90, 7), (1130, 150, 6)]:
        draw_star(draw, cx, cy, r, r * 0.22, STARLIGHT)

    canvas.save(OUT / "og-image.png")
    print(f"  og-image.png: {w}x{h}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    optimize_photos()
    print("Generating icons -> assets/img/")
    make_favicon(32, OUT / "favicon-32.png")
    make_favicon(180, OUT / "apple-touch-icon.png")
    make_favicon(192, OUT / "icon-192.png")
    make_favicon(512, OUT / "icon-512.png")
    make_og_image()
    print("\nDone.")


if __name__ == "__main__":
    main()
