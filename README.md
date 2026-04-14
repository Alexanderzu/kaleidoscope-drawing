# 🔮 Kaleidoscope Drawing

A browser-based kaleidoscope drawing app. Draw once — watch it bloom into a symmetric pattern. No install, no backend, no dependencies.

![Kaleidoscope Drawing](https://raw.githubusercontent.com/Alexanderzu/kaleidoscope-drawing/main/preview.png)

## ✨ Features

### Symmetry
- **2 to 24-fold** radial symmetry (2, 3, 4, 6, 8, 12, 16, 24 segments)
- **Mirror mode** — reflects each segment across its axis

### Drawing Tools
| Tool | Description |
|------|-------------|
| Pen | Smooth freehand line |
| Brush | Soft round brush with opacity falloff |
| Marker | Flat opaque stroke |
| Spray | Particle spray effect |
| Eraser | Erases to background |
| Dot | Single stamp on click |

### Brush Patterns
12 pattern shapes for the brush tip: **Round, Square, Diamond, Star, Triangle, Cross, Ring, Scatter, Line, Leaf, Zigzag, Wave**

### Effects
- 🌈 **Rainbow** — hue shifts automatically along the stroke
- ✦ **Glow** — neon glow matching the stroke color
- ✧ **Sparkle** — glitter particles scattered around strokes

### Canvas
- **Background color** — color picker + 6 presets (White, Black, Dark, Midnight, Navy, Purple)
- **Segment guides** — faint lines showing symmetry axes
- **Center crosshair** — marks the drawing origin
- **Undo / Redo** — up to 50 steps
- **Save PNG** — exports the full canvas

### Responsive
- Desktop: sidebar + bottom bar layout
- Mobile: full-screen canvas with a bottom sheet drawer (Tools / Pattern / Color / Settings tabs)

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `B` | Pen tool |
| `E` | Eraser |
| `R` | Toggle Rainbow |
| `G` | Toggle segment guides |
| `C` | Toggle center guide |
| `[` / `]` | Decrease / Increase brush size |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save PNG |

## 🚀 Usage

No build step required. Just open `index.html` in any modern browser:

```bash
git clone https://github.com/Alexanderzu/kaleidoscope-drawing.git
cd kaleidoscope-drawing
open index.html
```

Or serve locally:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## 🗂 Project Structure

```
kaleidoscope-drawing/
├── index.html   — layout and UI
├── style.css    — all styles, CSS variables, mobile layout
└── app.js       — drawing engine, symmetry, tools, history, UI logic
```

## 🛠 Tech Stack

- Vanilla JavaScript (ES6+)
- HTML5 Canvas (2D context)
- CSS3 with custom properties
- Zero dependencies, zero build tools

## License

MIT
