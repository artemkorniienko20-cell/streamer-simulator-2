import { UserAccount } from '../types';

export const DEV_EMAIL = 'korn333@gmail.com';

export class AuthSystem {
  private currentUser: UserAccount;
  private listeners: Array<(user: UserAccount) => void> = [];

  constructor() {
    this.currentUser = this.loadStoredUser();
  }

  private loadStoredUser(): UserAccount {
    const saved = localStorage.getItem('streamer_sim_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.isDev = parsed.email?.toLowerCase().trim() === DEV_EMAIL.toLowerCase();
        if (parsed.isDev && parsed.name?.includes('DEV')) {
          parsed.name = 'Korn';
        }
        return parsed;
      } catch {
        // Fallback
      }
    }

    // Default starting account
    return {
      id: 'usr_guest',
      email: 'guest@streamer.ua',
      name: 'Гість Стрімер',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=StreamerUA',
      isDev: false
    };
  }

  public getCurrentUser(): UserAccount {
    return this.currentUser;
  }

  public isDevAccount(): boolean {
    return this.currentUser.email.toLowerCase().trim() === DEV_EMAIL.toLowerCase();
  }

  public signIn(email: string, name?: string, avatar?: string): UserAccount {
    const cleanEmail = email.trim();
    const isDev = cleanEmail.toLowerCase() === DEV_EMAIL.toLowerCase();
    
    let defaultName = name;
    if (!defaultName) {
      if (isDev) {
        defaultName = 'Korn';
      } else {
        defaultName = cleanEmail.split('@')[0] || 'Стрімер';
      }
    }

    const defaultAvatar = avatar || (isDev 
      ? 'https://api.dicebear.com/7.x/bottts/svg?seed=KornDevCrown' 
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`);

    this.currentUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      name: defaultName,
      avatar: defaultAvatar,
      isDev
    };

    localStorage.setItem('streamer_sim_user', JSON.stringify(this.currentUser));
    this.notifyListeners();
    return this.currentUser;
  }

  public signOut(): void {
    this.currentUser = {
      id: 'usr_guest_' + Date.now().toString().slice(-4),
      email: 'guest@streamer.ua',
      name: 'Гість Стрімер',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest',
      isDev: false
    };
    localStorage.removeItem('streamer_sim_user');
    this.notifyListeners();
  }

  public onAuthChange(cb: (user: UserAccount) => void): void {
    this.listeners.push(cb);
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }
}
