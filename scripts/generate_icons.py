#!/usr/bin/env python3
import os
import struct
import zlib
import math

def create_png(width, height, pixel_generator):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = pixel_generator(x, y, width, height)
            raw_data.extend((r, g, b, a))

    def chunk(tag, data):
        c = tag + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    idat_data = zlib.compress(bytes(raw_data), 9)

    png = (
        b'\x89PNG\r\n\x1a\n' +
        chunk(b'IHDR', ihdr_data) +
        chunk(b'IDAT', idat_data) +
        chunk(b'IEND', b'')
    )
    return png

def cyber_pixel(x, y, w, h):
    # Normalized coords from -1 to 1
    nx = (x / (w - 1)) * 2 - 1
    ny = (y / (h - 1)) * 2 - 1
    dist = math.sqrt(nx*nx + ny*ny)
    
    # Hexagon distance
    q2_x = abs(nx)
    q2_y = abs(ny)
    hex_dist = max(q2_x * 0.866025 + q2_y * 0.5, q2_y)

    if hex_dist > 0.95:
        return (0, 0, 0, 0) # Transparent outside
    
    # Hex border glow
    if hex_dist > 0.82:
        # Neon cyan/green glowing border
        glow = (hex_dist - 0.82) / 0.13
        r = int(0 + 16 * glow)
        g = int(240 * (1 - 0.2*glow))
        b = int(200 + 55 * glow)
        a = int(255 * min(1.0, (0.95 - hex_dist) / 0.05 + 0.5))
        return (min(255, r), min(255, g), min(255, b), min(255, a))
    
    # Inner dark background
    bg_r = int(8 + (1 - dist) * 12)
    bg_g = int(14 + (1 - dist) * 22)
    bg_b = int(24 + (1 - dist) * 40)

    # Grid lines
    grid_x = abs(math.sin(nx * 10))
    grid_y = abs(math.sin(ny * 10))
    if (grid_x < 0.08 or grid_y < 0.08) and dist < 0.8:
        bg_r += 10
        bg_g += 25
        bg_b += 35

    # Center 000 or DEFCON symbol
    # 3 circles representing '000'
    c1 = math.hypot(nx + 0.45, ny)
    c2 = math.hypot(nx, ny)
    c3 = math.hypot(nx - 0.45, ny)

    in_ring = False
    for c in [c1, c2, c3]:
        if 0.12 <= c <= 0.22:
            in_ring = True
            break

    if in_ring:
        # Glowing neon cyan/amber
        return (0, 255, 204, 255)

    # Inner core dots
    for c in [c1, c2, c3]:
        if c < 0.06:
            return (16, 185, 129, 255) # Emerald core

    return (min(255, bg_r), min(255, bg_g), min(255, bg_b), 255)

def build_ico(png_dict):
    # png_dict = {size: png_bytes}
    count = len(png_dict)
    header = struct.pack('<HHH', 0, 1, count)
    
    offset = 6 + count * 16
    entries = bytearray()
    image_data = bytearray()
    
    for size, png_bytes in png_dict.items():
        w = size if size < 256 else 0
        h = size if size < 256 else 0
        length = len(png_bytes)
        entry = struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, length, offset)
        entries.extend(entry)
        image_data.extend(png_bytes)
        offset += length
        
    return header + bytes(entries) + bytes(image_data)

def main():
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'build-resources')
    os.makedirs(out_dir, exist_ok=True)
    
    sizes = [16, 32, 48, 64, 128, 256]
    pngs = {}
    
    print("Generating multi-resolution icon assets...")
    for s in sizes:
        png_data = create_png(s, s, cyber_pixel)
        pngs[s] = png_data
        if s == 256:
            with open(os.path.join(out_dir, 'icon.png'), 'wb') as f:
                f.write(png_data)
                
    # Also generate 512x512 icon.png for high-DPI
    png_512 = create_png(512, 512, cyber_pixel)
    with open(os.path.join(out_dir, 'icon.png'), 'wb') as f:
        f.write(png_512)
        
    ico_data = build_ico(pngs)
    ico_path = os.path.join(out_dir, 'icon.ico')
    with open(ico_path, 'wb') as f:
        f.write(ico_data)
        
    print(f"Generated {ico_path} ({len(ico_data)} bytes, {len(sizes)} resolutions)")
    print(f"Generated {os.path.join(out_dir, 'icon.png')} ({len(png_512)} bytes)")

if __name__ == '__main__':
    main()
