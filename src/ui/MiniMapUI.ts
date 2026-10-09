import * as THREE from 'three';

export class MiniMapUI {
  private miniCanvas: HTMLCanvasElement;
  private miniCtx: CanvasRenderingContext2D;
  private largeCanvas: HTMLCanvasElement | null = null;
  private largeCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.miniCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    this.miniCtx = this.miniCanvas.getContext('2d')!;

    const lCanvas = document.getElementById('large-map-canvas') as HTMLCanvasElement | null;
    if (lCanvas) {
      this.largeCanvas = lCanvas;
      this.largeCtx = lCanvas.getContext('2d');
    }
  }

  public render(
    playerPos: THREE.Vector3,
    playerRotY: number,
    targetPos: { x: number; z: number } | null,
    vehiclePos?: THREE.Vector3
  ): void {
    this.renderCanvas(this.miniCtx, this.miniCanvas.width, this.miniCanvas.height, playerPos, playerRotY, targetPos, vehiclePos, true);

    if (this.largeCtx && this.largeCanvas && !this.largeCanvas.closest('.map-modal')?.classList.contains('hidden')) {
      this.renderCanvas(this.largeCtx, this.largeCanvas.width, this.largeCanvas.height, playerPos, playerRotY, targetPos, vehiclePos, false);
    }
  }

  private renderCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    playerPos: THREE.Vector3,
    playerRotY: number,
    targetPos: { x: number; z: number } | null,
    vehiclePos?: THREE.Vector3,
    isMini: boolean = true
  ): void {
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = isMini ? 1.0 : 2.0; // Scale: meters to pixels

    ctx.save();
    if (isMini) {
      // Mini-map rotates with player view or centers on player
      ctx.translate(cx, cy);
      // World to screen translation centered on player
      const toScreenX = (wx: number) => (wx - playerPos.x) * scale;
      const toScreenY = (wz: number) => (wz - playerPos.z) * scale;

      this.drawMapElements(ctx, toScreenX, toScreenY);

      // Draw vehicle icon if outside
      if (vehiclePos && vehiclePos.distanceTo(playerPos) > 3) {
        const vx = toScreenX(vehiclePos.x);
        const vy = toScreenY(vehiclePos.z);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(vx, vy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw target beacon
      if (targetPos) {
        const tx = toScreenX(targetPos.x);
        const ty = toScreenY(targetPos.z);

        // Target glowing ring
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tx, ty, 6 + Math.sin(Date.now() * 0.006) * 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(tx, ty, 4, 0, Math.PI * 2);
        ctx.fill();

        // Guide arrow pointing towards target if off-screen
        const dist = Math.hypot(tx, ty);
        if (dist > (width / 2 - 12)) {
          const angle = Math.atan2(ty, tx);
          const arrowX = Math.cos(angle) * (width / 2 - 14);
          const arrowY = Math.sin(angle) * (height / 2 - 14);

          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(arrowX, arrowY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Player cursor in center
      ctx.save();
      ctx.rotate(-playerRotY);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

    } else {
      // Large Map: Full overview
      ctx.translate(cx, cy);
      const toScreenX = (wx: number) => (wx + 30) * scale * 1.5;
      const toScreenY = (wz: number) => (wz + 45) * scale * 1.5;

      this.drawMapElements(ctx, toScreenX, toScreenY);

      // Player position
      const px = toScreenX(playerPos.x);
      const py = toScreenY(playerPos.z);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Target position
      if (targetPos) {
        const tx = toScreenX(targetPos.x);
        const ty = toScreenY(targetPos.z);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(tx, ty, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawMapElements(
    ctx: CanvasRenderingContext2D,
    toX: (x: number) => number,
    toY: (z: number) => number
  ): void {
    // 0. Draw Park Green Area
    ctx.fillStyle = '#166534';
    ctx.fillRect(toX(-55), toY(45), Math.abs(toX(-15) - toX(-55)), Math.abs(toY(5) - toY(45)));

    ctx.lineWidth = 14;
    ctx.strokeStyle = '#334155';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Gas station avenue (0, 80) to (0, -30)
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(80));
    ctx.lineTo(toX(0), toY(-30));
    ctx.stroke();

    // 2. Main Boulevard (-80, -30) to (80, -30)
    ctx.beginPath();
    ctx.moveTo(toX(-80), toY(-30));
    ctx.lineTo(toX(80), toY(-30));
    ctx.stroke();

    // 3. Residential street (-60, -30) to (-60, -120)
    ctx.beginPath();
    ctx.moveTo(toX(-60), toY(-30));
    ctx.lineTo(toX(-60), toY(-120));
    ctx.stroke();

    // 4. Commercial shopping street (50, -30) to (50, -100)
    ctx.beginPath();
    ctx.moveTo(toX(50), toY(-30));
    ctx.lineTo(toX(50), toY(-100));
    ctx.stroke();

    // 5. Driveway to House (-60, -85) to (-52, -85)
    ctx.beginPath();
    ctx.moveTo(toX(-60), toY(-85));
    ctx.lineTo(toX(-52), toY(-85));
    ctx.stroke();

    // Landmarks icons / labels
    // Gas station (0, 0)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(toX(0), toY(0), 7, 0, Math.PI * 2);
    ctx.fill();

    // Streamer House (-60, -90)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(toX(-60), toY(-90), 8, 0, Math.PI * 2);
    ctx.fill();

    // Supermarket Silpo (68, -48)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(toX(68), toY(-48), 6, 0, Math.PI * 2);
    ctx.fill();

    // Rozetka Tech Store (32, -80)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(toX(32), toY(-80), 6, 0, Math.PI * 2);
    ctx.fill();

    // Drip Store Clothes (-25, -32)
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(toX(-25), toY(-32), 6, 0, Math.PI * 2);
    ctx.fill();

    // STO Customs Tuning (68, -80)
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(toX(68), toY(-80), 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
