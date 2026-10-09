import { PcSetup, CarModel, Transaction, ShopItem } from '../types';
import { PC_SETUPS, CARS_CATALOG } from '../data/items';

export class EconomySystem {
  private balance: number = 100; // Початковий баланс 100 грн як вимагалося
  private ownedPcs: string[] = [];
  private activePcId: string | null = null;
  private ownedCars: string[] = [];
  private activeVehicleType: 'bike' | string = 'bike';
  private transactions: Transaction[] = [];
  private onBalanceChangeCallbacks: Array<(bal: number) => void> = [];

  // Shop items & Tuning state
  private ownedItems: string[] = [];
  private activeOutfitId: string = 'default';
  private carCustomColor: number | null = null;
  private hasNitroBoost: boolean = false;
  private underglowColor: number | null = null;

  constructor() {
    this.addTransaction('Стартовий капітал', 100, 'initial');
  }

  public getBalance(): number {
    return this.balance;
  }

  public hasPc(id: string): boolean {
    return this.ownedPcs.includes(id);
  }

  public getActivePc(): PcSetup | null {
    if (!this.activePcId) return null;
    return PC_SETUPS.find((p) => p.id === this.activePcId) || null;
  }

  public getActivePcTierIndex(): number {
    if (!this.activePcId) return -1;
    return PC_SETUPS.findIndex((p) => p.id === this.activePcId);
  }

  public buyPc(pc: PcSetup): boolean {
    if (this.balance < pc.price) return false;
    this.balance -= pc.price;
    if (!this.ownedPcs.includes(pc.id)) {
      this.ownedPcs.push(pc.id);
    }
    this.activePcId = pc.id;
    this.addTransaction(`Купівля: ${pc.name}`, -pc.price, 'pc');
    this.notifyBalanceChange();
    return true;
  }

  public hasCar(id: string): boolean {
    return this.ownedCars.includes(id);
  }

  public getOwnedCars(): CarModel[] {
    return CARS_CATALOG.filter((c) => this.ownedCars.includes(c.id));
  }

  public buyCar(car: CarModel): boolean {
    if (this.balance < car.price) return false;
    this.balance -= car.price;
    if (!this.ownedCars.includes(car.id)) {
      this.ownedCars.push(car.id);
    }
    this.activeVehicleType = car.id;
    this.addTransaction(`Купівля авто: ${car.name}`, -car.price, 'car');
    this.notifyBalanceChange();
    return true;
  }

  public setActiveVehicle(type: 'bike' | string): void {
    this.activeVehicleType = type;
  }

  public getActiveVehicleType(): 'bike' | string {
    return this.activeVehicleType;
  }

  public addMoney(amount: number, reason: string, category: 'stream' | 'pc' | 'car' | 'initial' = 'stream'): void {
    this.balance += amount;
    this.addTransaction(reason, amount, category);
    this.notifyBalanceChange();
  }

  public getTransactions(): Transaction[] {
    return [...this.transactions].reverse();
  }

  private addTransaction(title: string, amount: number, category: 'stream' | 'pc' | 'car' | 'initial'): void {
    const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.transactions.push({
      id: Math.random().toString(36).substring(2, 9),
      title,
      amount,
      time,
      category
    });
  }

  public onBalanceChange(cb: (bal: number) => void): void {
    this.onBalanceChangeCallbacks.push(cb);
  }

  private notifyBalanceChange(): void {
    this.onBalanceChangeCallbacks.forEach((cb) => cb(this.balance));
  }

  public hasItem(id: string): boolean {
    return this.ownedItems.includes(id);
  }

  public buyShopItem(item: ShopItem): boolean {
    if (this.balance < item.price) return false;
    this.balance -= item.price;

    if (item.store !== 'silpo' && !this.ownedItems.includes(item.id)) {
      this.ownedItems.push(item.id);
    }

    if (item.effect.type === 'outfit') {
      this.activeOutfitId = item.effect.val as string;
    } else if (item.effect.type === 'car_paint') {
      this.carCustomColor = item.effect.val as number;
    } else if (item.effect.type === 'nitro') {
      this.hasNitroBoost = true;
    } else if (item.effect.type === 'underglow') {
      this.underglowColor = item.effect.val as number;
    }

    this.addTransaction(`Купівля: ${item.name}`, -item.price, 'stream');
    this.notifyBalanceChange();
    return true;
  }

  public getActiveOutfit(): string {
    return this.activeOutfitId;
  }

  public getCarCustomColor(): number | null {
    return this.carCustomColor;
  }

  public hasNitro(): boolean {
    return this.hasNitroBoost;
  }

  public getUnderglowColor(): number | null {
    return this.underglowColor;
  }

  public getGearMultiplier(): { donation: number; viewer: number } {
    let donation = 1.0;
    let viewer = 1.0;

    if (this.hasItem('gear-mic')) donation += 0.4;
    if (this.hasItem('gear-light')) viewer += 0.35;
    if (this.hasItem('gear-cam')) viewer += 0.8;

    return { donation, viewer };
  }
}
