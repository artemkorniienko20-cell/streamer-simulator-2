export interface TutorialQuest {
  step: number;
  title: string;
  body: string;
  hudText: string;
  targetCoords: { x: number; z: number };
  targetName: string;
}

export class TutorialSystem {
  private currentStep: number = 1;
  private maxStep: number = 6;
  private isModalShown: boolean = true;
  private onStepChangeCallbacks: Array<(step: number, quest: TutorialQuest) => void> = [];

  // World coordinates of important locations:
  // Gas station is at (0, 0)
  // House is at (-60, -90)
  private readonly quests: Record<number, TutorialQuest> = {
    1: {
      step: 1,
      title: 'Ласкаво просимо у Streamer Simulator 2!',
      body: 'Ти прокинувся на заправці. У твоїй кишені <strong>100 гривень</strong>, а поруч стоїть твій новенький <strong>байк</strong>! Підійди до байка та натисни <strong>[E]</strong>, щоб сісти на нього.',
      hudText: 'Підійди та сядь на байк [E]',
      targetCoords: { x: 4, z: -2 }, // Байк біля заправки
      targetName: 'Байк'
    },
    2: {
      step: 2,
      title: 'Дорога додому!',
      body: 'Чудово! Тепер ти на байку. Керуй клавішами <strong>W, A, S, D</strong>. Рушай по дорозі за жовтим маркером прямо до свого будинку!',
      hudText: 'Їдь за маркером до свого Будинку',
      targetCoords: { x: -60, z: -90 },
      targetName: 'Твій Дім'
    },
    3: {
      step: 3,
      title: 'Ти вдома!',
      body: 'Спішся з байка (клавіша <strong>[E]</strong>) та зайди в будинок. Натисни <strong>[P]</strong> на клавіатурі або клікни на іконку смартфона, щоб відкрити свій телефон!',
      hudText: 'Зайди в будинок та відкрий телефон [P]',
      targetCoords: { x: -60, z: -90 },
      targetName: 'Кімната'
    },
    4: {
      step: 4,
      title: 'Твій перший комп\'ютер!',
      body: 'У тебе є рівно <strong>100 гривень</strong>. Відкрий у телефоні додаток <strong>"Магазин ПК"</strong> та придбай стартовий комплект <strong>"Old Comp"</strong> (стара клавіатура, мишка, монітор та системник)!',
      hudText: 'Купи "Old Comp" за 100 ₴ у Магазині ПК',
      targetCoords: { x: -60, z: -90 },
      targetName: 'Робочий стіл'
    },
    5: {
      step: 5,
      title: 'Перший прямий ефір!',
      body: 'Твій ретро-комп\'ютер встановлено на столі! Сядь за стіл (<strong>[E]</strong>) або зайди в додаток <strong>"Стрім Live"</strong> у телефоні та запусти свій перший стрім!',
      hudText: 'Запусти перший стрім у додатку Стрім Live',
      targetCoords: { x: -60, z: -90 },
      targetName: 'Стрім'
    },
    6: {
      step: 6,
      title: 'Розвивай канал та купуй авто!',
      body: 'Заробляй глядачів і донати в прямому ефірі. Накопич гроші, оновлюй залізо та відкрий додаток <strong>"Автосалон"</strong>, щоб купити своє перше авто!',
      hudText: 'Заробляй донати та купи авто в Автосалоні!',
      targetCoords: { x: -60, z: -90 },
      targetName: 'Гараж'
    }
  };

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public getCurrentQuest(): TutorialQuest {
    return this.quests[this.currentStep] || this.quests[this.maxStep];
  }

  public advanceStep(fromStep: number): void {
    if (this.currentStep === fromStep && this.currentStep < this.maxStep) {
      this.currentStep++;
      this.notifyStepChange();
    }
  }

  public setStep(step: number): void {
    if (step >= 1 && step <= this.maxStep) {
      this.currentStep = step;
      this.notifyStepChange();
    }
  }

  public isTutorialComplete(): boolean {
    return this.currentStep >= this.maxStep;
  }

  public onStepChange(cb: (step: number, quest: TutorialQuest) => void): void {
    this.onStepChangeCallbacks.push(cb);
  }

  private notifyStepChange(): void {
    const q = this.getCurrentQuest();
    this.onStepChangeCallbacks.forEach((cb) => cb(this.currentStep, q));
  }
}
