// src/data/levels.ts

export interface LevelInfo {
  level: number;
  minBalance: number;
  maxBalance: number;
  progress: number;
  tier: number;
}

// Генерируем 100 уровней с плавной экспоненциальной кривой
const generateLevels = () => {
  const levels = [];
  for (let i = 0; i <= 100; i++) {
    // Формула: 100 * (уровень ^ 2.5)
    // Lvl 1: ~$100 | Lvl 10: ~$31k | Lvl 30: ~$500k | Lvl 100: ~$10M
    const minBalance = i === 0 ? 0 : Math.floor(100 * Math.pow(i, 2.5));
    levels.push({ level: i, minBalance });
  }
  return levels;
};

const LEVELS = generateLevels();

export const MAX_LEVEL = 100;

export const getLevelInfo = (balance: number): LevelInfo => {
  let currentLevel = 0;
  
  // Находим текущий уровень
  for (let i = 0; i < LEVELS.length; i++) {
    if (balance >= LEVELS[i].minBalance) {
      currentLevel = LEVELS[i].level;
    } else {
      break;
    }
  }

  // Ограничиваем макс уровнем
  if (currentLevel >= MAX_LEVEL) currentLevel = MAX_LEVEL;

  const currentThreshold = LEVELS[currentLevel].minBalance;
  const nextThreshold = currentLevel < MAX_LEVEL ? LEVELS[currentLevel + 1].minBalance : currentThreshold;

  // Считаем прогресс в %
  let progress = 0;
  if (currentLevel < MAX_LEVEL && nextThreshold > currentThreshold) {
    progress = Math.min(100, Math.floor(((balance - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
  } else {
    progress = 100;
  }

  // Тир: каждые 10 уровней = 1 тир (1-10)
  const tier = Math.ceil(currentLevel / 10);

  return {
    level: currentLevel,
    minBalance: currentThreshold,
    maxBalance: nextThreshold,
    progress,
    tier
  };
};

// Множитель дохода. Растёт плавно: x1.0 -> x5.0 на максимуме
export const getGlobalMultiplier = (tier: number): number => {
  const clampedTier = Math.max(1, Math.min(10, tier));
  return 1 + (clampedTier - 1) * 0.5;
};