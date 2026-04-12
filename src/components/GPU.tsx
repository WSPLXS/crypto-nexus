import React, { useEffect, useRef } from 'react';

interface GPUProps {
  tier: number; // Текущий уровень (1-100)
  isMining: boolean;
}

// Компонент одного вентилятора с анимацией
const Fan = ({ cx, cy, r, color, speed, bladeCount = 7 }: any) => {
  const fanRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let angle = 0;
    let frameId: number;
    const animate = () => {
      angle += speed; // Скорость вращения
      if (fanRef.current) {
        fanRef.current.style.transform = `rotate(${angle}deg)`;
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, [speed]);

  // Создаем изогнутые лопасти
  const blades = Array.from({ length: bladeCount }).map((_, i) => {
    const deg = (i * 360) / bladeCount;
    const rad = (deg * Math.PI) / 180;
    // Кривая Безье для лопасти
    const x1 = cx + Math.cos(rad) * (r * 0.2);
    const y1 = cy + Math.sin(rad) * (r * 0.2);
    const x2 = cx + Math.cos(rad + 0.5) * r;
    const y2 = cy + Math.sin(rad + 0.5) * r;
    
    return (
      <path
        key={i}
        d={`M ${cx} ${cy} Q ${x1} ${y1} ${x2} ${y2}`}
        stroke={color}
        strokeWidth={r > 20 ? 5 : 3}
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    );
  });

  return (
    <g ref={fanRef} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      {/* Кольцо вентилятора */}
      <circle cx={cx} cy={cy} r={r + 1} fill="#000" opacity="0.8" />
      {/* Лопасти */}
      {blades}
      {/* Центр */}
      <circle cx={cx} cy={cy} r={r * 0.25} fill="#222" stroke={color} strokeWidth="2" />
    </g>
  );
};

export const GPU: React.FC<GPUProps> = ({ tier, isMining }) => {
  // Визуальный тир (1-10) на основе уровня (1-100)
  const visualTier = Math.max(1, Math.min(10, Math.ceil(tier / 10)));

  // Конфигурация дизайна для каждого тира
  const getTheme = (t: number) => {
    switch (t) {
      case 1: return { shroud: '#52525b', accent: '#a1a1aa', fanColor: '#71717a', rgb: 'none', glow: false, fans: 1, label: 'STARTER' }; // Grey / Basic
      case 2: return { shroud: '#3f3f46', accent: '#60a5fa', fanColor: '#93c5fd', rgb: '#60a5fa', glow: false, fans: 1, label: 'ECO' }; // Blueish
      case 3: return { shroud: '#27272a', accent: '#4ade80', fanColor: '#86efac', rgb: '#4ade80', glow: true, fans: 2, label: 'LITE' }; // Green / Basic RGB
      case 4: return { shroud: '#18181b', accent: '#f472b6', fanColor: '#fbcfe8', rgb: '#f472b6', glow: true, fans: 2, label: 'GAMER' }; // Pink
      case 5: return { shroud: '#1e1b4b', accent: '#818cf8', fanColor: '#c7d2fe', rgb: '#818cf8', glow: true, fans: 3, label: 'PRO' }; // Indigo / 3 Fans
      case 6: return { shroud: '#172554', accent: '#38bdf8', fanColor: '#bae6fd', rgb: '#38bdf8', glow: true, fans: 3, label: 'ELITE' }; // Cyan
      case 7: return { shroud: '#14532d', accent: '#4ade80', fanColor: '#bbf7d0', rgb: '#22c55e', glow: true, fans: 3, label: 'MATRIX' }; // Green Matrix
      case 8: return { shroud: '#7f1d1d', accent: '#f87171', fanColor: '#fca5a5', rgb: '#ef4444', glow: true, fans: 3, label: 'INFERNO' }; // Red / Aggressive
      case 9: return { shroud: '#a16207', accent: '#fbbf24', fanColor: '#fde68a', rgb: '#fbbf24', glow: true, fans: 3, label: 'GOLD' }; // Gold
      case 10: return { shroud: '#000000', accent: '#ff003c', fanColor: '#ff003c', rgb: '#ff003c', glow: true, fans: 4, label: 'GOD' }; // Cyberpunk Red / 4 Fans
      default: return { shroud: '#333', accent: '#fff', fanColor: '#fff', rgb: 'none', glow: false, fans: 1, label: '???' };
    }
  };

  const theme = getTheme(visualTier);
  
  // Скорость вращения
  const fanSpeed = isMining ? (visualTier >= 8 ? 25 : 15) : 1;

  // Размеры SVG
  const W = 280;
  const H = 160;

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: 320, 
      margin: '0 auto', 
      filter: theme.glow ? `drop-shadow(0 0 15px ${theme.rgb}40)` : 'none',
      transition: 'filter 1s ease'
    }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Градиент для корпуса (эффект объема) */}
          <linearGradient id="shroudGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.shroud} />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          {/* Градиент для RGB ленты */}
          {theme.rgb !== 'none' && (
            <linearGradient id="rgbGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={theme.rgb} stopOpacity="0.3" />
              <stop offset="50%" stopColor={theme.rgb} stopOpacity="1" />
              <stop offset="100%" stopColor={theme.rgb} stopOpacity="0.3" />
            </linearGradient>
          )}
          {/* Тень */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Группа с тенью */}
        <g filter="url(#shadow)">
          
          {/* === 1. ЗАДНЯЯ ПЛАСТИНА (BACKPLATE) === */}
          <rect x="30" y="40" width="220" height="70" rx="6" fill="#111" stroke="#333" strokeWidth="1" />
          
          {/* === 2. ТЕПЛОТРУБКИ (Видны сбоку) === */}
          <rect x="245" y="50" width="4" height="50" rx="2" fill="#555" />
          <rect x="252" y="50" width="4" height="50" rx="2" fill="#555" />
          {visualTier >= 6 && <rect x="259" y="50" width="4" height="50" rx="2" fill="#888" />}

          {/* === 3. ОСНОВНОЙ КОРПУС (SHROUD) === */}
          {/* Верхняя грань (3D эффект) */}
          <path d="M 30 40 L 250 40 L 250 45 L 30 45 Z" fill={theme.accent} opacity="0.3" />
          
          {/* Основной прямоугольник */}
          <rect x="30" y="45" width="220" height="60" fill="url(#shroudGrad)" stroke={theme.accent} strokeWidth={visualTier >= 9 ? 3 : 1} rx="4" />

          {/* Детали на корпусе (Грани/Вырезы) */}
          <path d="M 30 60 L 250 60" stroke={theme.accent} strokeWidth="1" opacity="0.3" />
          <path d="M 30 90 L 250 90" stroke={theme.accent} strokeWidth="1" opacity="0.3" />

          {/* Логотип / Название */}
          <text x="240" y="85" textAnchor="end" fill={theme.accent} fontSize="10" fontWeight="bold" fontFamily="monospace" opacity="0.8">
            {theme.label}
          </text>

          {/* === 4. ВЕНТИЛЯТОРЫ (Вырезы в корпусе) === */}
          {/* Отрисовываем вентиляторы внутри "дырок" в корпусе */}
          {Array.from({ length: theme.fans }).map((_, i) => {
            // Распределяем вентиляторы равномерно
            const spacing = 220 / (theme.fans + 1);
            const cx = 30 + spacing * (i + 1);
            const cy = 75;
            const r = visualTier >= 8 ? 28 : 26;

            return (
              <g key={i}>
                {/* Темная подложка (внутренность) */}
                <circle cx={cx} cy={cy} r={r + 2} fill="#050505" stroke={theme.accent} strokeWidth="2" />
                
                {/* Вентилятор */}
                <Fan cx={cx} cy={cy} r={r} color={theme.fanColor} speed={fanSpeed} bladeCount={visualTier >= 9 ? 11 : 7} />
              </g>
            );
          })}

          {/* === 5. ПОДСВЕТКА (RGB) === */}
          {theme.rgb !== 'none' && (
            <>
              {/* Нижняя полоса */}
              <rect x="35" y="105" width="210" height="3" fill={theme.rgb} rx="1" filter={`drop-shadow(0 0 3px ${theme.rgb})`} />
              
              {/* Дополнительные точки на корпусе для высоких уровней */}
              {visualTier >= 7 && (
                <circle cx="40" cy="55" r="3" fill={theme.rgb} filter={`drop-shadow(0 0 4px ${theme.rgb})`}>
                   {isMining && <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />}
                </circle>
              )}
              {visualTier === 10 && (
                <circle cx="240" cy="55" r="4" fill={theme.rgb} filter={`drop-shadow(0 0 6px ${theme.rgb})`}>
                   <animate attributeName="r" values="3;5;3" dur="0.5s" repeatCount="indefinite" />
                </circle>
              )}
            </>
          )}

          {/* === 6. РАЗЪЕМЫ (PCIe Gold fingers) === */}
          <path d="M 40 105 L 240 105" stroke="#ca8a04" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />

        </g>
      </svg>
    </div>
  );
};