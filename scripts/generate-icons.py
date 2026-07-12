#!/usr/bin/env python3
"""Generate Chrome extension icons from extension/public/icons/source.png."""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "extension" / "public" / "icons"
SOURCE = ICON_DIR / "source.png"
SIZES = (16, 48, 128)
PADDING_RATIO = 0.04


def is_background_pixel(r: int, g: int, b: int, tolerance: int = 32) -> bool:
    """Match checkerboard / flat light-gray and white backdrop pixels."""
    if max(r, g, b) - min(r, g, b) > 18:
        return False
    return min(r, g, b) >= 190


def remove_checkerboard(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    visited = [[False] * width for _ in range(height)]
    queue: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if visited[y][x]:
            return
        r, g, b, _ = pixels[x, y]
        if is_background_pixel(r, g, b):
            visited[y][x] = True
            queue.append((x, y))

    for x in range(width):
        try_seed(x, 0)
        try_seed(x, height - 1)
    for y in range(height):
        try_seed(0, y)
        try_seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx]:
                r, g, b, _ = pixels[nx, ny]
                if is_background_pixel(r, g, b):
                    visited[ny][nx] = True
                    queue.append((nx, ny))

    return rgba


def trim_and_square(image: Image.Image, padding_ratio: float = PADDING_RATIO) -> Image.Image:
    bbox = image.getbbox()
    if not bbox:
        return image

    cropped = image.crop(bbox)
    width, height = cropped.size
    side = max(width, height)
    pad = max(1, int(side * padding_ratio))
    canvas_side = side + pad * 2
    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    offset = ((canvas_side - width) // 2, (canvas_side - height) // 2)
    canvas.paste(cropped, offset, cropped)
    return canvas


def prepare_base(source: Path) -> Image.Image:
    if not source.exists():
        raise FileNotFoundError(f"Missing source icon: {source}")
    image = Image.open(source)
    return trim_and_square(remove_checkerboard(image))


def write_icons(source: Path, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    base = prepare_base(source)

    for size in SIZES:
        resized = base.resize((size, size), Image.Resampling.LANCZOS)
        target = out_dir / f"icon-{size}.png"
        resized.save(target, format="PNG", optimize=True)
        print(f"Wrote {target}")


def main() -> int:
    try:
        write_icons(SOURCE, ICON_DIR)
    except Exception as exc:  # noqa: BLE001
        print(f"generate-icons failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
