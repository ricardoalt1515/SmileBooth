"""
Demo assets helper
- Generates a small set of demo photos on disk so preview-strip can work
  without requiring user gallery files.
"""
from pathlib import Path
from typing import Iterable
from PIL import Image, ImageDraw, ImageFont

from app.config import DATA_DIR


DEMO_DIR = DATA_DIR / "demo"
DEMO_FILES = [
    ("demo1.jpg", (240, 90, 90)),
    ("demo2.jpg", (90, 140, 240)),
    ("demo3.jpg", (90, 190, 120)),
    ("demo4.jpg", (200, 140, 40)),
]


def _create_demo_image(path: Path, color: tuple[int, int, int], label: str) -> None:
    """Create a 4:3 demo image with a simple label."""
    width, height = 1200, 900  # 4:3 ratio
    img = Image.new("RGB", (width, height), color=color)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("Arial.ttf", 120)
    except Exception:
        font = ImageFont.load_default()

    text = f"Demo {label}"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    position = ((width - text_width) / 2, (height - text_height) / 2)
    draw.text(position, text, fill=(255, 255, 255), font=font)

    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="JPEG", quality=90)


def ensure_demo_photos() -> Iterable[Path]:
    """
    Ensure demo photos exist on disk and return their paths.
    """
    created_paths: list[Path] = []
    DEMO_DIR.mkdir(parents=True, exist_ok=True)

    for idx, (filename, color) in enumerate(DEMO_FILES, start=1):
        file_path = DEMO_DIR / filename
        if not file_path.exists():
            _create_demo_image(file_path, color, str(idx))
        created_paths.append(file_path)

    return created_paths
