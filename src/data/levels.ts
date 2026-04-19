// 🔥 НОВАЯ СИСТЕМА УРОВНЕЙ (10 уровней по рублям)
export const LEVEL_THRESHOLDS = [
  0,           // Lvl 1
  100000,      // Lvl 2: 100к ₽
  500000,      // Lvl 3: 500к ₽
  750000,      // Lvl 4: 750к ₽
  1000000,     // Lvl 5: 1 млн ₽
  1500000,     // Lvl 6: 1.5 млн ₽
  3000000,     // Lvl 7: 3 млн ₽
  5000000,     // Lvl 8: 5 млн ₽
  8500000,     // Lvl 9: 8.5 млн ₽
  10000000     // Lvl 10: 10 млн ₽ (MAX)
];

export const getLevelInfo = (balance: number) => {
  // 🔥 Ищем текущий уровень
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (balance >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  
  // 🔥 Ограничиваем максимум 10 уровнем
  level = Math.min(level, 10);
  
  // 🔥 Расчет прогресса до следующего уровня
  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = level < 10 ? LEVEL_THRESHOLDS[level] : currentThreshold;
  
  let progress = 0;
  if (level < 10) {
    progress = ((balance - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    progress = Math.min(Math.max(progress, 0), 100); // Ограничиваем 0-100%
  } else {
    progress = 100; // MAX уровень
  }
  
  // 🔥 Тир для мультипликатора (каждые 2 уровня = новый тир)
  const tier = Math.ceil(level / 2);
  
  return { level, progress: Math.round(progress), tier };
};

export const getGlobalMultiplier = (tier: number) => {
  // 🔥 Мультипликатор дохода от тира
  const multipliers = [1, 1.2, 1.5, 1.8, 2.2]; // Tier 1-5
  return multipliers[Math.min(tier - 1, multipliers.length - 1)];
}; 