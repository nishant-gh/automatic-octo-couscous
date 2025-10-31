#!/usr/bin/env python3
"""
GuardianAI Icon Generator
Creates PNG icon files for the Chrome extension
"""

import struct
import zlib

def create_png(width, height, colors):
    """
    Create a simple PNG file with gradient shield design

    Args:
        width: Width in pixels
        height: Height in pixels
        colors: List of RGB tuples for gradient

    Returns:
        bytes: PNG file data
    """

    def write_chunk(chunk_type, data):
        """Write a PNG chunk"""
        chunk = chunk_type + data
        return (struct.pack('>I', len(data)) + chunk +
                struct.pack('>I', zlib.crc32(chunk) & 0xffffffff))

    # Create image data with gradient shield
    def get_pixel_color(x, y):
        """Calculate pixel color for shield design"""
        cx, cy = width // 2, height // 2

        # Shield shape (simplified)
        shield_width = width * 0.7
        shield_height = height * 0.8

        # Check if pixel is in shield bounds
        dx = abs(x - cx)
        dy = y - cy + height * 0.1

        if dx < shield_width / 2 and 0 < dy < shield_height:
            # Gradient based on vertical position
            ratio = dy / shield_height

            # Purple-blue gradient
            r = int(102 + (118 - 102) * ratio)
            g = int(126 + (75 - 126) * ratio)
            b = int(234 + (162 - 234) * ratio)
            a = 255

            # Add white checkmark in center
            check_y = cy + height * 0.05
            if (cy - height * 0.15 < y < cy + height * 0.15 and
                cx - width * 0.2 < x < cx + width * 0.2):
                # Simple checkmark approximation
                if ((x < cx and abs(y - check_y - (x - cx) * 0.5) < 2) or
                    (x >= cx and abs(y - check_y - (cx - x) * 0.5) < 2)):
                    return (255, 255, 255, 255)

            return (r, g, b, a)

        # Transparent background
        return (0, 0, 0, 0)

    # Build pixel data
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type
        for x in range(width):
            r, g, b, a = get_pixel_color(x, y)
            raw_data += struct.pack('BBBB', r, g, b, a)

    # Compress pixel data
    compressed = zlib.compress(raw_data, 9)

    # Build PNG file
    png = b'\x89PNG\r\n\x1a\n'  # PNG signature

    # IHDR chunk
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += write_chunk(b'IHDR', ihdr)

    # IDAT chunk
    png += write_chunk(b'IDAT', compressed)

    # IEND chunk
    png += write_chunk(b'IEND', b'')

    return png


def main():
    """Generate all required icon sizes"""
    import os

    # Create icons directory if it doesn't exist
    icons_dir = 'icons'
    os.makedirs(icons_dir, exist_ok=True)

    sizes = [16, 48, 128]
    colors = [(102, 126, 234), (118, 75, 162)]  # Purple-blue gradient

    print("🛡️ GuardianAI Icon Generator")
    print("=" * 50)

    for size in sizes:
        filename = f'{icons_dir}/icon{size}.png'
        print(f"Generating {filename}...")

        png_data = create_png(size, size, colors)

        with open(filename, 'wb') as f:
            f.write(png_data)

        file_size = len(png_data)
        print(f"  ✓ Created {filename} ({file_size} bytes)")

    print("=" * 50)
    print("✅ All icons generated successfully!")
    print("\nNext steps:")
    print("1. Reload the extension in Chrome (chrome://extensions/)")
    print("2. The extension should now load without errors")


if __name__ == '__main__':
    main()
