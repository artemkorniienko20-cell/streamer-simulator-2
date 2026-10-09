import confetti from 'canvas-confetti';
import { StreamCategory, ChatMessage } from '../types';
import { STREAM_CATEGORIES, CHAT_USERNAMES, CHAT_COMMENTS, DONATION_MESSAGES } from '../data/items';
import { EconomySystem } from './EconomySystem';
import { AudioManager } from '../core/AudioManager';

export class StreamSimulation {
  private economy: EconomySystem;
  private audio: AudioManager;

  private streaming: boolean = false;
  private activeCategory: StreamCategory = STREAM_CATEGORIES[0];
  private viewers: number = 0;
  private peakViewers: number = 0;
  private streamSeconds: number = 0;
  private totalDonationsEarned: number = 0;

  private chatHistory: ChatMessage[] = [];
  private updateInterval: number | null = null;
  private chatInterval: number | null = null;
  private donationInterval: number | null = null;

  private onStateChangeCallbacks: Array<(streaming: boolean, viewers: number) => void> = [];
  private onChatCallbacks: Array<(msg: ChatMessage) => void> = [];
  private onDonationCallbacks: Array<(donor: string, amount: number, msg: string) => void> = [];

  constructor(economy: EconomySystem, audio: AudioManager) {
    this.economy = economy;
    this.audio = audio;
  }

  public isStreaming(): boolean {
    return this.streaming;
  }

  public getViewers(): number {
    return this.viewers;
  }

  public getPeakViewers(): number {
    return this.peakViewers;
  }

  public getActiveCategory(): StreamCategory {
    return this.activeCategory;
  }

  public setCategory(cat: StreamCategory): void {
    this.activeCategory = cat;
  }

  public getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  public startStream(category?: StreamCategory): boolean {
    const pc = this.economy.getActivePc();
    if (!pc) {
      return false; // Can't stream without PC
    }

    if (category) {
      this.activeCategory = category;
    }

    this.streaming = true;
    this.viewers = Math.max(5, Math.floor(this.activeCategory.baseViewers * 0.4));
    this.peakViewers = this.viewers;
    this.streamSeconds = 0;
    this.totalDonationsEarned = 0;
    this.chatHistory = [];

    this.addSystemMessage(`🔴 Стрім розпочато! Категорія: ${this.activeCategory.name}. Якість: ${pc.qualityTag}`);
    this.audio.playCashRegister();

    // Loop for viewer fluctuation
    this.updateInterval = window.setInterval(() => {
      this.tick();
    }, 1000);

    // Loop for chat comments
    this.chatInterval = window.setInterval(() => {
      this.generateRandomChat();
    }, 1800);

    // Loop for donations
    this.scheduleNextDonation();

    this.notifyState();
    return true;
  }

  public stopStream(): { duration: number; peak: number; earned: number } {
    if (!this.streaming) return { duration: 0, peak: 0, earned: 0 };

    this.streaming = false;
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.chatInterval) clearInterval(this.chatInterval);
    if (this.donationInterval) clearTimeout(this.donationInterval);

    // Ad revenue bonus based on duration and peak viewers
    const adRevenue = Math.floor((this.streamSeconds / 10) * (this.peakViewers * 0.15));
    if (adRevenue > 0) {
      this.economy.addMoney(adRevenue, `Монетизація стріму (${this.activeCategory.name})`, 'stream');
    }

    const summary = {
      duration: this.streamSeconds,
      peak: this.peakViewers,
      earned: this.totalDonationsEarned + adRevenue
    };

    this.addSystemMessage(`⏹️ Стрім завершено! Пік глядачів: ${this.peakViewers}. Зароблено з реклами: ${adRevenue} ₴.`);
    this.viewers = 0;
    this.notifyState();

    return summary;
  }

  private tick(): void {
    if (!this.streaming) return;
    this.streamSeconds++;

    const pc = this.economy.getActivePc();
    const gearMult = this.economy.getGearMultiplier();
    const max = pc ? Math.floor(pc.maxViewers * gearMult.viewer) : 30;
    const rate = pc ? pc.viewersRate * gearMult.viewer : 1.0;

    // Organic viewer growth with slight random noise
    const delta = (Math.random() * 4 - 1.5) * rate;
    this.viewers = Math.min(max, Math.max(3, Math.floor(this.viewers + delta)));

    if (this.viewers > this.peakViewers) {
      this.peakViewers = this.viewers;
    }

    this.notifyState();
  }

  private generateRandomChat(): void {
    if (!this.streaming) return;

    const user = CHAT_USERNAMES[Math.floor(Math.random() * CHAT_USERNAMES.length)];
    const text = CHAT_COMMENTS[Math.floor(Math.random() * CHAT_COMMENTS.length)];

    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      user,
      text,
      isDonation: false
    };

    this.chatHistory.push(msg);
    if (this.chatHistory.length > 50) this.chatHistory.shift();

    this.onChatCallbacks.forEach((cb) => cb(msg));
  }

  private scheduleNextDonation(): void {
    if (!this.streaming) return;

    const pc = this.economy.getActivePc();
    const mult = pc ? pc.donationMultiplier : 1;

    // Time between donations: between 6s and 18s (divided by multiplier)
    const delay = Math.max(4000, (8000 + Math.random() * 10000) / Math.sqrt(mult));

    this.donationInterval = window.setTimeout(() => {
      this.triggerDonation();
      this.scheduleNextDonation();
    }, delay);
  }

  private triggerDonation(): void {
    if (!this.streaming) return;

    const template = DONATION_MESSAGES[Math.floor(Math.random() * DONATION_MESSAGES.length)];
    const pc = this.economy.getActivePc();
    const gearMult = this.economy.getGearMultiplier();
    const mult = (pc ? pc.donationMultiplier : 1) * gearMult.donation;

    const calculatedAmount = Math.round(template.amount * (0.8 + Math.random() * 0.4) * (mult * 0.6 + 0.4));
    this.totalDonationsEarned += calculatedAmount;

    this.economy.addMoney(calculatedAmount, `Донат від ${template.name}: "${template.msg}"`, 'stream');
    this.audio.playDonation();

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.85, x: 0.85 }
      });
    } catch {
      // Ignored
    }

    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      user: template.name,
      text: `💸 Задонатив ${calculatedAmount} ₴: "${template.msg}"`,
      isDonation: true,
      donationAmount: calculatedAmount
    };

    this.chatHistory.push(msg);
    if (this.chatHistory.length > 50) this.chatHistory.shift();

    this.onChatCallbacks.forEach((cb) => cb(msg));
    this.onDonationCallbacks.forEach((cb) => cb(template.name, calculatedAmount, template.msg));
  }

  private addSystemMessage(text: string): void {
    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      user: 'СИСТЕМА',
      text,
      isDonation: false
    };
    this.chatHistory.push(msg);
    this.onChatCallbacks.forEach((cb) => cb(msg));
  }

  public onStateChange(cb: (streaming: boolean, viewers: number) => void): void {
    this.onStateChangeCallbacks.push(cb);
  }

  public onChat(cb: (msg: ChatMessage) => void): void {
    this.onChatCallbacks.push(cb);
  }

  public onDonation(cb: (donor: string, amount: number, msg: string) => void): void {
    this.onDonationCallbacks.push(cb);
  }

  private notifyState(): void {
    this.onStateChangeCallbacks.forEach((cb) => cb(this.streaming, this.viewers));
  }
}
