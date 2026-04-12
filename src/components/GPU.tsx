import React, { useEffect, useRef } from 'react';

interface GPUProps {
  tier: number;
  isMining: boolean;
}

export const GPU: React.FC<GPUProps> = ({ tier, isMining }) => {
  // tier уже приходит 1-10 из levels.ts, просто гарантируем границы
  const t = Math.max(1, Math.min(10, tier || 1));
  const fanRef = useRef<SVGGElement>(null);
  const rgbRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    if (!fanRef.current || !rgbRef.current) return;

    let animFrame: number;
    let angle = 0;
    let hue = 0;

    const animate = () => {
      angle += isMining ? 8 : 0.5;
      if (fanRef.current) {
        fanRef.current.style.transform = `rotate(${angle}deg)`;
      }

      if (t >= 3 && rgbRef.current) {
        hue = (hue + (isMining ? 3 : 0.5)) % 360;
        const color = t >= 8
          ? `hsl(${hue}, 100%, 50%)`
          : `hsl(${(hue + t * 30) % 360}, 80%, 60%)`;
        rgbRef.current.style.fill = color;
        rgbRef.current.style.filter = `drop-shadow(0 0 ${t * 2}px ${color})`;
      }

      animFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrame);
  }, [isMining, t]);

  const getConfig = (tierNum: number) => ({
    fans: tierNum <= 2 ? 1 : tierNum <= 5 ? 2 : 3,
    pipes: tierNum <= 2 ? 0 : tierNum <= 4 ? 2 : tierNum <= 6 ? 4 : tierNum <= 8 ? 6 : 8,
    hasBackplate: tierNum >= 4,
    hasEnergyCore: tierNum >= 7,
    shroudColor: tierNum <= 3 ? '#374151' : tierNum <= 6 ? '#1f2937' : '#0a0a0a',
    accentColor: tierNum <= 3 ? '#6b7280' : tierNum <= 6 ? '#3b82f6' : '#f59e0b'
  });

  const cfg = getConfig(t);

  return (
    <div style={{ width: 280, height: 140, position: 'relative', margin: '0 auto' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .gpu-container { animation: float 4s ease-in-out infinite; }
        .fan-blade { transform-origin: center; transition: transform 0.1s linear; }
      `}</style>

      <div className="gpu-container">
        <svg viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Фоновое свечение для высоких тиров */}
          {t >= 5 && (
            <ellipse cx="150" cy="70" rx="130" ry="50" fill={cfg.accentColor} opacity={0.15} filter="blur(20px)" />
          )}

          {/* Задняя пластина (Tier 4+) */}
          {cfg.hasBackplate && (
            <rect x="30" y="35" width="240" height="70" rx="8" fill="#111" stroke="#333" strokeWidth="2" />
          )}

          {/* Основной корпус */}
          <rect x="20" y="25" width="260" height="90" rx="12" fill={cfg.shroudColor} stroke="#444" strokeWidth="2" />
          <path d="M40 45 L260 45 M40 100 L260 100" stroke="#555" strokeWidth="1" opacity="0.5" />

          {/* Тепловые трубки */}
          {Array.from({ length: cfg.pipes }).map((_, i) => (
            <rect
              key={`pipe-${i}`}
              x={45 + i * (210 / (cfg.pipes + 1))}
              y="40"
              width="6"
              height="60"
              rx="3"
              fill={t >= 7 ? '#fbbf24' : '#9ca3af'}
              opacity={0.6 + (t / 10) * 0.4}
            />
          ))}

          {/* Вентиляторы */}
          {Array.from({ length: cfg.fans }).map((_, i) => {
            const cx = cfg.fans === 1 ? 150 : cfg.fans === 2 ? (i === 0 ? 100 : 200) : (i === 0 ? 80 : i === 1 ? 150 : 220);
            return (
              <g key={`fan-${i}`} ref={i === 0 ? fanRef : undefined} className="fan-blade" style={{ transformOrigin: `${cx}px 70px` }}>
                <circle cx={cx} cy="70" r="28" fill="#000" stroke={t >= 6 ? cfg.accentColor : '#555'} strokeWidth="3" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <path
                    key={deg}
                    d={`M ${cx} ${70} L ${cx + Math.cos((deg * Math.PI) / 180) * 24} ${70 + Math.sin((deg * Math.PI) / 180) * 24}`}
                    stroke={t >= 5 ? '#fff' : '#888'}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                ))}
                <circle cx={cx} cy="70" r="7" fill={t >= 7 ? cfg.accentColor : '#444'} />
              </g>
            );
          })}

          {/* RGB полоса (Tier 3+) */}
          {t >= 3 && (
            <rect
              ref={rgbRef}
              x="35"
              y="110"
              width="230"
              height="4"
              rx="2"
              fill="#fff"
              opacity={0.8}
            />
          )}

          {/* Энергетическое ядро (Tier 7-10) */}
          {cfg.hasEnergyCore && (
            <circle cx="150" cy="70" r="16" fill="#000" stroke={cfg.accentColor} strokeWidth="2" opacity={0.9} />
          )}
        </svg>
      </div>
    </div>
  );
};