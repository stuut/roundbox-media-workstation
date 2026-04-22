export class BufferedBrush {
  constructor(main, overlay, upper, scale, offset) {
    this.main = main;
    this.overlay = overlay;
    this.upper = upper;
    this.scale = scale
    this.offset = offset
    this.mainCtx = main.getContext('2d');
    this.overlayCtx = overlay.getContext('2d');

    this.buffer = document.createElement('canvas');
    this.bufferCtx = this.buffer.getContext('2d');

    this.painting = false;
    this.lastX = 0;
    this.lastY = 0;

    this.brushSize = 80;
    this.brushHardness = 50;
    this.brushOpacity = 0.5;

    this.bufferResize();
    this.brushTexture = this.createBrushTexture();
    this.attachEvents();
  }

  bufferResize() {

    this.buffer.width = this.main.width;
    this.buffer.height = this.main.height;
  }

  attachEvents() {
    window.addEventListener('resize', () => this.bufferResize());

    /*

    this.overlay.addEventListener('pointerdown', e => this.onPointerDown(e));
    this.overlay.addEventListener('pointermove', e => this.onPointerMove(e));
    this.overlay.addEventListener('pointerup', e => this.onPointerUp(e));
    this.overlay.addEventListener('pointerout', e => this.onPointerOut(e));
    */

    this.upper.addEventListener('pointerdown', e => this.onUpperPointerDown(e));
    this.upper.addEventListener('pointermove', e => this.onUpperPointerMove(e));
    this.upper.addEventListener('pointerup', e => this.onUpperPointerUp(e));
    this.upper.addEventListener('pointerout', e => this.onUpperPointerOut(e));
  }

  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  createBrushTexture() {
    const brushColor = '#000000';
    const diameter = Math.max(this.brushSize * 2, 64);
    const canv = document.createElement('canvas');
    canv.width = canv.height = diameter;
    const ctx = canv.getContext('2d');
    const cx = diameter / 2;
    const cy = diameter / 2;
    const R = this.brushSize;
    const hard = Math.max(0, Math.min(1, this.brushHardness / 100));

    const r = 0, g = 0, b = 0; // black brush

    if (hard >= 0.999) {
      ctx.fillStyle = `rgba(${r},${g},${b},1)`;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    } else {
      const innerR = R * hard;
      const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, R);
      const steps = 128;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const eased = 1 - this.easeInOut(t);
        const alpha = eased;
        grad.addColorStop(t, `rgba(${r},${g},${b},${alpha})`);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, diameter, diameter);
    }

    console.log('canv', canv)
    return canv;
  }

  stampToBuffer(x, y) {
    const d = this.brushTexture.width;
    this.bufferCtx.drawImage(this.brushTexture, x - d / 2, y - d / 2);
  }

  drawLineBuffer(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const hardnessFactor = Math.max(0.01, this.brushHardness / 100);
    const spacing = Math.max(1, this.brushSize * (0.25 - 0.2 * hardnessFactor));
    const steps = Math.ceil(dist / spacing);
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = x1 + dx * t;
      const y = y1 + dy * t;
      this.stampToBuffer(x, y);
    }
  }

  renderOverlay() {
    this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.overlayCtx.globalAlpha = this.brushOpacity;
    this.overlayCtx.drawImage(this.buffer, 0, 0);
    this.overlayCtx.globalAlpha = 1;
  }

  onUpperPointerDown(e) {
    this.painting = true;
    this.lastX = (e.offsetX - this.offset.x) * 1 /this.scale;
    this.lastY = (e.offsetY - this.offset.y) * 1 /this.scale;
    console.log('onUpperPointerDown', e.offsetX, e.offsetY)
    this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    this.stampToBuffer(this.lastX, this.lastY);
    this.renderOverlay();
  }

  onUpperPointerMove(e) {
    if (!this.painting) return;
    console.log('this.offset', this.offset)
    const x = (e.offsetX - this.offset.x) * 1 / this.scale, y = (e.offsetY - this.offset.y) * 1 /this.scale ;
    this.drawLineBuffer(this.lastX, this.lastY, x, y);
    this.lastX = x; this.lastY = y;
    this.renderOverlay();
  }

  onUpperPointerUp(e) {
    if (!this.painting) return;
    this.painting = false;
    this.mainCtx.globalAlpha = this.brushOpacity;
    this.mainCtx.drawImage(this.buffer, 0, 0);
    this.mainCtx.globalAlpha = 1;
    this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
  }

  onUpperPointerOut() {
    if (this.painting) {
      this.painting = false;
      this.mainCtx.globalAlpha = this.brushOpacity;
      this.mainCtx.drawImage(this.buffer, 0, 0);
      this.mainCtx.globalAlpha = 1;
      this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
      this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    }
  }

  setBrushSize(size) {
    this.brushSize = size;
    this.brushTexture = this.createBrushTexture();
  }

  setBrushHardness(hardness) {
    this.brushHardness = hardness;
    this.brushTexture = this.createBrushTexture();
  }

  setBrushOpacity(opacity) {
    this.brushOpacity = opacity;
  }
}
