import { PcSetup, CarModel, StreamCategory, ShopItem } from '../types';

export const PC_SETUPS: PcSetup[] = [
  {
    id: 'old-comp',
    name: 'Old Comp (Ретро з горища)',
    price: 100, // Точно 100 грн як у запиті
    description: 'Легендарний ретро-комплект: стара пожовкла клавіатура, мишка з кулькою, опуклий CRT монітор 14" та гучний системник 90-х. Тягне Танчики та чат!',
    components: [
      'Опуклий CRT монітор 14"',
      'Стара клавіатура PS/2',
      'Кулькова мишка (без колеса)',
      'Бежевий системний блок з Pentium II'
    ],
    maxViewers: 35,
    viewersRate: 1.0,
    donationMultiplier: 1.0,
    qualityTag: '360p 24fps (Лагає)',
    modelType: 'old'
  },
  {
    id: 'office-pc',
    name: 'Офісний Роботяга',
    price: 600,
    description: 'Бюджетний офісний ПК із пласким LCD монітором 60Hz, мембранною клавіатурою та вбудованим відеоядром. Вже можна стрімити Майнкрафт!',
    components: [
      'Плаский монітор 19" 60Hz',
      'Мембранна клавіатура та оптична мишка',
      'Офісний чорний корпус',
      'Вбудована графіка Intel UHD'
    ],
    maxViewers: 120,
    viewersRate: 2.2,
    donationMultiplier: 1.8,
    qualityTag: '720p 30fps',
    modelType: 'office'
  },
  {
    id: 'gaming-starter',
    name: 'Геймерський Початківець',
    price: 2500,
    description: 'Справжній ігровий комп з підсвіткою! Прозорий корпус з RGB, GTX 1660, гарнітура з мікрофоном. Глядачі починають поважати якість картинки.',
    components: [
      'Ігровий монітор 24" 144Hz',
      'RGB механічна клавіатура та мишка',
      'Корпус зі скляною панеллю та підсвіткою',
      'Відеокарта GTX 1660 Ti + петличка'
    ],
    maxViewers: 500,
    viewersRate: 4.5,
    donationMultiplier: 3.5,
    qualityTag: '1080p 60fps',
    modelType: 'gaming'
  },
  {
    id: 'pro-streamer',
    name: 'Pro Streamer V2',
    price: 10000,
    description: 'Сетап топ-стрімера: подвійний монітор, студійний мікрофон на пантографі, 4K вебкамера, RTX 4070. Чат летить зі швидкістю світла!',
    components: [
      '2x Монітори 27" 2K 165Hz',
      'Студійний мікрофон Shure на пантографі',
      'Потужний системник з RTX 4070',
      '4K FaceCam + софтбокси світла'
    ],
    maxViewers: 2500,
    viewersRate: 10.0,
    donationMultiplier: 8.0,
    qualityTag: '1440p 60fps HDR',
    modelType: 'pro'
  },
  {
    id: 'ultra-cyber-beast',
    name: 'Ultra Cyber Beast 5090',
    price: 45000,
    description: 'Ультимативна кібер-машина: 3 вигнутих монітори, кастомне водяне охолодження, RTX 5090, повна неонова кімната. Ти король україномовного Twitch!',
    components: [
      '3x Вигнутих OLED 4K монітори 240Hz',
      'Кастомна СВО з неоновою рідиною',
      'RTX 5090 32GB OC Beast Edition',
      'Студійна мікшерна консоль та преміум крісло'
    ],
    maxViewers: 15000,
    viewersRate: 25.0,
    donationMultiplier: 20.0,
    qualityTag: '4K 120fps ULTRA',
    modelType: 'beast'
  }
];

export const CARS_CATALOG: CarModel[] = [
  {
    id: 'rusty-clunker',
    name: 'Іржавий "Запорожець / Копійка"',
    price: 150,
    condition: 'Ледве живе відро з болтами',
    conditionScore: 1,
    maxSpeed: 42,
    acceleration: 0.25,
    handling: 0.65,
    description: 'Чим дешевше авто, тим воно гірше! Густий дим з вихлопної, іржаві крила, скриплять двері та гримить підвіска. Але це твоє перше авто!',
    color: 0x8b4513, // іржаво-коричневий
    bodyStyle: 'clunker',
    exhaustType: 'smoke'
  },
  {
    id: 'daewoo-lanos',
    name: 'Легендарний Daewoo Lanos',
    price: 800,
    condition: 'Надійний роботяга з ГБО',
    conditionScore: 3,
    maxSpeed: 82,
    acceleration: 0.5,
    handling: 0.85,
    description: 'Сріблястий седан, який знає кожен українець. Нормально їде, майже не ламається, ідеально для поїздок у магазин.',
    color: 0xb0bec5, // сріблястий
    bodyStyle: 'sedan',
    exhaustType: 'normal'
  },
  {
    id: 'bmw-e36',
    name: 'Пацанський BMW E36 "Бумер"',
    price: 3500,
    condition: 'Бойова класика для дрифту',
    conditionScore: 4,
    maxSpeed: 135,
    acceleration: 0.85,
    handling: 1.15,
    description: 'Тонований у нуль, прямоток, ангельські очки. Добре входить у повороти з заносом та привертає увагу підписників.',
    color: 0x111827, // глибокий чорний
    bodyStyle: 'bmw',
    exhaustType: 'normal'
  },
  {
    id: 'nissan-gtr',
    name: 'Спорткар Nissan GT-R / Supra',
    price: 18000,
    condition: 'Японська ракета з турбіною',
    conditionScore: 5,
    maxSpeed: 185,
    acceleration: 1.3,
    handling: 1.45,
    description: 'Справжній спортивний звір! Агресивний обвіс, великий спойлер, неонове підсвічування днища та вогонь з глушника.',
    color: 0x06b6d4, // яскравий бірюзовий спорт
    bodyStyle: 'sport',
    exhaustType: 'flame'
  },
  {
    id: 'cyber-hypercar',
    name: 'Гіперкар Cyber Beast Edition',
    price: 65000,
    condition: 'Космічний суперкар майбутнього',
    conditionScore: 5,
    maxSpeed: 250,
    acceleration: 1.8,
    handling: 1.8,
    description: 'Найдорожча та найшвидша машина у місті. Карбоновий кузов, дверей-крила, розгін до сотні за 1.9 секунди. Статус мільйонера підтверджено!',
    color: 0x7c3aed, // королівський фіолетовий металік
    bodyStyle: 'hypercar',
    exhaustType: 'flame'
  }
];

export const STREAM_CATEGORIES: StreamCategory[] = [
  {
    id: 'retro-tanks',
    name: 'Ретро Танчики 1990',
    minPcTier: 0, // Old comp
    baseViewers: 15,
    hypeMultiplier: 1.0,
    icon: '👾'
  },
  {
    id: 'just-chatting',
    name: 'Спілкування (Just Chatting)',
    minPcTier: 0,
    baseViewers: 25,
    hypeMultiplier: 1.2,
    icon: '💬'
  },
  {
    id: 'minecraft',
    name: 'Minecraft UA Будівництво',
    minPcTier: 1, // Office or higher
    baseViewers: 60,
    hypeMultiplier: 1.6,
    icon: '⛏️'
  },
  {
    id: 'cs2',
    name: 'CS2: Шлях до Global Elite',
    minPcTier: 2, // Gaming
    baseViewers: 180,
    hypeMultiplier: 2.3,
    icon: '🎯'
  },
  {
    id: 'dota2',
    name: 'Dota 2: Підйом Рейтингу',
    minPcTier: 2,
    baseViewers: 220,
    hypeMultiplier: 2.5,
    icon: '⚔️'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077 з RTX Overdrive',
    minPcTier: 3, // Pro streamer or Beast
    baseViewers: 800,
    hypeMultiplier: 4.0,
    icon: '🤖'
  }
];

export const CHAT_USERNAMES = [
  'Kozak_2004', 'Dima_Sniper', 'Taras_Play', 'Oksana_UA', 'Lviv_Gamer', 
  'Kyiv_Cat', 'Vanya_Pro', 'Banderovets', 'Zsu_Supporter', 'Sasha_Drift',
  'Misha_Stream', 'Nika_Queen', 'Turbo_Pavlo', 'Super_Danylko', 'Gamer_Girl_UA',
  'Stalker_Zone', 'Bohdan_99', 'Max_Power', 'Vlad_Top', 'Andriy_Biceps'
];

export const CHAT_COMMENTS = [
  'Привіт стрімер! Як настрій?',
  'Ого, яка якість картинки! 😂',
  'Це що за мікрофон? Зі старого домофону записуєш?))',
  'Гра топ, давай ще!',
  'Слава Україні! 🇺🇦',
  'Хто з Києва ставить лайк!',
  'Який фпс у тебе зараз?',
  'Підписався на канал, удачі!',
  'Хахаха оце момент був 🔥',
  'Коли купиш нормальну тачку?',
  'Стрім вогонь, дивлюся замість уроків!',
  'Покажи байк у дворі!',
  'Давай більше стрімів кожний день!',
  'Чат, підтримайте стрімера донатом!',
  'Кращий україномовний стрім сьогодні ❤️'
];

export const DONATION_MESSAGES = [
  { name: 'Kozak_Patriot', msg: 'На каву та новий мікрофон, продовжуй в тому ж дусі!', amount: 50 },
  { name: 'Kyiv_Investor', msg: 'Тримай копійку на новий комп! Слава Україні!', amount: 100 },
  { name: 'Anonim_Donater', msg: 'Кращий контент на Twitch, купи нарешті нормальну тачку хаха', amount: 250 },
  { name: 'Taras_Bro', msg: 'Привіт з Одеси! Стрімер красунчик!', amount: 75 },
  { name: 'Sponsor_UA', msg: 'Великий донат найкращому геймеру! Тільки вперед!', amount: 500 },
  { name: 'Mega_Fan', msg: 'Купи бмв та зроби дрифт-стрім!', amount: 150 }
];

// ==================== 1. СУПЕРМАРКЕТ "СІЛЬПО 24/7" ====================
export const SILPO_ITEMS: ShopItem[] = [
  {
    id: 'food-energy',
    name: 'Енергетик "Non Stop"',
    store: 'silpo',
    price: 35,
    description: 'Освіжаючий енергетичний напій. Відновлює 100% витривалості (Stamina) та дарує заряд бадьорості для нічного стріму!',
    icon: '⚡',
    badge: 'Хіт',
    effect: {
      type: 'energy',
      val: 100,
      bonusText: '+100% Stamina & +20% глядачів на 60 сек'
    }
  },
  {
    id: 'food-coffee',
    name: 'Карамельний Лате',
    store: 'silpo',
    price: 25,
    description: 'Ароматна гаряча кава з сиропом. Зігріває та підвищує настрій і витривалість.',
    icon: '☕',
    effect: {
      type: 'stamina',
      val: 60,
      bonusText: '+60% Stamina'
    }
  },
  {
    id: 'food-shawarma',
    name: 'Київська Шаурма',
    store: 'silpo',
    price: 85,
    description: 'Соковита шаурма у хрусткому лаваші з часниковим соусом. Улюблений перекус усіх українських стрімерів.',
    icon: '🌯',
    badge: 'Ситна',
    effect: {
      type: 'energy',
      val: 100,
      bonusText: 'Повне відновлення сил'
    }
  },
  {
    id: 'food-pizza',
    name: 'Піца "Пепероні"',
    store: 'silpo',
    price: 110,
    description: 'Велика гаряча піца з сиром моцарела. Дає стрімеру статус ситого та задоволеного геймера.',
    icon: '🍕',
    effect: {
      type: 'energy',
      val: 100,
      bonusText: '+100% Stamina'
    }
  },
  {
    id: 'food-donut',
    name: 'Пончик з полуницею',
    store: 'silpo',
    price: 20,
    description: 'Солодкий рожевий донат з глазур\'ю. Швидкий вуглеводний буст!',
    icon: '🍩',
    effect: {
      type: 'stamina',
      val: 40,
      bonusText: '+40% Stamina'
    }
  }
];

// ==================== 2. ДЕВАЙСИ ТА ТЕХНІКА "ROZETKA" ====================
export const GEAR_ITEMS: ShopItem[] = [
  {
    id: 'gear-mic',
    name: 'Мікрофон HyperX QuadCast',
    store: 'gear',
    price: 850,
    description: 'Студійний мікрофон з червоним підсвічуванням та вбудованим поп-фільтром. Твій голос звучить кришталево чисто, донати зростають!',
    icon: '🎙️',
    badge: '+40% Донати',
    effect: {
      type: 'donation_mult',
      val: 1.4,
      bonusText: '+40% до суми донатів'
    }
  },
  {
    id: 'gear-light',
    name: 'Кільцева RGB Лампа & Софтбокс',
    store: 'gear',
    price: 450,
    description: 'Професійне студійне світло. Картинка стає кінематографічною, нові глядачі підписуються значно охочіше!',
    icon: '💡',
    badge: '+35% Глядачі',
    effect: {
      type: 'viewer_mult',
      val: 1.35,
      bonusText: '+35% до приросту онлайну'
    }
  },
  {
    id: 'gear-chair',
    name: 'Крісло DXRacer Gaming',
    store: 'gear',
    price: 1400,
    description: 'Ергономічне геймерське крісло з підтримкою спини. Дозволяє проводити марафонні 24-годинні стріми без втоми.',
    icon: '💺',
    badge: 'Топ комфорт',
    effect: {
      type: 'stamina',
      val: 1.5,
      bonusText: '+50% до базової витривалості'
    }
  },
  {
    id: 'gear-cam',
    name: '4K Стрім-камера Sony FaceCam',
    store: 'gear',
    price: 3600,
    description: 'Преміальна 4K 60fps камера з автофокусом по очах. Глядачі бачать кожну твою емоцію у надвисокій деталізації!',
    icon: '📹',
    badge: '4K Ultra',
    effect: {
      type: 'viewer_mult',
      val: 1.8,
      bonusText: '+80% до онлайну глядачів'
    }
  }
];

// ==================== 3. МАГАЗИН ОДЯГУ & СКІНІВ "DRIP STORE" ====================
export const CLOTHES_ITEMS: ShopItem[] = [
  {
    id: 'clothes-kyiv-drip',
    name: 'Худі "Київський Дріп"',
    store: 'clothes',
    price: 180,
    description: 'Стильне чорне матове худі з золотистим принтом. Класика українського стрімера.',
    icon: '👕',
    badge: 'Стиль',
    effect: {
      type: 'outfit',
      val: 'kyiv',
      bonusText: 'Новий чорно-золотий скін'
    }
  },
  {
    id: 'clothes-cyber',
    name: 'Кіберпанк Неоновий Світшот',
    store: 'clothes',
    price: 420,
    description: 'Футуристичний бірюзовий світер з неоновими лініями, що світяться в темряві.',
    icon: '🦺',
    badge: 'RGB Neon',
    effect: {
      type: 'outfit',
      val: 'cyber',
      bonusText: 'Яскравий неоновий скін'
    }
  },
  {
    id: 'clothes-gold',
    name: 'VIP Золотий Бомбер Мільйонера',
    store: 'clothes',
    price: 950,
    description: 'Блискучий золотий шовковий бомбер. Символ фінансового успіху та визнання у чаті.',
    icon: '🧥',
    badge: 'VIP Gold',
    effect: {
      type: 'outfit',
      val: 'gold',
      bonusText: 'Преміум золотий одяг'
    }
  },
  {
    id: 'clothes-shades',
    name: 'Окуляри Thug Life "Deal With It"',
    store: 'clothes',
    price: 130,
    description: 'Легендарні піксельні чорні окуляри. +100 до поваги на районі.',
    icon: '🕶️',
    badge: 'Мемні',
    effect: {
      type: 'outfit',
      val: 'shades',
      bonusText: 'Стильні сонцезахисні окуляри'
    }
  }
];

// ==================== 4. АВТОМАЙСТЕРНЯ & СТО ТЮНІНГ ====================
export const TUNING_ITEMS: ShopItem[] = [
  {
    id: 'tuning-nitro',
    name: 'Встановлення Нітро (Nitro Boost)',
    store: 'tuning',
    price: 1800,
    description: 'Балон закису азоту в багажник. Затискай [Shift] за кермом для шаленого нітро-прискорення з блакитним полум\'ям!',
    icon: '🚀',
    badge: '+Nitro Boost',
    effect: {
      type: 'nitro',
      val: true,
      bonusText: 'Нітро-прискорення на [Shift]'
    }
  },
  {
    id: 'tuning-underglow-purple',
    name: 'Неонове днище: Кислотний Пурпур',
    store: 'tuning',
    price: 550,
    description: 'Яскраве фіолетове неонове підсвічування днища авто в стилі Need for Speed Underground.',
    icon: '💡',
    badge: 'Neon Glow',
    effect: {
      type: 'underglow',
      val: 0xa855f7,
      bonusText: 'Фіолетовий неон під авто'
    }
  },
  {
    id: 'tuning-underglow-cyan',
    name: 'Неонове днище: Електричний Блакитний',
    store: 'tuning',
    price: 550,
    description: 'Крижане блакитне неонове світло, що освітлює асфальт під колесами.',
    icon: '💎',
    badge: 'Neon Glow',
    effect: {
      type: 'underglow',
      val: 0x06b6d4,
      bonusText: 'Блакитний неон під авто'
    }
  },
  {
    id: 'tuning-paint-black',
    name: 'Фарбування: Матовий Карбон Чорний',
    store: 'tuning',
    price: 250,
    description: 'Глибокий агресивний матовий чорний колір для будь-якої твоєї машини.',
    icon: '🎨',
    effect: {
      type: 'car_paint',
      val: 0x111827,
      bonusText: 'Чорний матовий колір кузова'
    }
  },
  {
    id: 'tuning-paint-red',
    name: 'Фарбування: Вишневий Кенді Металік',
    store: 'tuning',
    price: 250,
    description: 'Розкішний глянцевий червоний металік з глибоким блиском.',
    icon: '🍒',
    effect: {
      type: 'car_paint',
      val: 0xdc2626,
      bonusText: 'Червоний металік кузова'
    }
  },
  {
    id: 'tuning-paint-gold',
    name: 'Фарбування: Королівське Золото',
    store: 'tuning',
    price: 600,
    description: 'Дзеркальний золотий хром. Справжня тачка для стрімера-мільйонера.',
    icon: '🏆',
    badge: 'Chrome Gold',
    effect: {
      type: 'car_paint',
      val: 0xf59e0b,
      bonusText: 'Золотий хром кузова'
    }
  }
];

export const ALL_SHOP_ITEMS: ShopItem[] = [
  ...SILPO_ITEMS,
  ...GEAR_ITEMS,
  ...CLOTHES_ITEMS,
  ...TUNING_ITEMS
];

