# Design System Specification: 000-Mission-Control

## 1. Themes
- **Cyber (Default)**: Dark slate base (`#070a0f`), cyan (`#00f0ff`), neon green (`#00ff9d`), amber accents (`#ffb000`), alert red (`#ff3366`).
- **Matrix**: Deep black base (`#000000`), matrix phosphor green (`#00ff41`), dim green (`#003b00`).
- **Amber**: CRT terminal monochrome amber (`#ffb000`), dark amber background (`#0c0800`).
- **Mono**: High-contrast monochrome technical grayscale.

## 2. Density Modes
- **Standard**: Padding 8px-12px, font size 12px-13px.
- **Nano**: Padding 3px-6px, font size 9.5px-11px, compact table rows for NOC screens.

## 3. Typography
- Monospace stack: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`.
- Technical uppercase headers with micro-badges and status indicators.

## 4. Grid System
- Columns: 1, 2, 3, 4 column responsive CSS grid (`.grid-cols-1`, `.grid-cols-2`, `.grid-cols-3`, `.grid-cols-4`).
- Layout styles:
  - `grid`: Standard multi-card tile layout.
  - `master`: Top split master workbench with secondary row.
  - `rows`: Full-width stacked linear strips.
