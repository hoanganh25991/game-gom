/**
 * Live FPS badge — circular skill-button style, forge-glow number, left of minimap.
 */
export class FpsBadgeUI {
  constructor() {
    this.root = document.getElementById("fpsBadge");
    this.valueEl = document.getElementById("fpsValue");
  }

  update(fps) {
    if (!this.valueEl) return;
    let n = Number(fps);
    if (!Number.isFinite(n) || n <= 0) {
      try {
        const m = window.__perfMetrics;
        n = m && Number.isFinite(m.fps) ? m.fps : 0;
      } catch (_) {
        n = 0;
      }
    }
    if (n > 0) {
      this.valueEl.textContent = String(Math.round(n));
    }
  }
}
