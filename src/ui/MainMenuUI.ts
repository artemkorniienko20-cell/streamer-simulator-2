import { AuthSystem } from '../systems/AuthSystem';
import { MultiplayerSystem } from '../systems/MultiplayerSystem';
import { AudioManager } from '../core/AudioManager';
import { LobbyRoom, UserAccount } from '../types';

export class MainMenuUI {
  private containerEl: HTMLElement;
  private auth: AuthSystem;
  private multiplayer: MultiplayerSystem;
  private audio: AudioManager;

  private isVisible: boolean = true;
  private onStartGameCallback?: (mode: 'solo' | 'multiplayer') => void;

  constructor(
    auth: AuthSystem,
    multiplayer: MultiplayerSystem,
    audio: AudioManager,
    onStartGame: (mode: 'solo' | 'multiplayer') => void
  ) {
    this.auth = auth;
    this.multiplayer = multiplayer;
    this.audio = audio;
    this.onStartGameCallback = onStartGame;

    this.containerEl = this.createMenuElement();
    document.body.appendChild(this.containerEl);

    this.initListeners();
    this.updateUserDisplay();
  }

  private createMenuElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'main-menu-container';
    el.className = 'main-menu-overlay';

    el.innerHTML = `
      <!-- Top Bar: Google Account Profile -->
      <div class="menu-top-bar">
        <div class="menu-brand">
          <span class="game-logo-icon">🎮</span>
          <div>
            <h1 class="menu-game-title">STREAMER SIMULATOR 2</h1>
            <span class="menu-game-subtitle">UKRAINIAN EDITION • GTA 5 CITY</span>
          </div>
        </div>

        <div class="google-profile-card" id="btn-open-google-modal" title="Натисніть для зміни Google акаунту">
          <img id="menu-user-avatar" src="" alt="Avatar" class="menu-avatar" />
          <div class="menu-user-info">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span id="menu-user-name" class="menu-name">Гість</span>
              <span id="menu-dev-badge" class="badge-dev hidden">👑 DEV / ВЛАСНИК</span>
            </div>
            <span id="menu-user-email" class="menu-email">guest@streamer.ua</span>
          </div>
          <button class="btn-switch-account">Змінити акаунт</button>
        </div>
      </div>

      <!-- Main Navigation Menu -->
      <div class="menu-center-panel" id="menu-main-panel">
        <div class="menu-hero-card">
          <div class="hero-tag">🌟 ОНОВЛЕННЯ: МАГАЗИНИ, ТЮНІНГ ТА МУЛЬТИПЛЕЄР</div>
          <p class="hero-desc">
            Розпочни свій шлях від старого комп'ютера за 100 ₴ до топ-стрімера на ультра-сетапі з суперкарами та відкритим 3D містом!
          </p>
        </div>

        <div class="menu-actions-grid">
          <button id="btn-play-solo" class="btn-menu-action btn-solo">
            <span class="action-icon">🎮</span>
            <div class="action-text">
              <h3>ОДИН</h3>
              <p>Одиночна гра у відкритому місті. Виконуй квести, купуй авто, стрім та прокачуй сетап!</p>
            </div>
            <span class="action-arrow">➔</span>
          </button>

          <button id="btn-play-multiplayer" class="btn-menu-action btn-multi">
            <span class="action-icon">🌐</span>
            <div class="action-text">
              <h3>МУЛЬТИПЛЕЄР</h3>
              <p>Грай разом із другом! Створюй публічні кімнати або закриті лобі з паролем.</p>
            </div>
            <span class="action-arrow">➔</span>
          </button>
        </div>
      </div>

      <!-- Multiplayer Sub-Panel (Lobbies Browser) -->
      <div class="menu-center-panel hidden" id="menu-multiplayer-panel">
        <div class="multi-header-row">
          <button id="btn-back-to-main" class="btn-secondary" style="padding: 8px 16px;">
            ‹ Назад до меню
          </button>
          <h2 style="margin: 0; color: #fff; font-size: 20px;">🌐 МУЛЬТИПЛЕЄР ЛОБІ</h2>
          <button id="btn-refresh-lobbies" class="btn-secondary" style="padding: 8px 16px;">
            🔄 Оновити список
          </button>
        </div>

        <!-- Tabs -->
        <div class="multi-tabs">
          <button class="multi-tab active" data-tab="public-lobbies">📋 Публічні лобі</button>
          <button class="multi-tab" data-tab="create-lobby">➕ Створити лобі</button>
          <button class="multi-tab" data-tab="join-password">🔑 Вхід за паролем</button>
        </div>

        <!-- Tab 1: Public Lobbies List -->
        <div class="multi-tab-content" id="tab-public-lobbies">
          <div class="lobbies-list" id="public-lobbies-container">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Tab 2: Create Lobby -->
        <div class="multi-tab-content hidden" id="tab-create-lobby">
          <div class="create-lobby-form">
            <label class="form-label">
              <span>Назва лобі:</span>
              <input type="text" id="input-create-lobby-name" class="form-input" placeholder="Наприклад: Стрім із друзями #1" />
            </label>

            <div class="lobby-type-selector">
              <label class="radio-card">
                <input type="radio" name="lobby-access-type" value="public" checked />
                <div>
                  <strong>🟢 Публічне лобі</strong>
                  <p>Буде відображатися у списку публічних кімнат для всіх гравців</p>
                </div>
              </label>

              <label class="radio-card">
                <input type="radio" name="lobby-access-type" value="private" />
                <div>
                  <strong>🔒 Приватне лобі з паролем</strong>
                  <p>Вхід лише для друзів, які знають пароль</p>
                </div>
              </label>
            </div>

            <div id="create-password-group" class="hidden" style="margin-top: 12px;">
              <label class="form-label">
                <span>Встановіть пароль для кімнати:</span>
                <input type="password" id="input-create-lobby-pass" class="form-input" placeholder="Введіть пароль (наприклад: 777)" />
              </label>
            </div>

            <button id="btn-submit-create-lobby" class="btn-primary" style="margin-top: 16px; width: 100%; padding: 14px; font-size: 15px;">
              🚀 Створити лобі та почати гру
            </button>
          </div>
        </div>

        <!-- Tab 3: Join Private by Password -->
        <div class="multi-tab-content hidden" id="tab-join-password">
          <div class="create-lobby-form">
            <label class="form-label">
              <span>Оберіть кімнату або введіть ID:</span>
              <select id="select-private-room" class="form-input"></select>
            </label>

            <label class="form-label" style="margin-top: 14px;">
              <span>Пароль кімнати:</span>
              <input type="password" id="input-join-pass" class="form-input" placeholder="Введіть пароль від лобі" />
            </label>

            <button id="btn-submit-join-pass" class="btn-primary" style="margin-top: 18px; width: 100%; padding: 14px; font-size: 15px;">
              🔓 Увійти в приватну кімнату
            </button>
          </div>
        </div>
      </div>

      <!-- Google Sign-In Modal -->
      <div class="modal-backdrop hidden" id="google-auth-modal">
        <div class="modal-card google-modal-card">
          <div class="google-modal-header">
            <svg viewBox="0 0 48 48" width="32" height="32">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <div>
              <h3 style="margin: 0; color: #fff; font-size: 16px;">Вхід через обліковий запис Google</h3>
              <p style="margin: 2px 0 0; font-size: 11px; color: #94a3b8;">Оберіть акаунт або введіть власну Google пошту</p>
            </div>
            <button class="btn-close" id="btn-close-google-modal">✕</button>
          </div>

          <div class="google-accounts-list">
            <!-- Special Dev Account Option -->
            <div class="google-account-item dev-account-highlight" data-email="korn333@gmail.com" data-name="Korn333 (👑 DEV Власник)">
              <div class="google-avatar-wrapper">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=KornDevCrown" class="google-avatar" />
                <span class="crown-icon">👑</span>
              </div>
              <div class="google-acc-details">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong>Korn333</strong>
                  <span class="badge-dev">DEV ВЛАСНИК</span>
                </div>
                <span class="acc-email">korn333@gmail.com</span>
                <span style="font-size: 10px; color: #f59e0b;">✨ Право видавати собі гроші на [M]!</span>
              </div>
              <span class="btn-select-acc">Обрати</span>
            </div>

            <!-- Standard Player Account -->
            <div class="google-account-item" data-email="artem.streamer@gmail.com" data-name="Артем Стрімер">
              <div class="google-avatar-wrapper">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ArtemStreamer" class="google-avatar" />
              </div>
              <div class="google-acc-details">
                <strong>Артем Стрімер</strong>
                <span class="acc-email">artem.streamer@gmail.com</span>
                <span style="font-size: 10px; color: #64748b;">Звичайний профіль гравця</span>
              </div>
              <span class="btn-select-acc">Обрати</span>
            </div>
          </div>

          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px; margin-top: 14px;">
            <div style="font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px;">АБО ВВЕДІТЬ СВОЮ GOOGLE ПОШТУ:</div>
            <div style="display: flex; gap: 8px;">
              <input type="email" id="input-custom-google-email" class="form-input" placeholder="your_email@gmail.com" />
              <button id="btn-login-custom-email" class="btn-primary" style="white-space: nowrap; font-weight: 700;">
                Увійти
              </button>
            </div>
          </div>

          <div style="margin-top: 14px; text-align: center;">
            <button id="btn-sign-out" class="btn-secondary" style="font-size: 12px; color: #ef4444; border-color: rgba(239,68,68,0.3);">
              Вийти з акаунта (Грати як гість)
            </button>
          </div>
        </div>
      </div>
    `;

    return el;
  }

  private initListeners(): void {
    // Mode Solo
    this.containerEl.querySelector('#btn-play-solo')?.addEventListener('click', () => {
      this.audio.playClick();
      this.hide();
      this.onStartGameCallback?.('solo');
    });

    // Mode Multiplayer Button -> open multiplayer sub-panel
    this.containerEl.querySelector('#btn-play-multiplayer')?.addEventListener('click', () => {
      this.audio.playClick();
      this.showMultiplayerPanel();
    });

    // Back to main
    this.containerEl.querySelector('#btn-back-to-main')?.addEventListener('click', () => {
      this.audio.playClick();
      this.showMainPanel();
    });

    // Refresh lobbies
    this.containerEl.querySelector('#btn-refresh-lobbies')?.addEventListener('click', () => {
      this.audio.playClick();
      this.renderPublicLobbies();
    });

    // Multiplayer tabs
    const tabs = this.containerEl.querySelectorAll('.multi-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.audio.playClick();
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const tabTarget = tab.getAttribute('data-tab');
        this.containerEl.querySelectorAll('.multi-tab-content').forEach((c) => c.classList.add('hidden'));

        if (tabTarget === 'public-lobbies') {
          this.containerEl.querySelector('#tab-public-lobbies')?.classList.remove('hidden');
          this.renderPublicLobbies();
        } else if (tabTarget === 'create-lobby') {
          this.containerEl.querySelector('#tab-create-lobby')?.classList.remove('hidden');
        } else if (tabTarget === 'join-password') {
          this.containerEl.querySelector('#tab-join-password')?.classList.remove('hidden');
          this.populatePrivateRoomsSelect();
        }
      });
    });

    // Radio public vs private in create lobby
    const radios = this.containerEl.querySelectorAll('input[name="lobby-access-type"]');
    radios.forEach((r) => {
      r.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const passGroup = this.containerEl.querySelector('#create-password-group');
        if (target.value === 'private') {
          passGroup?.classList.remove('hidden');
        } else {
          passGroup?.classList.add('hidden');
        }
      });
    });

    // Submit Create Lobby
    this.containerEl.querySelector('#btn-submit-create-lobby')?.addEventListener('click', () => {
      const nameInput = this.containerEl.querySelector('#input-create-lobby-name') as HTMLInputElement;
      const isPrivate = (this.containerEl.querySelector('input[name="lobby-access-type"]:checked') as HTMLInputElement)?.value === 'private';
      const passInput = this.containerEl.querySelector('#input-create-lobby-pass') as HTMLInputElement;

      const lobby = this.multiplayer.createLobby(
        nameInput.value,
        isPrivate,
        isPrivate ? passInput.value : undefined
      );

      this.audio.playCashRegister();
      this.hide();
      this.onStartGameCallback?.('multiplayer');
    });

    // Submit Join by Password
    this.containerEl.querySelector('#btn-submit-join-pass')?.addEventListener('click', () => {
      const select = this.containerEl.querySelector('#select-private-room') as HTMLSelectElement;
      const passInput = this.containerEl.querySelector('#input-join-pass') as HTMLInputElement;

      const roomId = select.value;
      if (!roomId) {
        alert('Будь ласка, оберіть кімнату!');
        return;
      }

      const res = this.multiplayer.joinLobby(roomId, passInput.value);
      if (res.success) {
        this.audio.playClick();
        this.hide();
        this.onStartGameCallback?.('multiplayer');
      } else {
        alert(res.error || 'Помилка входу у лобі!');
      }
    });

    // Google Modal triggers
    this.containerEl.querySelector('#btn-open-google-modal')?.addEventListener('click', () => {
      this.audio.playClick();
      this.openGoogleModal();
    });

    this.containerEl.querySelector('#btn-close-google-modal')?.addEventListener('click', () => {
      this.closeGoogleModal();
    });

    // Select account from quick list
    this.containerEl.querySelectorAll('.google-account-item').forEach((item) => {
      item.addEventListener('click', () => {
        const email = item.getAttribute('data-email') || '';
        const name = item.getAttribute('data-name') || '';
        this.auth.signIn(email, name);
        this.audio.playClick();
        this.closeGoogleModal();
        this.updateUserDisplay();
      });
    });

    // Custom email login
    this.containerEl.querySelector('#btn-login-custom-email')?.addEventListener('click', () => {
      const input = this.containerEl.querySelector('#input-custom-google-email') as HTMLInputElement;
      if (input.value && input.value.includes('@')) {
        this.auth.signIn(input.value);
        this.audio.playClick();
        this.closeGoogleModal();
        this.updateUserDisplay();
      } else {
        alert('Введіть коректну Google пошту!');
      }
    });

    // Sign out
    this.containerEl.querySelector('#btn-sign-out')?.addEventListener('click', () => {
      this.auth.signOut();
      this.audio.playClick();
      this.closeGoogleModal();
      this.updateUserDisplay();
    });

    // Auth state update
    this.auth.onAuthChange((user) => {
      this.updateUserDisplay();
      this.multiplayer.setCurrentUser(user);
    });
  }

  public showMainPanel(): void {
    this.containerEl.querySelector('#menu-main-panel')?.classList.remove('hidden');
    this.containerEl.querySelector('#menu-multiplayer-panel')?.classList.add('hidden');
  }

  public showMultiplayerPanel(): void {
    this.containerEl.querySelector('#menu-main-panel')?.classList.add('hidden');
    this.containerEl.querySelector('#menu-multiplayer-panel')?.classList.remove('hidden');
    this.renderPublicLobbies();
  }

  private renderPublicLobbies(): void {
    const container = this.containerEl.querySelector('#public-lobbies-container');
    if (!container) return;
    container.innerHTML = '';

    const lobbies = this.multiplayer.getPublicLobbies();

    if (lobbies.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #94a3b8;">
          <div style="font-size: 32px;">📭</div>
          <p>Наразі немає відкритих публічних лобі.</p>
          <p style="font-size: 12px; color: #64748b;">Створіть перше лобі у вкладці "➕ Створити лобі"!</p>
        </div>
      `;
      return;
    }

    lobbies.forEach((lobby) => {
      const card = document.createElement('div');
      card.className = 'lobby-card';

      card.innerHTML = `
        <div class="lobby-card-left">
          <div class="lobby-badge-public">🟢 ПУБЛІЧНЕ</div>
          <h4 class="lobby-card-title">${lobby.name}</h4>
          <div class="lobby-card-meta">
            <span>👤 Хост: <strong>${lobby.hostName}</strong></span>
            <span>👥 Гравці: <strong>${lobby.currentPlayers}/${lobby.maxPlayers}</strong></span>
            <span>📶 Пінг: <strong style="color: #10b981;">18 ms</strong></span>
          </div>
        </div>
        <button class="btn-join-lobby" data-id="${lobby.id}">
          Приєднатися ➔
        </button>
      `;

      card.querySelector('.btn-join-lobby')?.addEventListener('click', () => {
        const res = this.multiplayer.joinLobby(lobby.id);
        if (res.success) {
          this.audio.playClick();
          this.hide();
          this.onStartGameCallback?.('multiplayer');
        } else {
          alert(res.error || 'Не вдалося приєднатися');
        }
      });

      container.appendChild(card);
    });
  }

  private populatePrivateRoomsSelect(): void {
    const select = this.containerEl.querySelector('#select-private-room') as HTMLSelectElement;
    if (!select) return;
    select.innerHTML = '';

    const privateRooms = this.multiplayer.getAllLobbies().filter((l) => l.isPrivate);

    if (privateRooms.length === 0) {
      select.innerHTML = '<option value="">Немає створених приватних кімнат</option>';
      return;
    }

    privateRooms.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `🔒 ${r.name} (Хост: ${r.hostName}, ${r.currentPlayers}/${r.maxPlayers})`;
      select.appendChild(opt);
    });
  }

  public updateUserDisplay(): void {
    const user = this.auth.getCurrentUser();
    const avatarEl = this.containerEl.querySelector('#menu-user-avatar') as HTMLImageElement;
    const nameEl = this.containerEl.querySelector('#menu-user-name');
    const emailEl = this.containerEl.querySelector('#menu-user-email');
    const devBadgeEl = this.containerEl.querySelector('#menu-dev-badge');

    if (avatarEl) avatarEl.src = user.avatar;
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;

    if (devBadgeEl) {
      if (this.auth.isDevAccount()) {
        devBadgeEl.classList.remove('hidden');
      } else {
        devBadgeEl.classList.add('hidden');
      }
    }
  }

  private openGoogleModal(): void {
    this.containerEl.querySelector('#google-auth-modal')?.classList.remove('hidden');
  }

  private closeGoogleModal(): void {
    this.containerEl.querySelector('#google-auth-modal')?.classList.add('hidden');
  }

  public show(): void {
    this.isVisible = true;
    this.containerEl.classList.remove('hidden');
    this.showMainPanel();
    this.updateUserDisplay();
  }

  public hide(): void {
    this.isVisible = false;
    this.containerEl.classList.add('hidden');
  }

  public isMenuVisible(): boolean {
    return this.isVisible;
  }
}
