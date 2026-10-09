export interface ShopItem {
  id: string;
  name: string;
  store: 'silpo' | 'gear' | 'clothes' | 'tuning';
  price: number;
  description: string;
  icon: string;
  badge?: string;
  effect: {
    type: 'energy' | 'stamina' | 'donation_mult' | 'viewer_mult' | 'outfit' | 'car_paint' | 'nitro' | 'underglow';
    val?: string | number | boolean;
    bonusText: string;
  };
}

export interface PcSetup {
  id: string;
  name: string;
  price: number;
  description: string;
  components: string[];
  maxViewers: number;
  viewersRate: number;
  donationMultiplier: number;
  qualityTag: string;
  modelType: 'old' | 'office' | 'gaming' | 'pro' | 'beast';
}

export interface CarModel {
  id: string;
  name: string;
  price: number;
  condition: string;
  conditionScore: number; // 1 to 5
  maxSpeed: number; // in km/h
  acceleration: number;
  handling: number;
  description: string;
  color: number;
  bodyStyle: 'clunker' | 'sedan' | 'bmw' | 'sport' | 'hypercar';
  exhaustType: 'smoke' | 'normal' | 'flame';
}

export interface StreamCategory {
  id: string;
  name: string;
  minPcTier: number; // index of PC setup required
  baseViewers: number;
  hypeMultiplier: number;
  icon: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  isDonation: boolean;
  donationAmount?: number;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number; // positive for income, negative for expense
  time: string;
  category: 'pc' | 'car' | 'stream' | 'initial';
}

export interface TutorialStep {
  id: number;
  title: string;
  text: string;
  hudPrompt: string;
  targetCoords?: { x: number; z: number };
  targetName?: string;
  checkComplete: () => boolean;
}
