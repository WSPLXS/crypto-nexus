import React, { useEffect, useRef, useState } from 'react';

interface GPUProps {
  tier: number;
  isMining: boolean;
}

export const GPU: React.FC<GPUProps> = ({ tier, isMining }) => {
  const t = Math.max(1, Math.min(10, tier || 1));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Анимация вращения для вентиляторов
  const Fan = ({ cx, cy, r, color, count = 7 }: any) => {
    const ref = useRef<SVGGElement>(null);
    useEffect(() => {
      let angle = 0;
      let animId: number;
      const speed = isMining ? 15 : 1;
      const animate = () => {
        angle += speed;
        if (ref.current) ref.current.style.transform = `rotate(${angle}deg)`;
        animId = requestAnimationFrame(animate);
      };
      animate();
      return () => cancelAnimationFrame(animId);
    }, [isMining]);

    return (
      <g ref={ref} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r + 2} fill="#111" stroke={color} strokeWidth="1.5" opacity="0.8" />
        {Array.from({ length: count }).map((_, i) => {
          const rad = (i * 360) / count;
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${cx + Math.cos(rad * (Math.PI / 180)) * (r - 4)} ${cy + Math.sin(rad * (Math.PI / 180)) * (r - 4)}`}
              stroke="#ccc"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.6}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r * 0.25} fill={color} />
      </g>
    );
  };

  // Цветовая схема в зависимости от уровня
  const theme = {
    shroud: t >= 7 ? '#1a0b2e' : t >= 4 ? '#111827' : '#333',
    accent: t >= 9 ? '#ff0055' : t >= 7 ? '#00ffff' : t >= 4 ? '#3b82f6' : '#6b7280',
    glow: t >= 9 ? '#ff0055' : t >= 7 ? '#00ffff' : t >= 4 ? '#3b82f6' : '#ffffff',
    metal: t >= 7 ? '#2d1b4e' : t >= 4 ? '#1f2937' : '#4b5563',
  };

  return (
    <div style={{
      width: 320,
      height: 180,
      perspective: '1000px',
      margin: '0 auto',
      position: 'relative',
      marginTop: 20
    }}>
      {/* 3D Контейнер с поворотом */}
      <div style={{
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transform: `rotateY(-15deg) rotateX(10deg) scale(${mounted ? 1 : 0.8})`,
        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative'
      }}>
        <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            {/* Градиенты для объема */}
            <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.metal} />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
            <linearGradient id="shroudGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.shroud} />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
            <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#666" />
              <stop offset="50%" stopColor="#333" />
              <stop offset="100%" stopColor="#111" />
            </linearGradient>
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Тень под картой (земля) */}
          <ellipse cx="160" cy="165" rx="140" ry="15" fill="rgba(0,0,0,0.5)" filter="blur(8px)" />

          {/* === СЛОЙ 1: Задняя пластина (Backplate) === */}
          <rect x="30" y="30" width="260" height="90" rx="6" fill="#111" stroke="#222" strokeWidth="2" transform="skewX(-5)" />

          {/* === СЛОЙ 2: Печатная плата (PCB) === */}
          <rect x="25" y="25" width="270" height="100" rx="4" fill="#0f172a" transform="skewX(-5)" />

          {/* === СЛОЙ 3: Радиатор (Финны) === */}
          {Array.from({ length: t >= 4 ? 12 : 6 }).map((_, i) => (
            <rect
              key={i}
              x={35 + i * (t >= 4 ? 22 : 40)}
              y="45"
              width="12"
              height="70"
              rx="1"
              fill="url(#finGrad)"
              transform="skewX(-5)"
              opacity={0.7}
            />
          ))}

          {/* === СЛОЙ 4: Вентиляторы === */}
          {t <= 3 && <Fan cx={160} cy={75} r={35} color={theme.accent} count={5} />}
          {t >= 4 && t <= 6 && (
            <>
              <Fan cx={100} cy={75} r={30} color={theme.accent} count={7} />
              <Fan cx={220} cy={75} r={30} color={theme.accent} count={7} />
            </>
          )}
          {t >= 7 && (
            <>
              <Fan cx={80} cy={75} r={25} color="#fff" count={9} />
              <Fan cx={160} cy={75} r={35} color="#fff" count={9} />
              <Fan cx={240} cy={75} r={25} color="#fff" count={9} />
            </>
          )}

          {/* === СЛОЙ 5: Кожух (Shroud) - Пластиковый корпус === */}
          {/* Основная форма */}
          <path
            d="M 20 40 L 290 40 L 295 110 L 15 110 Z"
            fill="url(#shroudGrad)"
            stroke={theme.accent}
            strokeWidth="2"
            transform="skewX(-5)"
          />
          
          {/* Вырезы под кулеры */}
          {t <= 3 && <circle cx="160" cy="75" r="38" fill="none" stroke="#000" strokeWidth="4" transform="skewX(-5)" />}
          {t >= 4 && t <= 6 && (
            <>
              <circle cx="100" cy="75" r="33" fill="none" stroke="#000" strokeWidth="4" transform="skewX(-5)" />
              <circle cx="220" cy="75" r="33" fill="none" stroke="#000" strokeWidth="4" transform="skewX(-5)" />
            </>
          )}
          {t >= 7 && (
            <>
              <circle cx="80" cy="75" r="28" fill="none" stroke="#000" strokeWidth="4" transform="skewX(-5)" />
              <circle cx="160" cy="75" r="38" fill="none" stroke="#000" strokeWidth="4" transform="skewX(-5)" />
              <circle cx="240" cy="75" r="28" fill="none" stroke="#000" strokeWidth="4" transform="skewX(-5)" />
            </>
          )}

          {/* === ДЕТАЛИ ПО ТИРАМ === */}
          
          {/* Tier 1-3: Простой индикатор */}
          {t <= 3 && (
            <circle cx="270" cy="45" r="3" fill="#ef4444" transform="skewX(-5)" />
          )}

          {/* Tier 4+: RGB Полоса */}
          {t >= 4 && (
            <path
              d="M 20 115 L 290 115"
              stroke={theme.accent}
              strokeWidth="3"
              filter="url(#neonGlow)"
              transform="skewX(-5)"
              style={{
                animation: isMining ? 'pulse-glow 1s infinite alternate' : 'none'
              }}
            />
          )}

          {/* Tier 7+: Водяное охлаждение / Ядро */}
          {t >= 7 && (
            <g transform="skewX(-5)">
              <circle cx="160" cy="75" r="20" fill="#000" stroke={theme.accent} strokeWidth="3" />
              <circle cx="160" cy="75" r="10" fill={theme.accent} filter="url(#neonGlow)" opacity="0.8">
                {isMining && <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />}
              </circle>
            </g>
          )}

          {/* Tier 9+: Антенна / Энерго-ядро */}
          {t >= 9 && (
            <g transform="skewX(-5)">
               <rect x="275" y="10" width="4" height="30" fill="#444" rx="2" />
               <circle cx="277" cy="8" r="4" fill={theme.glow} filter="url(#neonGlow)">
                 <animate attributeName="cy" values="8;15;8" dur="2s" repeatCount="indefinite" />
               </circle>
            </g>
          )}

          {/* Логотип "GPU" */}
          <text x="150" y="20" textAnchor="middle" fill="#555" fontSize="10" fontFamily="monospace" fontWeight="bold" transform="skewX(-5)">
            CRYPTO-NEXUS {t * 10}
          </text>
        </svg>
        
        <style>{`
          @keyframes pulse-glow {
            from { filter: drop-shadow(0 0 2px ${theme.glow}); }
            to { filter: drop-shadow(0 0 10px ${theme.glow}); }
          }
        `}</style>
      </div>
    </div>
  );
};