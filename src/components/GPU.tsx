import React, { useEffect, useRef } from 'react';

interface GPUProps {
  tier: number; // Текущий уровень игрока (1-100)
  isMining: boolean;
}

// Вспомогательный компонент для 3D вентилятора
const Fan3D = ({ cx, cy, r, color, speed, bladeCount = 9 }: any) => {
  const fanRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let angle = 0;
    let frameId: number;
    const animate = () => {
      angle += speed;
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
    return (
      <path
        key={i}
        d={`M ${cx} ${cy} Q ${cx + Math.cos((deg * Math.PI) / 180) * r} ${cy + Math.sin((deg * Math.PI) / 180) * (r * 0.5)} ${cx + Math.cos(((deg + 40) * Math.PI) / 180) * r} ${cy + Math.sin(((deg + 40) * Math.PI) / 180) * r} Z`}
        fill={color}
        opacity="0.9"
      />
    );
  });

  return (
    <g ref={fanRef} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={r + 2} fill="#111" stroke="#333" strokeWidth="1" />
      {blades}
      <circle cx={cx} cy={cy} r={r * 0.2} fill="#222" stroke={color} strokeWidth="2" />
    </g>
  );
};

export const GPU: React.FC<GPUProps> = ({ tier, isMining }) => {
  // Определяем "Визуальный Тир" (1-10) на основе уровня (1-100)
  const visualTier = Math.max(1, Math.min(10, Math.ceil(tier / 10)));
  
  // Определяем количество карт в стойке (каждые 20 уровней +1 карта)
  // 1-19: 1 карта, 20-39: 2 карты, 40-59: 3 карты, 60+: 4 карты
  const numCards = Math.min(4, Math.max(1, Math.floor(tier / 20) + 1));

  // Настройки дизайна для каждого тира
  const getTheme = (t: number) => {
    switch (t) {
      case 1: return { shroud: '#4b5563', fan: '#9ca3af', accent: '#d1d5db', glow: 'none' }; // Grey Basic
      case 2: return { shroud: '#374151', fan: '#60a5fa', accent: '#3b82f6', glow: 'none' }; // Blue Basic
      case 3: return { shroud: '#1f2937', fan: '#34d399', accent: '#10b981', glow: 'none' }; // Green Basic
      case 4: return { shroud: '#f3f4f6', fan: '#f472b6', accent: '#ec4899', glow: 'none' }; // White/Pink
      case 5: return { shroud: '#111827', fan: '#a78bfa', accent: '#8b5cf6', glow: 'drop-shadow(0 0 5px #8b5cf6)' }; // Purple RGB
      case 6: return { shroud: '#7f1d1d', fan: '#fca5a5', accent: '#ef4444', glow: 'drop-shadow(0 0 8px #ef4444)' }; // Red Gaming
      case 7: return { shroud: '#0f172a', fan: '#22d3ee', accent: '#06b6d4', glow: 'drop-shadow(0 0 10px #06b6d4)' }; // Cyan Cyber
      case 8: return { shroud: '#451a03', fan: '#fbbf24', accent: '#f59e0b', glow: 'drop-shadow(0 0 12px #f59e0b)' }; // Gold Luxury
      case 9: return { shroud: '#000000', fan: '#ffffff', accent: '#ffffff', glow: 'drop-shadow(0 0 15px #ffffff)' }; // Stealth White
      case 10: return { shroud: '#0a0a0a', fan: '#ff0055', accent: '#ff0055', glow: 'drop-shadow(0 0 20px #ff0055)' }; // GOD TIER
      default: return { shroud: '#333', fan: '#fff', accent: '#fff', glow: 'none' };
    }
  };

  const theme = getTheme(visualTier);

  return (
    <div style={{ 
      width: 360, 
      height: 300, 
      perspective: '1000px', 
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible'
    }}>
      
      {/* 3D Сцена с изометрией */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: `rotateX(55deg) rotateZ(-45deg) scale(0.9)`,
      }}>
        
        {/* Тень на полу */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 70%)',
          transform: 'translate(-50%, -50%) translateZ(-60px)',
          filter: 'blur(10px)'
        }} />

        {/* Стойка (Rig Frame) */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '180px', height: '240px',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* Рендерим нужное количество карт */}
          {Array.from({ length: numCards }).map((_, index) => {
            // Смещение для эффекта стопки
            const offset = (index - (numCards - 1) / 2) * 35;
            
            return (
              <div key={index} style={{
                width: '160px',
                height: '40px',
                position: 'relative',
                transform: `translateY(${offset}px) translateZ(${index * 5}px)`,
                transition: 'all 0.5s ease'
              }}>
                <svg width="160" height="40" viewBox="0 0 160 40" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id={`shroud-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.shroud} />
                      <stop offset="100%" stopColor="#000" />
                    </linearGradient>
                    <filter id={`glow-${index}`}>
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Задняя пластина (Backplate) - Толщина снизу */}
                  <rect x="5" y="32" width="150" height="6" fill="#111" rx="1" />
                  
                  {/* Основной корпус (Top Shroud) */}
                  <rect x="0" y="0" width="160" height="32" fill={`url(#shroud-${index})`} rx="2" stroke={theme.accent} strokeWidth="1" filter={visualTier >= 5 ? `url(#glow-${index})` : ''} />

                  {/* Золотые контакты (PCIe) */}
                  <rect x="10" y="34" width="140" height="3" fill="#d97706" opacity="0.8" />

                  {/* Вентиляторы (Разное количество в зависимости от тира) */}
                  {visualTier <= 2 && <Fan3D cx="80" cy="16" r="14" color={theme.fan} speed={isMining ? 15 : 1} />}
                  {visualTier >= 3 && visualTier <= 5 && (
                    <>
                      <Fan3D cx="50" cy="16" r="12" color={theme.fan} speed={isMining ? 15 : 1} />
                      <Fan3D cx="110" cy="16" r="12" color={theme.fan} speed={isMining ? 15 : 1} />
                    </>
                  )}
                  {visualTier >= 6 && (
                    <>
                      <Fan3D cx="40" cy="16" r="10" color={theme.fan} speed={isMining ? 15 : 1} />
                      <Fan3D cx="80" cy="16" r="12" color={theme.fan} speed={isMining ? 15 : 1} />
                      <Fan3D cx="120" cy="16" r="10" color={theme.fan} speed={isMining ? 15 : 1} />
                    </>
                  )}

                  {/* Спецэффекты для высоких тиров */}
                  {visualTier >= 7 && (
                    <circle cx="80" cy="16" r="6" fill={theme.accent} opacity="0.5" filter={`url(#glow-${index})`}>
                      {isMining && <animate attributeName="r" values="4;7;4" dur="1s" repeatCount="indefinite" />}
                    </circle>
                  )}
                  
                  {visualTier === 10 && (
                     <text x="80" y="19" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" filter={`url(#glow-${index})`}>GOD</text>
                  )}
                </svg>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};