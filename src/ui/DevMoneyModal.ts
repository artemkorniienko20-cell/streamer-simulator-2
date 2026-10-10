import { EconomySystem } from '../systems/EconomySystem';
import { AudioManager } from '../core/AudioManager';
import confetti from 'canvas-confetti';

export class DevMoneyModal {
  private modalEl: HTMLElement;
  private economy: EconomySystem;
  private audio: AudioManager;
  private isOpened: boolean = false;
  private onOpenMapCallback?: () => void;

  constructor(economy: EconomySystem, audio: AudioManager, onOpenMap?: () => void) {
    this.economy = economy;
    this.audio = audio;
    this.onOpenMapCallback = onOpenMap;

    this.modalEl = this.createModalElement();
    document.body.appendChild(this.modalEl);
    this.initListeners();
  }

  private createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'dev-money-modal';
    el.className = 'modal-backdrop hidden';
    el.style.zIndex = '99999';

    el.innerHTML = `
      <div class="modal-card dev-modal-card">
        <div class="modal-header dev-modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 26px;">💰</span>
            <div>
              <h3 style="margin: 0; color: #fbbf24; font-size: 18px; font-weight: 800; letter-spacing: 0.5px;">
                СЕКРЕТНА ПАНЕЛЬ: ВИДАЧА ГРОШЕЙ [F]
              </h3>
              <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">
                Статус: <strong style="color: #10b981;">🔒 Захищений доступ Власника</strong>
              </span>
            </div>
          </div>
          <button class="btn-close" id="btn-close-dev-modal">✕</button>
        </div>

        <div class="dev-balance-banner">
          <span style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; font-weight: 700;">Поточний баланс картки:</span>
          <div class="dev-balance-val" id="dev-modal-balance-val">100 ₴</div>
        </div>

        <div style="margin: 16px 0 8px; font-size: 12px; font-weight: 700; color: #cbd5e1;">ШВИДКА ВИДАЧА ГРОШЕЙ:</div>
        <div class="dev-quick-grid">
          <button class="btn-dev-quick" data-amount="10000">+ 10,000 ₴</button>
          <button class="btn-dev-quick" data-amount="50000">+ 50,000 ₴</button>
          <button class="btn-dev-quick" data-amount="100000">+ 100,000 ₴</button>
          <button class="btn-dev-quick" data-amount="500000">+ 500,000 ₴</button>
          <button class="btn-dev-quick dev-mega" data-amount="1000000">💎 + 1,000,000 ₴ (Мільйонер)</button>
          <button class="btn-dev-quick dev-mega" data-amount="10000000">👑 + 10,000,000 ₴ (Олігарх)</button>
        </div>

        <div style="margin: 16px 0 8px; font-size: 12px; font-weight: 700; color: #cbd5e1;">ДОВІЛЬНА СУМА:</div>
        <div style="display: flex; gap: 8px;">
          <input type="number" id="dev-custom-amount-input" class="dev-input" placeholder="Введіть суму, наприклад 250000" min="1" step="100" />
          <button id="btn-dev-give-custom" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b, #d97706); font-weight: 800;">
            Зарахувати
          </button>
        </div>

        <div class="dev-modal-footer">
          <button id="btn-dev-open-city-map" class="btn-secondary" style="font-size: 12px;">🗺️ Відкрити карту міста [M]</button>
          <span style="font-size: 11px; color: #64748b;">Гаряча клавіша панелі: <strong>[F]</strong></span>
        </div>
      </div>
    `;

    return el;
  }

  private initListeners(): void {
    this.modalEl.querySelector('#btn-close-dev-modal')?.addEventListener('click', () => this.close());

    // Quick buttons
    this.modalEl.querySelectorAll('.btn-dev-quick').forEach((btn) => {
      btn.addEventListener('click', () => {
        const amount = Number(btn.getAttribute('data-amount')) || 10000;
        this.addMoney(amount);
      });
    });

    // Custom input button
    this.modalEl.querySelector('#btn-dev-give-custom')?.addEventListener('click', () => {
      const input = this.modalEl.querySelector('#dev-custom-amount-input') as HTMLInputElement;
      const amount = Number(input?.value) || 0;
      if (amount > 0) {
        this.addMoney(amount);
        input.value = '';
      }
    });

    // Switch to map
    this.modalEl.querySelector('#btn-dev-open-city-map')?.addEventListener('click', () => {
      this.close();
      this.onOpenMapCallback?.();
    });

    // Close on backdrop click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });
  }

  private addMoney(amount: number): void {
    this.economy.addMoney(amount, '👑 DEV ВИДАЧА (korn333@gmail.com)');
    this.audio.playCashRegister();

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { x: 0.5, y: 0.5 }
      });
    } catch {}

    this.updateBalanceDisplay();
  }

  private updateBalanceDisplay(): void {
    const valEl = this.modalEl.querySelector('#dev-modal-balance-val');
    if (valEl) {
      valEl.textContent = this.economy.getBalance().toLocaleString('uk-UA') + ' ₴';
    }
  }

  public isOpen(): boolean {
    return this.isOpened;
  }

  public toggle(): void {
    if (this.isOpened) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    this.isOpened = true;
    this.updateBalanceDisplay();
    this.modalEl.classList.remove('hidden');
    this.audio.playClick();

    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch {}
    }
  }

  public close(): void {
    this.isOpened = false;
    this.modalEl.classList.add('hidden');
  }
}
