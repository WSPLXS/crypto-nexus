export const BUSINESSES = [
  { id: 'home_prod', name: 'Домашнее производство', icon: '🧵', priceUsd: 500, incomePerHour: 15, desc: 'Пошив одежды и игрушек' },
  { id: 'game_machine', name: 'Игровой автомат', icon: '🎰', priceUsd: 1200, incomePerHour: 45, desc: 'Заработок на азарте других' },
  { id: 'vending', name: 'Вендинг (Еда/Напитки)', icon: '🥤', priceUsd: 800, incomePerHour: 25, desc: 'Автомат с закусками' },
  { id: 'kiosk', name: 'Ларёк', icon: '🏪', priceUsd: 2500, incomePerHour: 80, desc: 'Торговля у метро' },
  { id: 'shop', name: 'Магазин', icon: '🛒', priceUsd: 8000, incomePerHour: 250, desc: 'Продукты и быт' },
  { id: 'clothes_shop', name: 'Магазин одежды', icon: '👗', priceUsd: 15000, incomePerHour: 500, desc: 'Бренды и масс-маркет' },
  { id: 'hotel', name: 'Отель', icon: '🏨', priceUsd: 50000, incomePerHour: 1800, desc: 'Номера и услуги' },
  { id: 'factory', name: 'Завод', icon: '🏭', priceUsd: 200000, incomePerHour: 8000, desc: 'Промышленное производство' }
];

export const JOBS = [
  { id: 'flyer', name: 'Расклейщик листовок', icon: '📄', cooldown: 3600, reward: [50, 150] },
  { id: 'post', name: 'Почта', icon: '📮', cooldown: 7200, reward: [200, 600] },
  { id: 'delivery', name: 'Доставщик', icon: '📦', cooldown: 10800, reward: [500, 1500] },
  { id: 'courier', name: 'Курьер', icon: '🚲', cooldown: 14400, reward: [1000, 3000] },
  { id: 'taxi', name: 'Таксист', icon: '🚕', cooldown: 21600, reward: [2500, 7000] }
];

export const CASINO_GAMES = [
  { id: 'dice', name: 'Dice', icon: '🎲', minBet: 10, maxBetPercent: 0.2 },
  { id: 'roulette', name: 'Roulette', icon: '🎡', minBet: 50, maxBetPercent: 0.1 },
  { id: 'slots', name: 'Slots', icon: '🎰', minBet: 100, maxBetPercent: 0.05 },
  { id: 'miner', name: 'Miner', icon: '⛏️', minBet: 200, maxBetPercent: 0.1 }
];