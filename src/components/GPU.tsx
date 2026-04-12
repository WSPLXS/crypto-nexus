import React, { useEffect, useRef } from 'react';

interface GPUProps {
  tier: number;
  isMining: boolean;
}

export const GPU: React.FC<GPUProps> = ({ tier, isMining }) => {
  const visualTier = Math.max(1, Math.min(10, Math.ceil(tier / 10)));
  const rgbRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!rgbRef.current) return;

    let animFrame: number;
    let hue = 0;

    const animate = () => {
      if (visualTier >= 3 && rgbRef.current) {
        hue = (hue + (isMining ? 4 : 0.5)) % 360;
        const color = visualTier >= 8 
          ? `hsl(${hue}, 100%, 50%)` 
          : `hsl(${(hue + visualTier * 30) % 360}, 80%, 60%)`;
        
        const elements = rgbRef.current.children;
        Array.from(elements).forEach((el: any) => {
          if (el.tagName === 'rect' || el.tagName === 'circle') {
            el.style.fill = color;
            el.style.filter = `drop-shadow(0 0 ${visualTier * 2}px ${color})`;
          }
        });
      }
      animFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrame);
  }, [isMining, visualTier]);

  const getTheme = (t: number) => {
    switch (t) {
      case 1: return { slots: 1, color: '#6b7280', accent: '#9ca3af', glow: '#9ca3af', label: 'BASIC' };
      case 2: return { slots: 1, color: '#374151', accent: '#60a5fa', glow: '#60a5fa', label: 'ECO' };
      case 3: return { slots: 2, color: '#1f2937', accent: '#4ade80', glow: '#4ade80', label: 'LITE' };
      case 4: return { slots: 2, color: '#312e81', accent: '#a78bfa', glow: '#a78bfa', label: 'GAMER' };
      case 5: return { slots: 2, color: '#7c2d12', accent: '#fb923c', glow: '#fb923c', label: 'PRO' };
      case 6: return { slots: 3, color: '#1e3a8a', accent: '#38bdf8', glow: '#38bdf8', label: 'ELITE' };
      case 7: return { slots: 3, color: '#064e3b', accent: '#34d399', glow: '#34d399', label: 'MATRIX' };
      case 8: return { slots: 3, color: '#7f1d1d', accent: '#f87171', glow: '#f87171', label: 'INFERNO' };
      case 9: return { slots: 3, color: '#854d0e', accent: '#fbbf24', glow: '#fbbf24', label: 'GOLD' };
      case 10: return { slots: 3, color: '#4a044e', accent: '#f472b6', glow: '#f472b6', label: 'GOD' };
      default: return { slots: 1, color: '#333', accent: '#fff', glow: '#fff', label: '???' };
    }
  };

  const theme = getTheme(visualTier);
  const W = 200;
  const H = 180;

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: 240, 
      margin: '0 auto',
      filter: `drop-shadow(0 0 ${visualTier * 3}px ${theme.glow}40)`,
      transition: 'filter 1s ease'
    }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.color} />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          <linearGradient id="slotGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        <rect x="10" y="10" width="160" height="160" rx="12" fill="url(#bodyGrad)" stroke={theme.accent} strokeWidth="2" />
        
        <rect x="15" y="15" width="150" height="15" rx="4" fill="#0f172a" stroke={theme.accent} strokeWidth="1" opacity="0.5" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={25 + i * 12} y1="18" x2={25 + i * 12} y2="27" stroke={theme.accent} strokeWidth="1" opacity="0.3" />
        ))}

        {Array.from({ length: theme.slots }).map((_, i) => {
          const y = 35 + i * 45;
          return (
            <g key={i}>
              <rect x="20" y={y} width="140" height="35" rx="6" fill="url(#slotGrad)" stroke={theme.accent} strokeWidth="1" opacity="0.8" />
              <circle cx="90" cy={y + 17.5} r="12" fill="none" stroke={theme.accent} strokeWidth="2" opacity="0.6">
                {isMining && <animate attributeName="stroke-opacity" values="0.3;0.9;0.3" dur="1s" repeatCount="indefinite" />}
              </circle>
              <path d={`M 90 ${y + 17.5} L 90 ${y + 5} A 12.5 12.5 0 0 1 102 ${y + 17.5}`} fill="none" stroke={theme.accent} strokeWidth="2" opacity="0.4" />
              <path d={`M 90 ${y + 17.5} L 78 ${y + 17.5} A 12.5 12.5 0 0 1 90 ${y + 5}`} fill="none" stroke={theme.accent} strokeWidth="2" opacity="0.4" />
              <circle cx="28" cy={y + 17.5} r="2" fill={theme.accent} opacity="0.8" />
              <circle cx="152" cy={y + 17.5} r="2" fill={theme.accent} opacity="0.8" />
            </g>
          );
        })}

        <g ref={rgbRef}>
          <rect x="30" y="160" width="120" height="6" rx="3" fill={theme.accent} opacity="0.6" />
        </g>

        <rect x="175" y="30" width="15" height="120" rx="4" fill="#1e293b" stroke={theme.accent} strokeWidth="1" />
        {Array.from({ length: 3 }).map((_, i) => (
          <rect key={i} x="180" y={40 + i * 35} width="5" height="15" rx="1" fill="none" stroke={theme.accent} strokeWidth="1" opacity="0.5" />
        ))}

        <text x="182" y="25" textAnchor="middle" fill={theme.accent} fontSize="8" fontWeight="bold" opacity="0.8">
          {theme.label}
        </text>
      </svg>
    </div>
  );
};