'use strict';

// ═══════════════════════════════════════════
// === STATE ===
// ═══════════════════════════════════════════

const PATTERNS = [
  { id: 'round',    name: 'Round'    },
  { id: 'square',   name: 'Square'   },
  { id: 'diamond',  name: 'Diamond'  },
  { id: 'star',     name: 'Star'     },
  { id: 'triangle', name: 'Triangle' },
  { id: 'cross',    name: 'Cross'    },
  { id: 'ring',     name: 'Ring'     },
  { id: 'scatter',  name: 'Scatter'  },
  { id: 'line',     name: 'Line'     },
  { id: 'leaf',     name: 'Leaf'     },
  { id: 'zigzag',   name: 'Zigzag'   },
  { id: 'wave',     name: 'Wave'     },
];

const state = {
  tool:         'pen',
  pattern:      'round',
  segments:     6,
  mirror:       true,
  rainbow:      false,
  glow:         false,
  sparkle:      false,
  guideCenter:  true,
  guideSegs:    true,
  brushSize:    20,
  opacity:      100,
  color:        '#ff4466',
  bgColor:      '#ffffff',
  rainbowHue:   0,
  isDrawing:    false,
  lastDx:       0,
  lastDy:       0,
  history:      [],
  historyIndex: -1,
  recentColors: [],
  mouseX:       0,
  mouseY:       0,
};

// ═══════════════════════════════════════════
// === CANVAS SETUP ===
// ═══════════════════════════════════════════

const mainCanvas  = document.getElementById('main-canvas');
const guideCanvas = document.getElementById('guide-canvas');
const ctx  = mainCanvas.getContext('2d', { willReadFrequently: true });
const gctx = guideCanvas.getContext('2d');

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return;

  // Save drawing to temp (transparent — bg is in CSS)
  const tmp = document.createElement('canvas');
  tmp.width  = mainCanvas.width  || w;
  tmp.height = mainCanvas.height || h;
  tmp.getContext('2d').drawImage(mainCanvas, 0, 0);

  const prevW = mainCanvas.width;
  const prevH = mainCanvas.height;

  mainCanvas.width  = w;
  mainCanvas.height = h;
  guideCanvas.width  = w;
  guideCanvas.height = h;

  // Restore drawing centered (no bg fill — container CSS handles it)
  if (prevW && prevH) {
    const dx = Math.round((w - prevW) / 2);
    const dy = Math.round((h - prevH) / 2);
    ctx.drawImage(tmp, dx, dy);
  }

  drawGuides(state.mouseX, state.mouseY);
}

function fillBackground() {
  ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
}

// ═══════════════════════════════════════════
// === HELPERS ===
// ═══════════════════════════════════════════

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getColor() {
  if (state.rainbow) {
    state.rainbowHue = (state.rainbowHue + 1.5) % 360;
    return hslToHex(state.rainbowHue, 100, 55);
  }
  return state.color;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ═══════════════════════════════════════════
// === PATTERN SHAPES ===
// ═══════════════════════════════════════════

function drawStar(c, cx, cy, points, outerR, innerR) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    i === 0
      ? c.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
      : c.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  c.closePath();
  c.fill();
}

// Draw pattern shape centered at (0,0) in current context
function drawPatternShape(c, pattern, size) {
  const r = size / 2;

  switch (pattern) {
    case 'round':
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      break;

    case 'square':
      c.fillRect(-r, -r, size, size);
      break;

    case 'diamond':
      c.beginPath();
      c.moveTo(0, -r);
      c.lineTo(r, 0);
      c.lineTo(0, r);
      c.lineTo(-r, 0);
      c.closePath();
      c.fill();
      break;

    case 'star':
      drawStar(c, 0, 0, 5, r, r * 0.4);
      break;

    case 'triangle':
      c.beginPath();
      c.moveTo(0, -r);
      c.lineTo(r * 0.866, r * 0.5);
      c.lineTo(-r * 0.866, r * 0.5);
      c.closePath();
      c.fill();
      break;

    case 'cross': {
      const t = Math.max(1, r * 0.3);
      c.fillRect(-t, -r, t * 2, size);
      c.fillRect(-r, -t, size, t * 2);
      break;
    }

    case 'ring':
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.arc(0, 0, r * 0.55, 0, Math.PI * 2, true);
      c.fill();
      break;

    case 'scatter':
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
        const sr = r * (0.25 + Math.random() * 0.65);
        c.beginPath();
        c.arc(Math.cos(a) * sr, Math.sin(a) * sr, Math.max(0.5, r * 0.2), 0, Math.PI * 2);
        c.fill();
      }
      break;

    case 'line':
      c.lineWidth = Math.max(1, r * 0.35);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-r, 0);
      c.lineTo(r, 0);
      c.stroke();
      break;

    case 'leaf':
      c.beginPath();
      c.moveTo(0, -r);
      c.bezierCurveTo(r * 0.9, -r * 0.5, r * 0.9, r * 0.5, 0, r);
      c.bezierCurveTo(-r * 0.9, r * 0.5, -r * 0.9, -r * 0.5, 0, -r);
      c.fill();
      break;

    case 'zigzag': {
      const zn = 5;
      const zw = size / zn;
      c.lineWidth = Math.max(1, r * 0.2);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(-r, 0);
      for (let i = 0; i < zn; i++) {
        c.lineTo(-r + zw * (i + 0.5), i % 2 === 0 ? -r * 0.55 : r * 0.55);
        c.lineTo(-r + zw * (i + 1), 0);
      }
      c.stroke();
      break;
    }

    case 'wave': {
      c.lineWidth = Math.max(1, r * 0.2);
      c.lineCap = 'round';
      c.beginPath();
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const wx = -r + (size / steps) * i;
        const wy = Math.sin((i / steps) * Math.PI * 2) * r * 0.45;
        i === 0 ? c.moveTo(wx, wy) : c.lineTo(wx, wy);
      }
      c.stroke();
      break;
    }
  }
}

// ═══════════════════════════════════════════
// === SYMMETRY ENGINE ===
// ═══════════════════════════════════════════

// Execute a draw callback in each symmetry segment
function forEachSegment(callback) {
  const cx = mainCanvas.width  / 2;
  const cy = mainCanvas.height / 2;
  const step = (Math.PI * 2) / state.segments;

  for (let i = 0; i < state.segments; i++) {
    const angle = i * step;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    callback(ctx);
    ctx.restore();

    if (state.mirror) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.scale(1, -1);
      callback(ctx);
      ctx.restore();
    }
  }
}

// ═══════════════════════════════════════════
// === DRAWING TOOLS ===
// ═══════════════════════════════════════════

// Stamp a single pattern at (dx, dy) from center in each segment
function stamp(dx, dy) {
  const color  = getColor();
  const alpha  = state.opacity / 100;
  const size   = state.brushSize;
  const { r, g, b } = hexToRgb(color);

  forEachSegment(c => {
    c.globalAlpha = alpha;

    if (state.glow && state.tool !== 'eraser' && state.tool !== 'brush') {
      c.shadowBlur  = size * 0.9;
      c.shadowColor = color;
    } else {
      c.shadowBlur = 0;
    }

    if (state.tool === 'eraser') {
      // Erase to transparency so CSS background shows through
      c.globalCompositeOperation = 'destination-out';
      c.globalAlpha = 1;
      c.beginPath();
      c.arc(dx, dy, size / 2, 0, Math.PI * 2);
      c.fill();
      c.globalCompositeOperation = 'source-over';
    } else if (state.tool === 'brush') {
      // Soft brush — radial gradient
      const grad = c.createRadialGradient(dx, dy, 0, dx, dy, size / 2);
      grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.6})`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      c.globalAlpha = 1;
      c.fillStyle   = grad;
      c.beginPath();
      c.arc(dx, dy, size / 2, 0, Math.PI * 2);
      c.fill();
    } else {
      c.fillStyle   = color;
      c.strokeStyle = color;
      c.save();
      c.translate(dx, dy);
      drawPatternShape(c, state.pattern, size);
      c.restore();
    }

    c.shadowBlur  = 0;
    c.globalAlpha = 1;

    // Sparkle particles
    if (state.sparkle && state.tool !== 'eraser') {
      for (let i = 0; i < 4; i++) {
        const sa   = Math.random() * Math.PI * 2;
        const sd   = size * 0.5 + Math.random() * size * 0.8;
        const spx  = dx + Math.cos(sa) * sd;
        const spy  = dy + Math.sin(sa) * sd;
        const sHue = (state.rainbowHue + Math.random() * 60) % 360;
        c.globalAlpha = 0.7 * Math.random();
        c.fillStyle   = `hsl(${sHue},100%,70%)`;
        c.beginPath();
        c.arc(spx, spy, Math.random() * 2 + 0.5, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      }
    }
  });
}

// Spray: scatter dots around cursor in each segment
function doSpray(dx, dy) {
  const color = getColor();
  const r     = state.brushSize;
  const count = Math.max(8, Math.round(r * 0.5));
  const { r: cr, g: cg, b: cb } = hexToRgb(color);

  forEachSegment(c => {
    c.fillStyle   = color;
    c.globalAlpha = (state.opacity / 100) * 0.55;
    for (let i = 0; i < count; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const dist   = Math.random() * r;
      const sx     = dx + Math.cos(angle) * dist;
      const sy     = dy + Math.sin(angle) * dist;
      const dotR   = Math.random() * Math.max(0.5, r * 0.06) + 0.3;
      c.beginPath();
      c.arc(sx, sy, dotR, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  });
}

// Interpolate stamps along a path from (lastDx, lastDy) to (dx, dy)
function interpolateAndStamp(dx, dy) {
  const spacing = Math.max(1, state.brushSize * (state.tool === 'pen' ? 0.1 : 0.15));
  const dist    = Math.hypot(dx - state.lastDx, dy - state.lastDy);
  const steps   = Math.max(1, Math.ceil(dist / spacing));

  for (let i = 1; i <= steps; i++) {
    const t   = i / steps;
    const idx = state.lastDx + (dx - state.lastDx) * t;
    const idy = state.lastDy + (dy - state.lastDy) * t;

    if (state.tool === 'spray') {
      doSpray(idx, idy);
    } else {
      stamp(idx, idy);
    }
  }

  state.lastDx = dx;
  state.lastDy = dy;
}

// ═══════════════════════════════════════════
// === EVENT → CANVAS COORDS ===
// ═══════════════════════════════════════════

function getCanvasCoords(e) {
  const rect = mainCanvas.getBoundingClientRect();
  const scaleX = mainCanvas.width  / rect.width;
  const scaleY = mainCanvas.height / rect.height;
  const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? 0);
  const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? 0);
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY,
  };
}

function toCenterRelative(x, y) {
  return {
    dx: x - mainCanvas.width  / 2,
    dy: y - mainCanvas.height / 2,
  };
}

// ═══════════════════════════════════════════
// === POINTER EVENTS ===
// ═══════════════════════════════════════════

function onPointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();
  saveHistory();
  state.isDrawing = true;

  const { x, y }   = getCanvasCoords(e);
  const { dx, dy } = toCenterRelative(x, y);

  state.lastDx = dx;
  state.lastDy = dy;

  // Dot tool: single stamp
  if (state.tool === 'dot') {
    stamp(dx, dy);
    state.isDrawing = false;
    return;
  }

  // First point stamp
  if (state.tool === 'spray') doSpray(dx, dy);
  else stamp(dx, dy);

  mainCanvas.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  e.preventDefault();
  const { x, y }   = getCanvasCoords(e);
  state.mouseX = x;
  state.mouseY = y;

  updateCursorRing(e.clientX ?? 0, e.clientY ?? 0);
  drawGuides(x, y);

  if (!state.isDrawing) return;

  const { dx, dy } = toCenterRelative(x, y);
  interpolateAndStamp(dx, dy);
}

function onPointerUp(e) {
  state.isDrawing = false;
}

// ═══════════════════════════════════════════
// === HISTORY (undo / redo) ===
// ═══════════════════════════════════════════

const MAX_HISTORY = 50;

function saveHistory() {
  // Truncate redo branch
  state.history = state.history.slice(0, state.historyIndex + 1);

  const snapshot = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
  state.history.push(snapshot);
  if (state.history.length > MAX_HISTORY) state.history.shift();
  state.historyIndex = state.history.length - 1;
}

function undo() {
  if (state.historyIndex <= 0) { showToast('Nothing to undo'); return; }
  state.historyIndex--;
  ctx.putImageData(state.history[state.historyIndex], 0, 0);
}

function redo() {
  if (state.historyIndex >= state.history.length - 1) { showToast('Nothing to redo'); return; }
  state.historyIndex++;
  ctx.putImageData(state.history[state.historyIndex], 0, 0);
}

// ═══════════════════════════════════════════
// === GUIDES ===
// ═══════════════════════════════════════════

function drawGuides(mx, my) {
  const w  = guideCanvas.width;
  const h  = guideCanvas.height;
  const cx = w / 2;
  const cy = h / 2;

  gctx.clearRect(0, 0, w, h);

  if (state.guideSegs) {
    gctx.save();
    gctx.strokeStyle = 'rgba(255,255,255,0.12)';
    gctx.lineWidth   = 0.5;
    const step = (Math.PI * 2) / state.segments;
    for (let i = 0; i < state.segments; i++) {
      const angle = i * step;
      const dist  = Math.max(w, h);
      gctx.beginPath();
      gctx.moveTo(cx, cy);
      gctx.lineTo(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      gctx.stroke();
    }
    if (state.mirror) {
      gctx.strokeStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < state.segments; i++) {
        const angle = i * step + step / 2;
        const dist  = Math.max(w, h);
        gctx.beginPath();
        gctx.moveTo(cx, cy);
        gctx.lineTo(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
        gctx.stroke();
      }
    }
    gctx.restore();
  }

  if (state.guideCenter) {
    gctx.save();
    gctx.strokeStyle = 'rgba(255,255,255,0.3)';
    gctx.lineWidth   = 1;
    const armLen = 12;
    gctx.beginPath();
    gctx.moveTo(cx - armLen, cy);
    gctx.lineTo(cx + armLen, cy);
    gctx.moveTo(cx, cy - armLen);
    gctx.lineTo(cx, cy + armLen);
    gctx.stroke();
    gctx.beginPath();
    gctx.arc(cx, cy, 3, 0, Math.PI * 2);
    gctx.strokeStyle = 'rgba(255,255,255,0.5)';
    gctx.stroke();
    gctx.restore();
  }

  // Mouse cursor symmetry preview
  if (mx !== undefined && my !== undefined) {
    const dx = mx - cx;
    const dy = my - cy;
    const step2 = (Math.PI * 2) / state.segments;

    gctx.save();
    gctx.fillStyle   = 'rgba(255,255,255,0.35)';
    gctx.strokeStyle = 'rgba(255,255,255,0.35)';

    for (let i = 0; i < state.segments; i++) {
      const angle = i * step2;
      const cos   = Math.cos(angle);
      const sin   = Math.sin(angle);
      const rx    = dx * cos - dy * sin + cx;
      const ry    = dx * sin + dy * cos + cy;
      gctx.beginPath();
      gctx.arc(rx, ry, 2, 0, Math.PI * 2);
      gctx.fill();

      if (state.mirror) {
        const mrx = dx * cos + dy * sin + cx;
        const mry = dx * sin - dy * cos + cy;
        gctx.beginPath();
        gctx.arc(mrx, mry, 2, 0, Math.PI * 2);
        gctx.fill();
      }
    }
    gctx.restore();
  }
}

// ═══════════════════════════════════════════
// === CURSOR RING ===
// ═══════════════════════════════════════════

const cursorRing = document.createElement('div');
cursorRing.id = 'cursor-ring';
document.body.appendChild(cursorRing);

function updateCursorRing(clientX, clientY) {
  const size = state.brushSize;
  const rect = mainCanvas.getBoundingClientRect();
  const scaleX = mainCanvas.width  / rect.width;
  const scaleY = mainCanvas.height / rect.height;
  // Display size in CSS pixels
  const displaySize = size / ((scaleX + scaleY) / 2);

  cursorRing.style.display = 'block';
  cursorRing.style.width   = displaySize + 'px';
  cursorRing.style.height  = displaySize + 'px';
  cursorRing.style.left    = clientX + 'px';
  cursorRing.style.top     = clientY + 'px';
}

// ═══════════════════════════════════════════
// === EXPORT ===
// ═══════════════════════════════════════════

function savePNG() {
  // Composite: fill bg color first, then overlay drawing
  const tmp  = document.createElement('canvas');
  tmp.width  = mainCanvas.width;
  tmp.height = mainCanvas.height;
  const tc   = tmp.getContext('2d');
  tc.fillStyle = state.bgColor;
  tc.fillRect(0, 0, tmp.width, tmp.height);
  tc.drawImage(mainCanvas, 0, 0);

  const link    = document.createElement('a');
  link.download = 'kaleidoscope.png';
  link.href     = tmp.toDataURL('image/png');
  link.click();
  showToast('Saved as kaleidoscope.png');
}

function clearCanvas() {
  if (!confirm('Clear the canvas?')) return;
  saveHistory();
  ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  showToast('Canvas cleared');
}

// ═══════════════════════════════════════════
// === PATTERN PICKER ===
// ═══════════════════════════════════════════

function buildPatternPicker(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  PATTERNS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'pattern-btn' + (p.id === state.pattern ? ' active' : '');
    btn.dataset.pattern = p.id;
    btn.title = p.name;

    const c = document.createElement('canvas');
    c.width  = 32;
    c.height = 32;
    const pc = c.getContext('2d');
    pc.save();
    pc.translate(16, 16);
    pc.fillStyle   = '#cccccc';
    pc.strokeStyle = '#cccccc';
    pc.lineWidth   = 1.5;
    drawPatternShape(pc, p.id, 24);
    pc.restore();

    const lbl = document.createElement('span');
    lbl.textContent = p.name;

    btn.appendChild(c);
    btn.appendChild(lbl);
    container.appendChild(btn);
  });
}

function setPattern(id) {
  state.pattern = id;
  document.querySelectorAll('.pattern-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.pattern === id);
  });
}

// ═══════════════════════════════════════════
// === SYNC UI STATE ===
// ═══════════════════════════════════════════

// Keep all desktop + mobile controls in sync
function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll('.tool-btn, .m-tool-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === tool);
  });
}

function setSegments(n) {
  state.segments = n;
  document.querySelectorAll('.sym-btn').forEach(b => {
    b.classList.toggle('active', +b.dataset.n === n);
  });
  drawGuides(state.mouseX, state.mouseY);
}

function setEffect(fx, val) {
  state[fx] = val;
  document.querySelectorAll(`[data-fx="${fx}"]`).forEach(b => {
    b.classList.toggle('active', val);
  });
}

function setBrushSize(v) {
  state.brushSize = +v;
  document.getElementById('size-slider').value  = v;
  document.getElementById('size-out').value     = v;
  const ms = document.getElementById('m-size-slider');
  const mo = document.getElementById('m-size-val');
  if (ms) ms.value        = v;
  if (mo) mo.textContent  = v;
}

function setOpacity(v) {
  state.opacity = +v;
  document.getElementById('opacity-slider').value  = v;
  document.getElementById('opacity-out').value     = v;
  const ms = document.getElementById('m-opacity-slider');
  const mo = document.getElementById('m-opacity-val');
  if (ms) ms.value       = v;
  if (mo) mo.textContent = v;
}

function setColor(hex) {
  state.color = hex;
  document.getElementById('color-picker').value  = hex;
  document.getElementById('color-preview').style.background = hex;
  const mp = document.getElementById('m-color-picker');
  const mv = document.getElementById('m-color-preview');
  if (mp) mp.value = hex;
  if (mv) mv.style.background = hex;
  addRecentColor(hex);
}

function setBgColor(hex) {
  state.bgColor = hex;

  // CSS background — instant, no drawing lost
  document.getElementById('canvas-container').style.setProperty('--canvas-bg', hex);

  // Sync pickers
  document.getElementById('bg-picker').value = hex;
  document.getElementById('bg-preview').style.background = hex;
  const mp = document.getElementById('m-bg-picker');
  const mv = document.getElementById('m-bg-preview');
  if (mp) mp.value = hex;
  if (mv) mv.style.background = hex;

  document.querySelectorAll('.bg-dot').forEach(b => {
    b.classList.toggle('active', b.dataset.color === hex);
  });
}

// ═══════════════════════════════════════════
// === RECENT COLORS ===
// ═══════════════════════════════════════════

function addRecentColor(hex) {
  if (state.recentColors[0] === hex) return;
  state.recentColors = [hex, ...state.recentColors.filter(c => c !== hex)].slice(0, 10);
  renderRecentColors();
}

function renderRecentColors() {
  ['recent-swatches', 'm-recent-swatches'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    state.recentColors.forEach(hex => {
      const s = document.createElement('button');
      s.className = 'swatch';
      s.style.background = hex;
      s.title = hex;
      s.addEventListener('click', () => setColor(hex));
      el.appendChild(s);
    });
  });
}

// ═══════════════════════════════════════════
// === MOBILE BOTTOM SHEET ===
// ═══════════════════════════════════════════

const sheet      = document.getElementById('bottom-sheet');
const toggleBtn  = document.getElementById('sheet-toggle-btn');
const sheetHandle = document.getElementById('sheet-handle');

function openSheet() {
  sheet.classList.add('sheet-open');
  sheet.classList.remove('sheet-closed');
  toggleBtn.classList.add('sheet-open');
}

function closeSheet() {
  sheet.classList.remove('sheet-open');
  sheet.classList.add('sheet-closed');
  toggleBtn.classList.remove('sheet-open');
}

function toggleSheet() {
  if (sheet.classList.contains('sheet-open')) closeSheet();
  else openSheet();
}

// Swipe-down to close sheet
let sheetDragStartY = null;

sheetHandle.addEventListener('pointerdown', e => {
  sheetDragStartY = e.clientY;
  sheetHandle.setPointerCapture(e.pointerId);
});

sheetHandle.addEventListener('pointermove', e => {
  if (sheetDragStartY === null) return;
  const dy = e.clientY - sheetDragStartY;
  if (dy > 60) { closeSheet(); sheetDragStartY = null; }
});

sheetHandle.addEventListener('pointerup', () => { sheetDragStartY = null; });

// Sheet tabs
document.querySelectorAll('.stab').forEach(tab => {
  tab.addEventListener('click', () => {
    const name = tab.dataset.tab;
    document.querySelectorAll('.stab').forEach(t => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `m-tab-${name}`);
    });
  });
});

// ═══════════════════════════════════════════
// === UI EVENT BINDING ===
// ═══════════════════════════════════════════

function bindUI() {
  // Canvas pointer events
  mainCanvas.addEventListener('pointerdown', onPointerDown, { passive: false });
  mainCanvas.addEventListener('pointermove', onPointerMove, { passive: false });
  mainCanvas.addEventListener('pointerup',   onPointerUp);
  mainCanvas.addEventListener('pointerleave',onPointerUp);
  mainCanvas.addEventListener('pointercancel',onPointerUp);

  // Hide cursor ring when leaving canvas
  mainCanvas.addEventListener('pointerleave', () => {
    cursorRing.style.display = 'none';
    gctx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
    drawGuides();
  });

  // Symmetry buttons (desktop + mobile)
  document.querySelectorAll('.sym-btn').forEach(b => {
    b.addEventListener('click', () => setSegments(+b.dataset.n));
  });

  // Effect buttons (all instances)
  document.querySelectorAll('[data-fx]').forEach(b => {
    b.addEventListener('click', () => {
      const fx  = b.dataset.fx;
      setEffect(fx, !state[fx]);
    });
  });

  // Guide toggles
  document.getElementById('guide-center-btn').addEventListener('click', () => {
    state.guideCenter = !state.guideCenter;
    document.getElementById('guide-center-btn').classList.toggle('active', state.guideCenter);
    drawGuides(state.mouseX, state.mouseY);
  });
  document.getElementById('guide-seg-btn').addEventListener('click', () => {
    state.guideSegs = !state.guideSegs;
    document.getElementById('guide-seg-btn').classList.toggle('active', state.guideSegs);
    drawGuides(state.mouseX, state.mouseY);
  });

  // Mobile guide toggles
  document.getElementById('m-guide-center')?.addEventListener('click', e => {
    state.guideCenter = !state.guideCenter;
    e.target.classList.toggle('active', state.guideCenter);
    document.getElementById('guide-center-btn').classList.toggle('active', state.guideCenter);
    drawGuides(state.mouseX, state.mouseY);
  });
  document.getElementById('m-guide-seg')?.addEventListener('click', e => {
    state.guideSegs = !state.guideSegs;
    e.target.classList.toggle('active', state.guideSegs);
    document.getElementById('guide-seg-btn').classList.toggle('active', state.guideSegs);
    drawGuides(state.mouseX, state.mouseY);
  });

  // Tool buttons (desktop + mobile)
  document.querySelectorAll('.tool-btn, .m-tool-btn').forEach(b => {
    b.addEventListener('click', () => setTool(b.dataset.tool));
  });

  // Pattern buttons — event delegation
  document.addEventListener('click', e => {
    const btn = e.target.closest('.pattern-btn');
    if (btn) setPattern(btn.dataset.pattern);
  });

  // Size slider
  document.getElementById('size-slider').addEventListener('input', e => setBrushSize(e.target.value));
  document.getElementById('m-size-slider')?.addEventListener('input', e => setBrushSize(e.target.value));

  // Opacity slider
  document.getElementById('opacity-slider').addEventListener('input', e => setOpacity(e.target.value));
  document.getElementById('m-opacity-slider')?.addEventListener('input', e => setOpacity(e.target.value));

  // Color picker — need to open on swatch click
  document.getElementById('color-preview').addEventListener('click', () => {
    document.getElementById('color-picker').click();
  });
  document.getElementById('color-picker').addEventListener('input', e => setColor(e.target.value));

  document.getElementById('m-color-preview')?.addEventListener('click', () => {
    document.getElementById('m-color-picker').click();
  });
  document.getElementById('m-color-picker')?.addEventListener('input', e => setColor(e.target.value));

  // Background color picker
  document.getElementById('bg-preview').addEventListener('click', () => {
    document.getElementById('bg-picker').click();
  });
  document.getElementById('bg-picker').addEventListener('input', e => setBgColor(e.target.value));

  document.getElementById('m-bg-preview')?.addEventListener('click', () => {
    document.getElementById('m-bg-picker').click();
  });
  document.getElementById('m-bg-picker')?.addEventListener('input', e => setBgColor(e.target.value));

  // Background preset dots
  document.querySelectorAll('.bg-dot').forEach(b => {
    b.addEventListener('click', () => {
      setBgColor(b.dataset.color);
    });
  });

  // Action buttons
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  document.getElementById('btn-save').addEventListener('click', savePNG);
  document.getElementById('btn-clear').addEventListener('click', clearCanvas);

  document.getElementById('m-undo')?.addEventListener('click', undo);
  document.getElementById('m-redo')?.addEventListener('click', redo);
  document.getElementById('m-save')?.addEventListener('click', savePNG);
  document.getElementById('m-clear')?.addEventListener('click', clearCanvas);

  // Sheet toggle + close button
  toggleBtn?.addEventListener('click', toggleSheet);
  document.getElementById('sheet-close-btn')?.addEventListener('click', closeSheet);

  // Window resize
  const resizeObs = new ResizeObserver(() => resizeCanvas());
  resizeObs.observe(document.getElementById('canvas-container'));

  // Keyboard shortcuts
  document.addEventListener('keydown', onKeyDown);

  // Prevent context menu on canvas
  mainCanvas.addEventListener('contextmenu', e => e.preventDefault());

  // Prevent page scroll on mobile over canvas
  document.addEventListener('touchmove', e => {
    if (e.target === mainCanvas) e.preventDefault();
  }, { passive: false });
}

// ═══════════════════════════════════════════
// === KEYBOARD SHORTCUTS ===
// ═══════════════════════════════════════════

function onKeyDown(e) {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'z': e.preventDefault(); undo(); break;
      case 'y': e.preventDefault(); redo(); break;
      case 's': e.preventDefault(); savePNG(); break;
    }
    return;
  }

  switch (e.key.toLowerCase()) {
    case 'b': setTool('pen');    break;
    case 'e': setTool('eraser'); break;
    case 'r': setEffect('rainbow', !state.rainbow); break;
    case 'g':
      state.guideSegs = !state.guideSegs;
      document.getElementById('guide-seg-btn').classList.toggle('active', state.guideSegs);
      drawGuides(state.mouseX, state.mouseY);
      break;
    case 'c':
      state.guideCenter = !state.guideCenter;
      document.getElementById('guide-center-btn').classList.toggle('active', state.guideCenter);
      drawGuides(state.mouseX, state.mouseY);
      break;
    case '[':
      setBrushSize(Math.max(1, state.brushSize - 5));
      break;
    case ']':
      setBrushSize(Math.min(150, state.brushSize + 5));
      break;
  }
}

// ═══════════════════════════════════════════
// === INIT ===
// ═══════════════════════════════════════════

function init() {
  // Add toast element
  const toast = document.createElement('div');
  toast.id = 'toast';
  document.body.appendChild(toast);

  // Build pattern pickers
  buildPatternPicker('pattern-grid');
  buildPatternPicker('m-pattern-grid');

  // Bind all events
  bindUI();

  // Apply initial background color to container CSS
  document.getElementById('canvas-container')
    .style.setProperty('--canvas-bg', state.bgColor);

  // Initial resize
  resizeCanvas();

  // Save initial history state
  saveHistory();

  // Initial guide draw
  drawGuides();
}

document.addEventListener('DOMContentLoaded', init);
