export class InputManager {
  private keys: Record<string, boolean> = {};
  private onInteractCallbacks: Array<() => void> = [];
  private onPhoneCallbacks: Array<() => void> = [];
  private onMapCallbacks: Array<() => void> = [];
  private onHornCallbacks: Array<() => void> = [];
  private onCameraToggleCallbacks: Array<() => void> = [];
  private onRadioCallbacks: Array<() => void> = [];
  private onDevCheatCallbacks: Array<() => void> = [];

  // Mouse orbit camera controls
  public mouseDeltaX: number = 0;
  public mouseDeltaY: number = 0;
  public zoomDelta: number = 0;
  public isMouseDown: boolean = false;
  private isPointerLocked: boolean = false;

  constructor() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    this.setupMouseControls();
    this.setupTouchControls();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const isInput = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';
    if (isInput) return;

    this.keys[e.code] = true;

    const code = e.code;
    const key = e.key ? e.key.toLowerCase() : '';

    if (code === 'KeyE' || key === 'e' || key === 'у') {
      this.onInteractCallbacks.forEach((cb) => cb());
    } else if (code === 'KeyP' || key === 'p' || key === 'з') {
      this.onPhoneCallbacks.forEach((cb) => cb());
    } else if (code === 'KeyM' || key === 'm' || key === 'ь') {
      this.onMapCallbacks.forEach((cb) => cb());
    } else if (code === 'KeyF' || key === 'f' || key === 'а') {
      this.onDevCheatCallbacks.forEach((cb) => cb());
    } else if (code === 'KeyH' || key === 'h' || key === 'р') {
      this.onHornCallbacks.forEach((cb) => cb());
    } else if (code === 'KeyV' || key === 'v' || key === 'м') {
      this.onCameraToggleCallbacks.forEach((cb) => cb());
    } else if (code === 'KeyR' || key === 'r' || key === 'к') {
      this.onRadioCallbacks.forEach((cb) => cb());
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;
  }

  public alwaysTrackMouse: boolean = false;

  private setupMouseControls(): void {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 || e.button === 2) {
        this.isMouseDown = true;
      }
    });

    canvas.addEventListener('click', () => {
      // Auto lock pointer when clicking canvas if phone/map is not open
      const phoneClosed = document.getElementById('phone-container')?.classList.contains('closed');
      const mapClosed = document.getElementById('map-modal')?.classList.contains('hidden');
      if (phoneClosed && mapClosed) {
        try {
          canvas.requestPointerLock();
        } catch {
          // Ignored
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      const isLocked = document.pointerLockElement === canvas;
      if (isLocked || this.isMouseDown || this.alwaysTrackMouse) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });

    // Touch drag for mobile/tablet camera rotation
    let lastTouchX = 0;
    let lastTouchY = 0;
    let touchDragging = false;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        touchDragging = true;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (touchDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastTouchX;
        const dy = e.touches[0].clientY - lastTouchY;
        this.mouseDeltaX += dx;
        this.mouseDeltaY += dy;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      touchDragging = false;
    });

    // Mouse wheel for zoom
    window.addEventListener('wheel', (e) => {
      this.zoomDelta += Math.sign(e.deltaY);
    }, { passive: true });

    // Prevent context menu on right click to allow smooth right-click drag
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private setupTouchControls(): void {
    const buttons = document.querySelectorAll('.touch-btn');
    buttons.forEach((btn) => {
      const key = btn.getAttribute('data-key');
      if (!key) return;

      const triggerDown = (e: Event) => {
        e.preventDefault();
        this.keys[key] = true;
        if (key === 'KeyE') this.onInteractCallbacks.forEach((cb) => cb());
        if (key === 'KeyP') this.onPhoneCallbacks.forEach((cb) => cb());
        if (key === 'KeyM') this.onMapCallbacks.forEach((cb) => cb());
        if (key === 'KeyH') this.onHornCallbacks.forEach((cb) => cb());
      };

      const triggerUp = (e: Event) => {
        e.preventDefault();
        this.keys[key] = false;
      };

      btn.addEventListener('touchstart', triggerDown, { passive: false });
      btn.addEventListener('touchend', triggerUp, { passive: false });
      btn.addEventListener('mousedown', triggerDown);
      btn.addEventListener('mouseup', triggerUp);
    });
  }

  public getAndResetMouseDeltas(): { dx: number; dy: number; zoom: number } {
    const res = { dx: this.mouseDeltaX, dy: this.mouseDeltaY, zoom: this.zoomDelta };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.zoomDelta = 0;
    return res;
  }

  public isForward(): boolean {
    return !!(this.keys['KeyW'] || this.keys['ArrowUp']);
  }

  public isBackward(): boolean {
    return !!(this.keys['KeyS'] || this.keys['ArrowDown']);
  }

  public isLeft(): boolean {
    return !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
  }

  public isRight(): boolean {
    return !!(this.keys['KeyD'] || this.keys['ArrowRight']);
  }

  public isSprint(): boolean {
    return !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
  }

  public isJump(): boolean {
    return !!this.keys['Space'];
  }

  public isHandbrake(): boolean {
    return !!this.keys['Space'];
  }

  public onInteract(cb: () => void): void {
    this.onInteractCallbacks.push(cb);
  }

  public onPhoneToggle(cb: () => void): void {
    this.onPhoneCallbacks.push(cb);
  }

  public onMapToggle(cb: () => void): void {
    this.onMapCallbacks.push(cb);
  }

  public onHorn(cb: () => void): void {
    this.onHornCallbacks.push(cb);
  }

  public onCameraToggle(cb: () => void): void {
    this.onCameraToggleCallbacks.push(cb);
  }

  public onRadio(cb: () => void): void {
    this.onRadioCallbacks.push(cb);
  }

  public onDevCheat(cb: () => void): void {
    this.onDevCheatCallbacks.push(cb);
  }

  public requestPointerLock(): void {
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      try {
        canvas.requestPointerLock();
      } catch {
        // Ignored
      }
    }
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch {
        // Ignored
      }
    }
  }

  public setAlwaysTrackMouse(always: boolean): void {
    this.alwaysTrackMouse = always;
  }
}
