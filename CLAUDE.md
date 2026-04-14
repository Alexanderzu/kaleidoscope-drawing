# Kaleidoscope Drawing Online — Project Spec

## Goal
Single-page web app for kaleidoscope drawing. White background default (user-changeable). No backend. Pure HTML/CSS/JS (vanilla, no frameworks). One HTML file + one JS file + one CSS file.

## Stack
- Vanilla JS (ES6+)
- HTML5 Canvas (2D context)
- CSS3
- No build tools, no npm, no frameworks
- Deployable by opening index.html in browser

## Core Mechanics

### Symmetry Engine
- Radial symmetry: 2, 3, 4, 5, 6, 8, 10, 12, 16, 24-fold
- Mirror reflection toggle (reflects each segment across its axis)
- Center origin: canvas center
- Drawing one stroke → replicated N times around center
- Each segment rotated by (360 / N) degrees

### Drawing Tools
- **Pen** — smooth freehand line (catmull-rom spline interpolation for smoothness)
- **Brush** — soft round brush with opacity falloff
- **Marker** — flat opaque stroke
- **Spray** — particle spray effect
- **Eraser** — erases to current background color
- **Dot** — single point on click

### Brush Patterns
Pattern defines the shape/texture of each drawn point. Applied per-segment in symmetry engine.
- **Round** — default circle
- **Square** — flat square tip
- **Diamond** — rotated square
- **Star** — 5-point star shape
- **Triangle** — equilateral triangle
- **Cross** — plus/cross shape
- **Ring** — hollow circle (stroke only)
- **Scatter** — random small dots cluster around cursor
- **Line** — short directional line segment tangent to stroke
- **Leaf** — teardrop/petal shape
- **Zigzag** — serrated stroke edge
- **Wave** — sinusoidal stroke edge
- UI: pattern picker grid in sidebar (icon previews, 3×4 or 4×4 grid)

### Brush Properties
- Size: 1–200px slider
- Opacity: 1–100% slider
- Color: full color picker (hue/saturation/lightness wheel or spectrum)
- Recent colors palette (last 10 used)
- Predefined color swatches row

### Visual Effects (optional toggles)
- **Rainbow mode** — hue shifts along stroke path automatically
- **Glow** — applies shadow blur matching stroke color
- **Fade** — stroke opacity decreases over time after drawing (animated)
- **Sparkle** — random glitter dots scattered around stroke

### Canvas
- Responsive: fills viewport, recalculates on resize
- Background color: user-selectable via color picker (default white #ffffff)
- Background presets: White, Black, Dark Gray, Midnight Blue, Deep Purple, Custom
- Background color stored in state, applied on clear/init (not baked into strokes — eraser uses bg color)
- Center guide crosshair (toggleable, not drawn into canvas)
- Segment guide lines (toggleable, not drawn into canvas)
- Zoom: scroll wheel or pinch (1x–5x), pan with middle mouse / space+drag

### Undo / Redo
- History stack: up to 50 steps
- Ctrl+Z / Ctrl+Y
- Stored as ImageData snapshots (simple, performant enough for canvas)

### Save / Export
- Save PNG — full resolution canvas download
- Save SVG — if technically feasible (stretch goal)
- Clear canvas button (with confirmation)
- Copy to clipboard (navigator.clipboard)

### UI / Layout

#### Desktop (≥768px)
- Left sidebar: tools panel + pattern picker (icons + tooltips)
- Bottom bar: brush size, opacity sliders + color picker + background color picker
- Top bar: symmetry selector, effect toggles, undo/redo, save, clear
- Keyboard shortcuts shown in tooltips

#### Mobile / Tablet (<768px)
- Canvas fills full screen
- Bottom sheet drawer (slides up): all controls in scrollable panel
  - Tabs: Tools | Patterns | Color | Settings
  - Tools tab: tool icons grid, brush size/opacity sliders
  - Patterns tab: pattern picker grid
  - Color tab: stroke color picker + background color picker + swatches
  - Settings tab: symmetry selector, effects toggles, guides toggles
- Top floating bar: undo, redo, save PNG, clear (4 icon buttons, semi-transparent)
- Drawer toggle button: bottom-center pill button
- Touch drawing: pointer events API (works for both touch and mouse)
- No hover states on mobile — all active/selected states via tap
- Pinch to zoom, two-finger pan
- Bottom sheet does NOT overlap canvas while closed (only toggle button visible)

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `[` / `]` | Decrease / increase brush size |
| `B` | Pen tool |
| `E` | Eraser |
| `Z` (Ctrl) | Undo |
| `Y` (Ctrl) | Redo |
| `S` (Ctrl) | Save PNG |
| `G` | Toggle segment guides |
| `C` | Toggle center guide |
| `R` | Toggle rainbow mode |
| `Space` | Pan mode while held |
| `0` | Reset zoom/pan |

## Architecture

### Files
```
index.html       — layout, UI skeleton
style.css        — all styles, CSS variables for theming
app.js           — all logic (modular sections, not split into files)
```

### app.js Sections (comment-delimited)
1. `// === STATE ===` — single state object (includes bgColor, pattern, breakpoint)
2. `// === CANVAS SETUP ===` — init, resize handler, bg fill
3. `// === SYMMETRY ENGINE ===` — transform math, draw replication
4. `// === TOOLS ===` — each tool draw function
5. `// === PATTERNS ===` — pattern shape renderers (one function per pattern)
6. `// === EFFECTS ===` — glow, rainbow, sparkle, fade
7. `// === HISTORY ===` — undo/redo
8. `// === UI ===` — event listeners, sliders, color pickers, bg picker
9. `// === MOBILE ===` — bottom sheet, drawer tabs, touch handling
10. `// === EXPORT ===` — PNG save, clipboard
11. `// === INIT ===` — bootstrap call

## Design Spec
- Canvas background: user-chosen (default white #ffffff)
- UI: dark theme panels (#1a1a1a bg, #2a2a2a panels, #3a3a3a borders)
- Accent: subtle blue (#4a9eff) for active states
- Font: system-ui / -apple-system
- Desktop: left panel 56px icon-only, expands to 200px on hover (optional)
- Mobile: bottom sheet 0px closed (only pill toggle), 60vh open; tabs inside
- No modal dialogs — everything inline
- Smooth 60fps drawing, use requestAnimationFrame loop only for animated effects
- Touch targets min 44×44px on mobile (all buttons, sliders, swatches)
- Pattern picker: icons drawn with Canvas 2D into small `<canvas>` elements (no SVG files)

## Performance Rules
- Never store full history as path data — use ImageData snapshots
- Draw directly to canvas on mousemove (no offscreen buffer needed for basic tools)
- For symmetry: use canvas save/restore + translate/rotate per segment
- Avoid layout thrash in hot path (no DOM reads during mousemove)
- Pattern renderers: pre-render each pattern to an offscreen canvas once on init, reuse as stamp
- Mobile: use `passive: true` on touchstart/touchmove listeners to avoid scroll jank

## What NOT to include
- No login, accounts, sharing, cloud
- No social features
- No ads, analytics, tracking
- No external CDN dependencies (fully self-contained)
- No dark/light mode toggle for UI (dark UI panels is fixed; canvas bg is user-controlled separately)

## Stretch Goals (implement only if core is solid)
- Animated playback of drawing session
- Tiling mode (canvas wraps into seamless tile)
- Custom pattern upload (user uploads image, used as brush stamp)
- Gradient stroke (color transitions from colorA to colorB along stroke)
- Share as URL (encode small canvas snapshot as data URI in URL hash)
