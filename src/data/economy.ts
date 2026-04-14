// 📊 КОНФИГ БИЗНЕСОВ
export const BUSINESSES = [
  { id: 'home_production', name: 'Домашнее производство', description: 'Пошив одежды', price: 45000, incomePerHour: 1200, currency: 'RUB' },
  { id: 'slot_machine', name: 'Игровой автомат', description: 'Азартные игры', price: 96000, incomePerHour: 3900, currency: 'RUB' },
  { id: 'vending', name: 'Вендинг', description: 'Торговые автоматы', price: 65000, incomePerHour: 2300, currency: 'RUB' },
  { id: 'stall', name: 'Ларек', description: 'Уличная торговля', price: 190000, incomePerHour: 16000, currency: 'RUB' },
  { id: 'shop', name: 'Магазин', description: 'Розничная торговля', price: 1200000, incomePerHour: 90000, currency: 'RUB' },
  { id: 'clothing_store', name: 'Магазин одежды', description: 'Бутик', price: 4100000, incomePerHour: 317000, currency: 'RUB' },
  { id: 'hotel', name: 'Отель', description: 'Гостиничный бизнес', price: 30000000, incomePerHour: 2300000, currency: 'RUB' },
  { id: 'factory', name: 'Завод', description: 'Промышленное производство', price: 75000000, incomePerHour: 4600000, currency: 'RUB' }
];

// 🎰 ИГРЫ КАЗИНО
export const CASINO_GAMES = [
  { id: 'dice', name: 'Dice', icon: '🎲', minBet: 10, maxBetPercent: 0.2 },
  { id: 'roulette', name: 'Roulette', icon: '🎡', minBet: 50, maxBetPercent: 0.1 },
  { id: 'slots', name: 'Slots', icon: '🎰', minBet: 100, maxBetPercent: 0.05 },
  { id: 'miner', name: 'Miner', icon: '⛏️', minBet: 200, maxBetPercent: 0.1 }
];

// 💰 СПИСОК КРИПТОВАЛЮТ
export const CRYPTO_LIST = [
  { id: 'mxc', name: 'MXC', basePrice: 50 },
  { id: 'vkc', name: 'VKC', basePrice: 75 },
  { id: 'itdc', name: 'ITDC', basePrice: 30 },
  { id: 'andc', name: 'ANDC', basePrice: 3800 },
  { id: 'iosc', name: 'IOSC', basePrice: 15000 },
  { id: 'ytc', name: 'YTC', basePrice: 39320 },
  { id: 'btc', name: 'BTC', basePrice: 5350225 },
  { id: 'yxc', name: 'YXC', basePrice: 27126 },
  { id: 'tatw', name: 'TATW', basePrice: 13192 },
  { id: 'peka', name: 'PEKA', basePrice: 18321 },
  { id: 'gzn', name: 'GZN', basePrice: 67131 },
  { id: 'avs', name: 'AVS', basePrice: 113812 },
  { id: 'bstr', name: 'BSTR', basePrice: 2419512 },
  { id: 'rvsn', name: 'RVSN', basePrice: 612452 },
  { id: 'mc', name: 'MC', basePrice: 453125 },
  { id: 'nkgl', name: 'NKGL', basePrice: 245125 },
  { id: 'lhpw', name: 'LHPW', basePrice: 125921 },
  { id: 'strg', name: 'STRG', basePrice: 228312 },
  { id: 'clkl', name: 'CLKL', basePrice: 8522 },
  { id: 'litv', name: 'LITV', basePrice: 870185 },
  { id: 'anar', name: 'ANAR', basePrice: 176592 },
  { id: 'wc', name: 'WC', basePrice: 692017 },
  { id: 'ishs', name: 'ISHS', basePrice: 9927355 },
  { id: 'hoka', name: 'HOKA', basePrice: 7173901 }
];

// 🔒 СТЕЙКИНГ
export const STAKING_CONFIG = {
  minDeposit: 10,
  dailyYieldPercent: 3.5,
  cooldownHours: 24
};

// 👔 МЕНЕДЖЕРЫ
export const MANAGER_CONFIG = {
  hireCostUsd: 500,
  salaryPerHourRub: 50,
  autoCollectIntervalMin: 15
};

// 💼 ПОДРАБОТКИ
export const JOBS = [
  { id: 'flyer', name: 'Расклейщик листовок', icon: '📄', cooldown: 3600, reward: [50, 150] },
  { id: 'post', name: 'Почта', icon: '📮', cooldown: 7200, reward: [200, 600] },
  { id: 'delivery', name: 'Доставщик', icon: '📦', cooldown: 10800, reward: [500, 1500] },
  { id: 'courier', name: 'Курьер', icon: '🚲', cooldown: 14400, reward: [1000, 3000] },
  { id: 'taxi', name: 'Таксист', icon: '🚕', cooldown: 21600, reward: [2500, 7000] }
];