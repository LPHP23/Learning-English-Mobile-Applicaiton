#!/usr/bin/env python3
"""Tạo icon/splash mặc định cho Expo (chạy: python3 scripts/create-assets.py)"""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
GREEN = (74, 222, 128)  # #4ADE80
DARK = (15, 15, 15)  # #0F0F0F


def png_bytes(width: int, height: int, rgb: tuple[int, int, int]) -> bytes:
    raw = b""
    row = bytes([0] + list(rgb) * width)
    for _ in range(height):
        raw += row

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    files = {
        "icon.png": (1024, 1024, GREEN),
        "adaptive-icon.png": (1024, 1024, GREEN),
        "splash.png": (1284, 2778, DARK),
        "notification-icon.png": (96, 96, GREEN),
    }
    for name, (w, h, color) in files.items():
        path = ASSETS / name
        path.write_bytes(png_bytes(w, h, color))
        print(f"Created {path}")
    print("Done. Assets ready for Expo.")


if __name__ == "__main__":
    main()
