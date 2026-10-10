import { EconomySystem } from '../systems/EconomySystem';
import { StreamSimulation } from '../systems/StreamSimulation';
import { AudioManager } from '../core/AudioManager';
import { TutorialSystem } from '../systems/TutorialSystem';
import { PC_SETUPS, CARS_CATALOG, STREAM_CATEGORIES, SILPO_ITEMS, GEAR_ITEMS, CLOTHES_ITEMS, TUNING_ITEMS } from '../data/items';
import { PcSetup, CarModel, ChatMessage, ShopItem } from '../types';
import confetti from 'canvas-confetti';

export class PhoneUI {
  private containerEl: HTMLElement;
  private isOpened: boolean = false;
  private currentApp: string | null = null;

  private economy: EconomySystem;
  private streamSim: StreamSimulation;
  private audio: AudioManager;
  private tutorial: TutorialSystem;

  private clockEl: HTMLElement;
  private widgetBalanceEl: HTMLElement;
  private widgetStreamPreviewEl: HTMLElement;
  private pcShopListEl: HTMLElement;
  private carDealerListEl: HTMLElement;
  private streamContentEl: HTMLElement;
  private bankContentEl: HTMLElement;

  private silpoListEl: HTMLElement | null = null;
  private gearListEl: HTMLElement | null = null;
  private clothesListEl: HTMLElement | null = null;
  private tuningListEl: HTMLElement | null = null;

  private onVehicleSpawnRequest?: (carId: string) => void;
  private onPcUpdated?: (tier: number) => void;
  private onOutfitChange?: (outfitId: string) => void;
  private onCarTuningChange?: () => void;
  private onFoodConsume?: (item: ShopItem) => void;
  private onOpenMainMenu?: () => void;

  constructor(
    economy: EconomySystem,
    streamSim: StreamSimulation,
    audio: AudioManager,
    tutorial: TutorialSystem,
    onVehicleSpawn: (carId: string) => void,
    onPcUpdated: (tier: number) => void,
    onOutfitChange?: (outfitId: string) => void,
    onCarTuningChange?: () => void,
    onFoodConsume?: (item: ShopItem) => void,
    onOpenMainMenu?: () => void
  ) {
    this.economy = economy;
    this.streamSim = streamSim;
    this.audio = audio;
    this.tutorial = tutorial;
    this.onVehicleSpawnRequest = onVehicleSpawn;
    this.onPcUpdated = onPcUpdated;
    this.onOutfitChange = onOutfitChange;
    this.onCarTuningChange = onCarTuningChange;
    this.onFoodConsume = onFoodConsume;
    this.onOpenMainMenu = onOpenMainMenu;

    this.containerEl = document.getElementById('phone-container')!;
    this.clockEl = document.getElementById('phone-clock')!;
    this.widgetBalanceEl = document.getElementById('phone-widget-balance')!;
    this.widgetStreamPreviewEl = document.getElementById('widget-stream-preview')!;
    this.pcShopListEl = document.getElementById('pc-shop-list')!;
    this.carDealerListEl = document.getElementById('car-dealer-list')!;
    this.streamContentEl = document.getElementById('stream-studio-content')!;
    this.bankContentEl = document.getElementById('bank-content')!;

    this.silpoListEl = document.getElementById('silpo-shop-list');
    this.gearListEl = document.getElementById('gear-shop-list');
    this.clothesListEl = document.getElementById('clothes-shop-list');
    this.tuningListEl = document.getElementById('tuning-shop-list');

    this.initListeners();
    this.startClock();
    this.renderPcShop();
    this.renderCarDealer();
    this.renderStreamStudio();
    this.renderBank();
    this.renderSilpo();
    this.renderGear();
    this.renderClothes();
    this.renderTuning();
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
    this.containerEl.classList.remove('closed');
    this.audio.playClick();
    this.updateWidgets();

    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch {
        // Ignored
      }
    }

    // Advance tutorial step 3 -> 4 if needed
    if (this.tutorial.getCurrentStep() === 3) {
      this.tutorial.advanceStep(3);
    }
  }

  public close(): void {
    this.isOpened = false;
    this.containerEl.classList.add('closed');
    this.audio.playClick();
    this.showHomeScreen();
  }

  private startClock(): void {
    const updateTime = () => {
      const now = new Date();
      this.clockEl.textContent = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  private initListeners(): void {
    // Open/Close triggers
    document.getElementById('btn-toggle-phone')?.addEventListener('click', () => this.toggle());
    document.getElementById('phone-home-btn')?.addEventListener('click', () => {
      if (this.currentApp) {
        this.showHomeScreen();
      } else {
        this.close();
      }
    });

    // Return to main menu from phone settings
    document.getElementById('btn-phone-return-menu')?.addEventListener('click', () => {
      this.close();
      this.onOpenMainMenu?.();
    });

    // App icons click
    const appIcons = this.containerEl.querySelectorAll('.app-icon-item');
    appIcons.forEach((item) => {
      item.addEventListener('click', () => {
        const appId = item.getAttribute('data-app');
        if (appId) {
          this.openApp(appId);
        }
      });
    });

    // Back buttons inside apps
    const backButtons = this.containerEl.querySelectorAll('.btn-app-back');
    backButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        this.showHomeScreen();
      });
    });

    // Listen to economy updates
    this.economy.onBalanceChange((bal) => {
      this.widgetBalanceEl.textContent = bal.toLocaleString('uk-UA');
      this.containerEl.querySelectorAll('.app-bal-val').forEach((el) => {
        el.textContent = bal.toLocaleString('uk-UA');
      });
      this.renderPcShop();
      this.renderCarDealer();
      this.renderBank();
      this.renderSilpo();
      this.renderGear();
      this.renderClothes();
      this.renderTuning();
    });

    // Listen to stream updates
    this.streamSim.onStateChange((isStreaming, viewers) => {
      this.updateStreamWidget(isStreaming, viewers);
      this.renderStreamStudio();
    });

    this.streamSim.onChat((msg) => {
      this.appendChatMessage(msg);
    });
  }

  public openSpecificApp(appId: string): void {
    if (!this.isOpened) {
      this.open();
    }
    this.openApp(appId);
  }

  private showHomeScreen(): void {
    this.currentApp = null;
    document.getElementById('phone-home-screen')?.classList.remove('hidden');
    this.containerEl.querySelectorAll('.phone-app-view').forEach((view) => view.classList.add('hidden'));
    this.updateWidgets();
  }

  private openApp(appId: string): void {
    this.audio.playClick();
    this.currentApp = appId;
    document.getElementById('phone-home-screen')?.classList.add('hidden');
    this.containerEl.querySelectorAll('.phone-app-view').forEach((view) => view.classList.add('hidden'));

    if (appId === 'pc-shop') {
      document.getElementById('app-pc-shop')?.classList.remove('hidden');
      this.renderPcShop();
    } else if (appId === 'car-dealer') {
      document.getElementById('app-car-dealer')?.classList.remove('hidden');
      this.renderCarDealer();
    } else if (appId === 'silpo') {
      document.getElementById('app-silpo')?.classList.remove('hidden');
      this.renderSilpo();
    } else if (appId === 'gear') {
      document.getElementById('app-gear')?.classList.remove('hidden');
      this.renderGear();
    } else if (appId === 'clothes') {
      document.getElementById('app-clothes')?.classList.remove('hidden');
      this.renderClothes();
    } else if (appId === 'tuning') {
      document.getElementById('app-tuning')?.classList.remove('hidden');
      this.renderTuning();
    } else if (appId === 'stream-studio') {
      document.getElementById('app-stream-studio')?.classList.remove('hidden');
      this.renderStreamStudio();
    } else if (appId === 'bank') {
      document.getElementById('app-bank')?.classList.remove('hidden');
      this.renderBank();
    } else if (appId === 'gps') {
      // Toggle large map modal
      document.getElementById('map-modal')?.classList.remove('hidden');
      this.close();
    } else if (appId === 'settings') {
      document.getElementById('app-settings')?.classList.remove('hidden');
    }
  }

  public updateWidgets(): void {
    const bal = this.economy.getBalance();
    this.widgetBalanceEl.textContent = bal.toLocaleString('uk-UA');
    this.containerEl.querySelectorAll('.app-bal-val').forEach((el) => {
      el.textContent = bal.toLocaleString('uk-UA');
    });
    this.updateStreamWidget(this.streamSim.isStreaming(), this.streamSim.getViewers());
  }

  private updateStreamWidget(isStreaming: boolean, viewers: number): void {
    if (isStreaming) {
      this.widgetStreamPreviewEl.innerHTML = `
        <span class="widget-title" style="color: #ef4444;">🔴 LIVE ЕФІР</span>
        <div class="widget-stream-info">${viewers.toLocaleString('uk-UA')} глядачів</div>
        <span class="widget-sub">${this.streamSim.getActiveCategory().name}</span>
      `;
    } else {
      const pc = this.economy.getActivePc();
      this.widgetStreamPreviewEl.innerHTML = `
        <span class="widget-title">Канал: Offline</span>
        <div class="widget-stream-info">${pc ? 'Готовий до стріму' : 'Купи ПК для запуску!'}</div>
      `;
    }
  }

  // ==================== PC SHOP ====================
  private renderPcShop(): void {
    this.pcShopListEl.innerHTML = '';
    const balance = this.economy.getBalance();
    const activePc = this.economy.getActivePc();

    PC_SETUPS.forEach((pc, idx) => {
      const isOwned = this.economy.hasPc(pc.id);
      const isActive = activePc?.id === pc.id;
      const canAfford = balance >= pc.price;

      const card = document.createElement('div');
      card.className = `shop-card ${isOwned ? 'owned' : ''}`;

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <h4>${pc.name}</h4>
            <span class="card-subtitle">${pc.qualityTag}</span>
          </div>
          <div class="card-price">${pc.price.toLocaleString('uk-UA')} ₴</div>
        </div>
        <p class="card-desc">${pc.description}</p>
        <div class="card-specs">
          ${pc.components.map((c) => `<span class="spec-badge">📦 ${c}</span>`).join('')}
        </div>
        <div class="card-actions">
          ${
            isActive
              ? `<button class="btn-select-vehicle active" disabled>✓ Встановлено на столі</button>`
              : isOwned
              ? `<button class="btn-select-vehicle btn-use-pc" data-id="${pc.id}">Використовувати</button>`
              : `<button class="btn-buy btn-buy-pc" data-id="${pc.id}" ${!canAfford ? 'disabled' : ''}>
                  ${canAfford ? 'Купити комп\'ютер' : 'Недостатньо коштів'}
                </button>`
          }
        </div>
      `;

      // Buy button event
      const buyBtn = card.querySelector('.btn-buy-pc');
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          if (this.economy.buyPc(pc)) {
            this.audio.playCashRegister();
            try {
              confetti({ particleCount: 35, spread: 50, origin: { x: 0.85, y: 0.85 } });
            } catch { /* ignored */ }

            if (this.onPcUpdated) {
              this.onPcUpdated(idx);
            }

            // Check tutorial step 4 -> 5
            if (this.tutorial.getCurrentStep() === 4) {
              this.tutorial.advanceStep(4);
            }

            this.renderPcShop();
          }
        });
      }

      // Switch active PC
      const useBtn = card.querySelector('.btn-use-pc');
      if (useBtn) {
        useBtn.addEventListener('click', () => {
          this.audio.playClick();
          this.economy.buyPc({ ...pc, price: 0 }); // set active without cost
          if (this.onPcUpdated) {
            this.onPcUpdated(idx);
          }
          this.renderPcShop();
        });
      }

      this.pcShopListEl.appendChild(card);
    });
  }

  // ==================== CAR DEALERSHIP ====================
  private renderCarDealer(): void {
    this.carDealerListEl.innerHTML = '';
    const balance = this.economy.getBalance();
    const activeVehicleType = this.economy.getActiveVehicleType();

    CARS_CATALOG.forEach((car) => {
      const isOwned = this.economy.hasCar(car.id);
      const isActive = activeVehicleType === car.id;
      const canAfford = balance >= car.price;

      const card = document.createElement('div');
      card.className = `car-card ${isOwned ? 'owned' : ''}`;

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <h4>${car.name}</h4>
            <span class="card-subtitle" style="color: #f59e0b;">Стан: ${'⭐'.repeat(car.conditionScore)} (${car.condition})</span>
          </div>
          <div class="card-price">${car.price.toLocaleString('uk-UA')} ₴</div>
        </div>
        <p class="card-desc">${car.description}</p>
        <div class="card-specs">
          <span class="spec-badge">⚡ Швидкість: ${car.maxSpeed} км/год</span>
          <span class="spec-badge">🕹️ Керованість: ${Math.round(car.handling * 100)}%</span>
        </div>
        <div class="card-actions">
          ${
            isActive
              ? `<button class="btn-select-vehicle active" disabled>✓ Активне авто біля будинку</button>`
              : isOwned
              ? `<button class="btn-select-vehicle btn-spawn-car" data-id="${car.id}">Викликати до будинку</button>`
              : `<button class="btn-buy btn-buy-car" data-id="${car.id}" ${!canAfford ? 'disabled' : ''}>
                  ${canAfford ? 'Придбати авто' : 'Недостатньо коштів'}
                </button>`
          }
        </div>
      `;

      // Buy button
      const buyBtn = card.querySelector('.btn-buy-car');
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          if (this.economy.buyCar(car)) {
            this.audio.playCashRegister();
            try {
              confetti({ particleCount: 60, spread: 80, origin: { x: 0.85, y: 0.85 } });
            } catch { /* ignored */ }

            if (this.onVehicleSpawnRequest) {
              this.onVehicleSpawnRequest(car.id);
            }

            // Check tutorial step 6
            if (this.tutorial.getCurrentStep() === 6) {
              this.tutorial.advanceStep(6);
            }

            this.renderCarDealer();
          }
        });
      }

      // Spawn / select button
      const spawnBtn = card.querySelector('.btn-spawn-car');
      if (spawnBtn) {
        spawnBtn.addEventListener('click', () => {
          this.audio.playClick();
          this.economy.setActiveVehicle(car.id);
          if (this.onVehicleSpawnRequest) {
            this.onVehicleSpawnRequest(car.id);
          }
          this.renderCarDealer();
        });
      }

      this.carDealerListEl.appendChild(card);
    });
  }

  // ==================== STREAM STUDIO ====================
  private renderStreamStudio(): void {
    const pc = this.economy.getActivePc();
    const isStreaming = this.streamSim.isStreaming();
    const viewers = this.streamSim.getViewers();
    const activeCategory = this.streamSim.getActiveCategory();

    if (!pc) {
      this.streamContentEl.innerHTML = `
        <div class="app-subheader-note" style="background: rgba(239, 68, 68, 0.2);">
          ⚠️ У тебе ще немає комп'ютера! Перейди в <strong>Магазин ПК</strong> та придбай стартовий сетап <strong>"Old Comp"</strong> за 100 ₴.
        </div>
        <button class="btn-buy" style="margin-top: 10px;" id="btn-goto-pc-shop">Перейти в Магазин ПК</button>
      `;
      this.streamContentEl.querySelector('#btn-goto-pc-shop')?.addEventListener('click', () => {
        this.openApp('pc-shop');
      });
      return;
    }

    this.streamContentEl.innerHTML = `
      <div class="stream-panel">
        <div class="stream-video-preview">
          <div class="stream-overlay-info">
            <span class="badge-live">${isStreaming ? 'LIVE' : 'OFFLINE'}</span>
            <span class="badge-viewers">👥 ${viewers.toLocaleString('uk-UA')}</span>
          </div>
          <div class="stream-game-display">${isStreaming ? activeCategory.name : 'Трансляція зупинена'}</div>
          <div class="stream-quality-tag">🖥️ ${pc.name} (${pc.qualityTag})</div>
        </div>

        <div class="stream-controls-row">
          ${
            !isStreaming
              ? `
              <label style="font-size: 11px; font-weight: 700; color: #9ca3af;">ОБЕРІТЬ ГРУ / КАТЕГОРІЮ:</label>
              <select class="game-select" id="stream-category-select">
                ${STREAM_CATEGORIES.map(
                  (cat) => `
                  <option value="${cat.id}" ${cat.id === activeCategory.id ? 'selected' : ''}>
                    ${cat.icon} ${cat.name}
                  </option>
                `
                ).join('')}
              </select>
              <button class="btn-stream-toggle" id="btn-start-stream">🚀 РОЗПОЧАТИ СТРІМ</button>
            `
              : `
              <button class="btn-stream-toggle streaming" id="btn-stop-stream">⏹️ ЗАВЕРШИТИ СТРІМ ТА ЗАБРАТИ ДОХІД</button>
            `
          }
        </div>

        <div class="stream-chat-box" id="stream-chat-list">
          <!-- Chat messages rendered dynamically -->
        </div>
      </div>
    `;

    // Category select event
    const catSelect = this.streamContentEl.querySelector('#stream-category-select') as HTMLSelectElement | null;
    if (catSelect) {
      catSelect.addEventListener('change', () => {
        const found = STREAM_CATEGORIES.find((c) => c.id === catSelect.value);
        if (found) this.streamSim.setCategory(found);
      });
    }

    // Toggle stream events
    this.streamContentEl.querySelector('#btn-start-stream')?.addEventListener('click', () => {
      this.audio.playClick();
      if (this.streamSim.startStream()) {
        // Check tutorial step 5 -> 6
        if (this.tutorial.getCurrentStep() === 5) {
          this.tutorial.advanceStep(5);
        }
        this.renderStreamStudio();
      }
    });

    this.streamContentEl.querySelector('#btn-stop-stream')?.addEventListener('click', () => {
      this.audio.playClick();
      this.streamSim.stopStream();
      this.renderStreamStudio();
    });

    // Populate existing chat history
    const chatBox = this.streamContentEl.querySelector('#stream-chat-list');
    if (chatBox) {
      this.streamSim.getChatHistory().forEach((msg) => {
        this.renderChatMessageEl(chatBox as HTMLElement, msg);
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  private appendChatMessage(msg: ChatMessage): void {
    const chatBox = document.getElementById('stream-chat-list');
    if (chatBox) {
      this.renderChatMessageEl(chatBox, msg);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  private renderChatMessageEl(container: HTMLElement, msg: ChatMessage): void {
    const div = document.createElement('div');
    div.className = `chat-msg ${msg.isDonation ? 'chat-donation' : ''}`;
    div.innerHTML = `<span class="chat-user">${msg.user}:</span> <span class="chat-text">${msg.text}</span>`;
    container.appendChild(div);
  }

  // ==================== MONOBANK ====================
  private renderBank(): void {
    const balance = this.economy.getBalance();
    const txs = this.economy.getTransactions();

    this.bankContentEl.innerHTML = `
      <div style="background: linear-gradient(135deg, #18181b, #09090b); border: 1px solid #3f3f46; border-radius: 18px; padding: 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 800; font-size: 14px; letter-spacing: 1px;">monobank</span>
          <span style="font-size: 20px;">🐱</span>
        </div>
        <div style="margin: 20px 0 8px;">
          <div style="font-size: 11px; color: #a1a1aa;">БАЛАНС КАРТКИ</div>
          <div style="font-size: 28px; font-weight: 800; color: #fff;">${balance.toLocaleString('uk-UA')} ₴</div>
        </div>
        <div style="font-family: monospace; font-size: 12px; color: #71717a;">5375 •••• •••• 2026</div>
      </div>

      <div style="font-size: 12px; font-weight: 700; color: #9ca3af; margin-top: 10px;">ОСТАННІ ТРАНЗАКЦІЇ:</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${txs.slice(0, 8).map((tx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.04); padding: 10px 12px; border-radius: 10px; font-size: 12px;">
            <div>
              <div style="font-weight: 600; color: #fff;">${tx.title}</div>
              <div style="font-size: 10px; color: #71717a;">${tx.time}</div>
            </div>
            <div style="font-weight: 800; font-family: monospace; color: ${tx.amount >= 0 ? '#10b981' : '#ef4444'};">
              ${tx.amount >= 0 ? `+${tx.amount}` : tx.amount} ₴
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ==================== СІЛЬПО 24/7 ====================
  private renderSilpo(): void {
    const listEl = this.silpoListEl;
    if (!listEl) return;
    listEl.innerHTML = '';
    const balance = this.economy.getBalance();

    SILPO_ITEMS.forEach((item) => {
      const canAfford = balance >= item.price;
      const card = document.createElement('div');
      card.className = 'shop-card';

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <h4>${item.icon} ${item.name}</h4>
            <span class="card-subtitle">${item.effect.bonusText || ''}</span>
          </div>
          <div class="card-price">${item.price.toLocaleString('uk-UA')} ₴</div>
        </div>
        <p class="card-desc">${item.description}</p>
        <div class="card-specs">
          <span class="spec-badge" style="background: rgba(234, 88, 12, 0.2); border-color: rgba(234, 88, 12, 0.4); color: #fdba74;">
            ${item.badge ? item.badge : 'Смаколик'}
          </span>
        </div>
        <div class="card-actions">
          <button class="btn-buy btn-buy-silpo" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? `Купити смаколик (${item.price} ₴)` : 'Недостатньо коштів'}
          </button>
        </div>
      `;

      card.querySelector('.btn-buy-silpo')?.addEventListener('click', () => {
        if (this.economy.buyShopItem(item)) {
          this.audio.playCashRegister();
          try {
            confetti({ particleCount: 25, spread: 45, origin: { x: 0.85, y: 0.85 } });
          } catch {}
          this.onFoodConsume?.(item);
          this.renderSilpo();
        }
      });

      listEl.appendChild(card);
    });
  }

  // ==================== ДЕВАЙСИ (ROZETKA) ====================
  private renderGear(): void {
    const listEl = this.gearListEl;
    if (!listEl) return;
    listEl.innerHTML = '';
    const balance = this.economy.getBalance();

    GEAR_ITEMS.forEach((item) => {
      const isOwned = this.economy.hasItem(item.id);
      const canAfford = balance >= item.price;
      const card = document.createElement('div');
      card.className = `shop-card ${isOwned ? 'owned' : ''}`;

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <h4>${item.icon} ${item.name}</h4>
            <span class="card-subtitle">${item.effect.bonusText || ''}</span>
          </div>
          <div class="card-price">${item.price.toLocaleString('uk-UA')} ₴</div>
        </div>
        <p class="card-desc">${item.description}</p>
        <div class="card-specs">
          <span class="spec-badge" style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4); color: #6ee7b7;">
            ${item.badge ? item.badge : 'Девайс'}
          </span>
        </div>
        <div class="card-actions">
          ${
            isOwned
              ? `<button class="btn-select-vehicle active" disabled>✓ Встановлено у студії</button>`
              : `<button class="btn-buy btn-buy-gear" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
                  ${canAfford ? `Купити обладнання (${item.price} ₴)` : 'Недостатньо коштів'}
                </button>`
          }
        </div>
      `;

      card.querySelector('.btn-buy-gear')?.addEventListener('click', () => {
        if (this.economy.buyShopItem(item)) {
          this.audio.playCashRegister();
          try {
            confetti({ particleCount: 30, spread: 50, origin: { x: 0.85, y: 0.85 } });
          } catch {}
          this.renderGear();
        }
      });

      listEl.appendChild(card);
    });
  }

  // ==================== ОДЯГ & СКІНИ (DRIP STORE) ====================
  private renderClothes(): void {
    const listEl = this.clothesListEl;
    if (!listEl) return;
    listEl.innerHTML = '';
    const balance = this.economy.getBalance();
    const activeOutfit = this.economy.getActiveOutfit();

    CLOTHES_ITEMS.forEach((item) => {
      const isOwned = this.economy.hasItem(item.id);
      const isActive = activeOutfit === item.effect.val;
      const canAfford = balance >= item.price;
      const card = document.createElement('div');
      card.className = `shop-card ${isActive ? 'owned' : ''}`;

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <h4>${item.icon} ${item.name}</h4>
            <span class="card-subtitle">${item.effect.bonusText || ''}</span>
          </div>
          <div class="card-price">${item.price.toLocaleString('uk-UA')} ₴</div>
        </div>
        <p class="card-desc">${item.description}</p>
        <div class="card-specs">
          <span class="spec-badge" style="background: rgba(236, 72, 153, 0.2); border-color: rgba(236, 72, 153, 0.4); color: #f472b6;">
            ${item.badge ? item.badge : 'Скін'}
          </span>
        </div>
        <div class="card-actions">
          ${
            isActive
              ? `<button class="btn-select-vehicle active" disabled>✓ Одягнено зараз</button>`
              : isOwned
              ? `<button class="btn-select-vehicle btn-use-outfit" data-val="${item.effect.val}">Одягнути скін</button>`
              : `<button class="btn-buy btn-buy-clothes" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
                  ${canAfford ? `Придбати (${item.price} ₴)` : 'Недостатньо коштів'}
                </button>`
          }
        </div>
      `;

      card.querySelector('.btn-buy-clothes')?.addEventListener('click', () => {
        if (this.economy.buyShopItem(item)) {
          this.audio.playCashRegister();
          try {
            confetti({ particleCount: 30, spread: 50, origin: { x: 0.85, y: 0.85 } });
          } catch {}
          this.onOutfitChange?.(item.effect.val as string);
          this.renderClothes();
        }
      });

      card.querySelector('.btn-use-outfit')?.addEventListener('click', () => {
        this.audio.playClick();
        this.economy.buyShopItem({ ...item, price: 0 }); // changes activeOutfit without cost
        this.onOutfitChange?.(item.effect.val as string);
        this.renderClothes();
      });

      listEl.appendChild(card);
    });
  }

  // ==================== СТО ТЮНІНГ ====================
  private renderTuning(): void {
    const listEl = this.tuningListEl;
    if (!listEl) return;
    listEl.innerHTML = '';
    const balance = this.economy.getBalance();
    const currentColor = this.economy.getCarCustomColor();
    const hasNitro = this.economy.hasNitro();
    const currentUnderglow = this.economy.getUnderglowColor();

    TUNING_ITEMS.forEach((item) => {
      let isInstalled = false;
      if (item.effect.type === 'nitro') {
        isInstalled = hasNitro;
      } else if (item.effect.type === 'car_paint') {
        isInstalled = currentColor === item.effect.val;
      } else if (item.effect.type === 'underglow') {
        isInstalled = currentUnderglow === item.effect.val;
      }

      const canAfford = balance >= item.price;
      const card = document.createElement('div');
      card.className = `shop-card ${isInstalled ? 'owned' : ''}`;

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <h4>${item.icon} ${item.name}</h4>
            <span class="card-subtitle">${item.effect.bonusText || ''}</span>
          </div>
          <div class="card-price">${item.price.toLocaleString('uk-UA')} ₴</div>
        </div>
        <p class="card-desc">${item.description}</p>
        <div class="card-specs">
          <span class="spec-badge" style="background: rgba(234, 179, 8, 0.2); border-color: rgba(234, 179, 8, 0.4); color: #fde047;">
            ${item.badge ? item.badge : 'Тюнінг'}
          </span>
        </div>
        <div class="card-actions">
          ${
            isInstalled
              ? `<button class="btn-select-vehicle active" disabled>✓ Встановлено на авто</button>`
              : `<button class="btn-buy btn-buy-tuning" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
                  ${canAfford ? `Встановити (${item.price} ₴)` : 'Недостатньо коштів'}
                </button>`
          }
        </div>
      `;

      card.querySelector('.btn-buy-tuning')?.addEventListener('click', () => {
        if (this.economy.buyShopItem(item)) {
          this.audio.playCashRegister();
          try {
            confetti({ particleCount: 35, spread: 55, origin: { x: 0.85, y: 0.85 } });
          } catch {}
          this.onCarTuningChange?.();
          this.renderTuning();
        }
      });

      listEl.appendChild(card);
    });
  }
}
