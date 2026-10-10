import { AudioManager } from '../core/AudioManager';

export class HudUI {
  private balanceValEl: HTMLElement;
  private vehicleNameEl: HTMLElement;
  private questTextEl: HTMLElement;
  private questDistEl: HTMLElement;
  private streamStatEl: HTMLElement;
  private streamViewersEl: HTMLElement;

  private promptEl: HTMLElement;
  private promptKeyEl: HTMLElement;
  private promptTextEl: HTMLElement;

  private speedometerEl: HTMLElement;
  private speedValueEl: HTMLElement;
  private speedGearEl: HTMLElement;

  private tutorialModalEl: HTMLElement;
  private tutorialTitleEl: HTMLElement;
  private tutorialBodyEl: HTMLElement;
  private btnTutorialNext: HTMLElement;

  private toastContainer: HTMLElement;
  private btnAudio: HTMLElement;
  private audioManager: AudioManager;

  // GTA 5 Status Bars & Banners
  private staminaFillEl: HTMLElement | null;
  private radioBannerEl: HTMLElement | null;
  private radioTitleEl: HTMLElement | null;
  private radioBtnEl: HTMLElement | null;
  private locationBannerEl: HTMLElement | null;
  private locationTextEl: HTMLElement | null;
  private floatingCashContainer: HTMLElement | null;
  private radioTimeout: number | null = null;
  private locationTimeout: number | null = null;
  private lastBalance: number = 100;
  private lastLocation: string = '';

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;

    this.balanceValEl = document.getElementById('balance-value')!;
    this.vehicleNameEl = document.getElementById('vehicle-name')!;
    this.questTextEl = document.getElementById('quest-text')!;
    this.questDistEl = document.getElementById('quest-dist')!;
    this.streamStatEl = document.getElementById('hud-stream-stat')!;
    this.streamViewersEl = document.getElementById('hud-stream-viewers')!;

    this.promptEl = document.getElementById('interaction-prompt')!;
    this.promptKeyEl = document.getElementById('prompt-key')!;
    this.promptTextEl = document.getElementById('prompt-text')!;

    this.speedometerEl = document.getElementById('speedometer')!;
    this.speedValueEl = document.getElementById('speed-value')!;
    this.speedGearEl = document.getElementById('speed-gear')!;

    this.tutorialModalEl = document.getElementById('tutorial-modal')!;
    this.tutorialTitleEl = document.getElementById('tutorial-title')!;
    this.tutorialBodyEl = document.getElementById('tutorial-body')!;
    this.btnTutorialNext = document.getElementById('btn-tutorial-next')!;

    this.toastContainer = document.getElementById('toast-container')!;
    this.btnAudio = document.getElementById('btn-toggle-audio')!;

    // GTA 5 Elements
    this.staminaFillEl = document.getElementById('gta-stamina-fill');
    this.radioBannerEl = document.getElementById('gta-radio-banner');
    this.radioTitleEl = document.getElementById('radio-station-title');
    this.radioBtnEl = document.getElementById('btn-toggle-radio');
    this.locationBannerEl = document.getElementById('gta-location-banner');
    this.locationTextEl = document.getElementById('gta-location-text');
    this.floatingCashContainer = document.getElementById('floating-cash-container');

    this.initListeners();
  }

  private initListeners(): void {
    this.btnAudio.addEventListener('click', () => {
      const isUnmuted = this.audioManager.toggleMute();
      this.btnAudio.textContent = isUnmuted ? '🔊' : '🔇';
    });

    this.btnTutorialNext.addEventListener('click', () => {
      this.audioManager.playClick();
      this.hideTutorialModal();
    });
  }

  public onCameraBtnClick(cb: () => void): void {
    document.getElementById('btn-toggle-camera')?.addEventListener('click', () => {
      this.audioManager.playClick();
      cb();
    });
  }

  public updateCameraMode(isFirstPerson: boolean): void {
    const label = document.getElementById('camera-mode-label');
    if (label) {
      label.textContent = isFirstPerson ? '1-ша особа' : '3-тя особа';
    }
    const crosshair = document.getElementById('first-person-crosshair');
    if (crosshair) {
      if (isFirstPerson) crosshair.classList.remove('hidden');
      else crosshair.classList.add('hidden');
    }
  }

  public updateBalance(balance: number): void {
    if (balance !== this.lastBalance) {
      const delta = balance - this.lastBalance;
      this.showFloatingCash(Math.abs(delta), delta > 0);
      this.lastBalance = balance;
    }
    this.balanceValEl.textContent = balance.toLocaleString('uk-UA');
  }

  public updateVehicle(vehicleName: string, inside: boolean): void {
    this.vehicleNameEl.textContent = vehicleName;
    if (inside) {
      this.speedometerEl.classList.remove('hidden');
    } else {
      this.speedometerEl.classList.add('hidden');
    }
  }

  public onRadioBtnClick(cb: () => void): void {
    this.radioBtnEl?.addEventListener('click', () => {
      cb();
    });
  }

  public updateStamina(current: number, max: number): void {
    if (!this.staminaFillEl) return;
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    this.staminaFillEl.style.width = `${pct}%`;
  }

  public showRadioBanner(stationName: string): void {
    if (!this.radioBannerEl || !this.radioTitleEl) return;
    this.radioTitleEl.textContent = stationName;
    this.radioBannerEl.classList.remove('hidden');

    if (this.radioTimeout !== null) clearTimeout(this.radioTimeout);
    this.radioTimeout = window.setTimeout(() => {
      this.radioBannerEl?.classList.add('hidden');
    }, 2800);
  }

  public showLocationBanner(locName: string): void {
    if (this.lastLocation === locName) return;
    this.lastLocation = locName;
    if (!this.locationBannerEl || !this.locationTextEl) return;

    this.locationTextEl.textContent = locName;
    this.locationBannerEl.classList.remove('hidden');

    if (this.locationTimeout !== null) clearTimeout(this.locationTimeout);
    this.locationTimeout = window.setTimeout(() => {
      this.locationBannerEl?.classList.add('hidden');
    }, 3800);
  }

  public showFloatingCash(amount: number, isGain: boolean): void {
    if (!this.floatingCashContainer || amount === 0) return;
    const item = document.createElement('div');
    item.className = `floating-cash-item ${isGain ? 'gain' : 'spend'}`;
    item.textContent = `${isGain ? '+' : '-'}₴${amount.toLocaleString('uk-UA')}`;
    this.floatingCashContainer.appendChild(item);

    setTimeout(() => {
      item.remove();
    }, 1800);
  }

  public updateSpeed(kmh: number, movingForward: boolean): void {
    this.speedValueEl.textContent = kmh.toString();
    this.speedGearEl.textContent = kmh === 0 ? 'P' : (movingForward ? 'D' : 'R');
  }

  public updateQuest(text: string, distanceMeters: number): void {
    this.questTextEl.textContent = text;
    this.questDistEl.textContent = `${Math.round(distanceMeters)}м`;
  }

  public updateStreamStatus(isStreaming: boolean, viewers: number): void {
    if (isStreaming) {
      this.streamStatEl.style.display = 'flex';
      this.streamViewersEl.textContent = viewers.toLocaleString('uk-UA');
    } else {
      this.streamStatEl.style.display = 'none';
    }
  }

  public showPrompt(key: string, text: string): void {
    this.promptKeyEl.textContent = key;
    this.promptTextEl.textContent = text;
    this.promptEl.classList.remove('hidden');
  }

  public hidePrompt(): void {
    this.promptEl.classList.add('hidden');
  }

  public showTutorialModal(title: string, body: string): void {
    this.tutorialTitleEl.textContent = title;
    this.tutorialBodyEl.innerHTML = body;
    this.tutorialModalEl.classList.remove('hidden');
  }

  public hideTutorialModal(): void {
    this.tutorialModalEl.classList.add('hidden');
  }

  public showToast(text: string, type: 'info' | 'donation' | 'success' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'donation' ? 'toast-donation' : ''}`;

    const icon = type === 'donation' ? '💸' : (type === 'success' ? '✅' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${text}</span>`;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}
