export const LEVEL_THRESHOLDS = [
  0, 3000, 5000, 10000, 15000, 25000, 35000, 45000, 55000, 75000,
  100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 1000000,
  2000000, 3000000, 4000000, 4500000, 5000000, 10000000, 15000000, 20000000, 25000000, 30000000
];

export const getGlobalMultiplier = (tier: number) => {
  const multipliers = [1.0, 1.3, 1.7, 2.2, 2.8, 3.5];
  return multipliers[Math.min(tier - 1, 5)] || 1.0;
};

export const getLevelInfo = (balance: number) => {
  let level = 1;
  let prevThreshold = 0;
  let nextThreshold = LEVEL_THRESHOLDS[1];

  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (balance >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      prevThreshold = LEVEL_THRESHOLDS[i];
      nextThreshold = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i] * 1.5;
    } else {
      nextThreshold = LEVEL_THRESHOLDS[i];
      break;
    }
  }

  const progress = level === 30 ? 100 : Math.min(100, ((balance - prevThreshold) / (nextThreshold - prevThreshold)) * 100);
  const tier = Math.min(6, Math.floor(level / 5) + 1);

  return { level, progress, nextThreshold, tier };
};