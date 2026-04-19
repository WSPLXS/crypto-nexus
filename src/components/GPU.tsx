import React from 'react';

interface GPUProps { 
  tier: number;
  isMining: boolean;
  isAnimating?: boolean; // 🔥 ДОБАВЛЕНО: необязательный проп
}

export const GPU: React.FC<GPUProps> = ({ tier, isMining, isAnimating = false }) => {
  // 🔥 АДАПТАЦИЯ ПОД НОВУЮ СИСТЕМУ 10 УРОВНЕЙ
  const visualTier = Math.max(1, Math.min(10, tier));
  
  // Цветовая схема в зависимости от тира
  const glowColor = visualTier >= 8 ? '#ef4444' : visualTier >= 5 ? '#f59e0b' : visualTier >= 3 ? '#3b82f6' : '#64748b';
  const fansCount = visualTier >= 6 ? 3 : visualTier >= 3 ? 2 : 1;
  const cardHeight = 140 + (visualTier * 4);
  
  return (
    <div style={styles.container}>
      {/* Анимация вращения */}
      <style>{`
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
      
      <div style={styles.scene}>
        {/* Основная плата видеокарты */}
        <div style={{
          ...styles.gpuCard,
          height: cardHeight,
          width: 200,
          transform: `rotateY(-15deg) rotateX(5deg)`,
          boxShadow: `40px 20px 40px rgba(0,0,0,0.6), 
                      0 0 ${visualTier * 12}px ${glowColor}40,
                      inset 0 0 20px rgba(255,255,255,0.05)`,
        }}>
          {/* Боковая грань (толщина) */}
          <div style={{
            ...styles.gpuSide,
            height: cardHeight,
            background: `linear-gradient(90deg, #1e293b, #0f172a)`,
          }}></div>
          
          {/* Верхняя часть (радиатор) */}
          <div style={{
            ...styles.gpuTop,
            background: visualTier >= 3 
              ? `repeating-linear-gradient(90deg, #334155 0px, #334155 2px, #1e293b 2px, #1e293b 6px)`
              : 'linear-gradient(180deg, #475569 0%, #334155 100%)',
          }}>
            {/* Тепловые трубки */}
            {visualTier >= 4 && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                ...styles.heatpipe,
                top: 25 + (i * 28),
                background: `linear-gradient(90deg, #b45309, #f59e0b, #b45309)`,
                boxShadow: visualTier >= 5 ? '0 0 10px #f59e0b' : 'none',
              }}></div>
            ))}
          </div>
          
          {/* Вентиляторы */}
          <div style={{
            ...styles.fansWrapper,
            height: cardHeight - 30,
          }}>
            {Array.from({ length: fansCount }).map((_, i) => (
              <div key={i} style={{
                ...styles.fanHousing,
                background: visualTier >= 2 
                  ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent), 
                     linear-gradient(135deg, #1e293b, #0f172a)`
                  : 'linear-gradient(135deg, #334155, #1e293b)',
                border: visualTier >= 2 ? `2px solid ${glowColor}30` : '1px solid rgba(255,255,255,0.1)',
                boxShadow: visualTier >= 3 ? `inset 0 0 20px ${glowColor}20, 0 0 15px ${glowColor}30` : 'inset 0 0 10px rgba(0,0,0,0.5)',
              }}>
                {/* Сам вентилятор */}
                <div style={styles.fanContainer}>
                  <div style={{
                    ...styles.fan,
                    // 🔥 ПОСТОЯННОЕ ВРАЩЕНИЕ если isAnimating=true
                    ...(isAnimating && styles.spinning),
                  }}>
                    {/* Лопасти */}
                    {Array.from({ length: 9 }).map((_, j) => (
                      <div key={j} style={{
                        ...styles.fanBlade,
                        transform: `rotate(${j * 40}deg)`,
                        background: `linear-gradient(${135 + j * 40}deg, 
                          ${visualTier >= 2 ? glowColor : '#64748b'}40 0%, 
                          ${visualTier >= 2 ? glowColor : '#64748b'}20 50%, 
                          transparent 100%)`,
                      }}></div>
                    ))}
                    
                    {/* Центр вентилятора */}
                    <div style={{
                      ...styles.fanCenter,
                      background: `radial-gradient(circle, ${glowColor}, ${glowColor}80)`,
                      boxShadow: `0 0 20px ${glowColor}, inset 0 0 10px rgba(255,255,255,0.3)`,
                    }}></div>
                  </div>
                  
                  {/* RGB кольцо вокруг вентилятора */}
                  {visualTier >= 2 && (
                    <div style={{
                      ...styles.rgbRing,
                      border: `3px solid ${glowColor}`,
                      boxShadow: `0 0 15px ${glowColor}, inset 0 0 10px ${glowColor}40`,
                      opacity: isMining ? 1 : 0.6,
                    }}></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* RGB полоса снизу */}
          <div style={{
            ...styles.rgbStrip,
            background: `linear-gradient(90deg, transparent, ${glowColor}, ${glowColor}80, ${glowColor}, transparent)`,
            boxShadow: `0 0 20px ${glowColor}`,
            opacity: visualTier >= 2 ? 1 : 0.7,
          }}></div>
          
          {/* Разъемы питания (на высоких тирах) */}
          {visualTier >= 4 && (
            <div style={styles.powerConnectors}>
              {Array.from({ length: visualTier >= 7 ? 3 : 2 }).map((_, i) => (
                <div key={i} style={{
                  ...styles.powerPin,
                  background: 'linear-gradient(180deg, #1e293b, #0f172a)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}></div>
              ))}
            </div>
          )}
          
          {/* PCIe разъем */}
          <div style={{
            ...styles.pcieSlot,
            background: 'linear-gradient(180deg, #fbbf24, #d97706)',
            boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
          }}></div>
        </div>
        
        {/* Тень под картой */}
        <div style={{
          ...styles.shadow,
          height: cardHeight * 0.5,
          width: 200,
          boxShadow: `0 20px 60px rgba(0,0,0,0.8)`,
        }}></div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    width: '100%',
    height: 400,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scene: {
    position: 'relative',
    width: 240,
    height: 320,
    transformStyle: 'preserve-3d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpuCard: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -100,
    marginTop: -70,
    transformStyle: 'preserve-3d',
    borderRadius: 12,
    transition: 'all 0.5s ease',
    overflow: 'visible',
  },
  gpuSide: {
    position: 'absolute',
    right: -40,
    top: 0,
    width: 40,
    borderRadius: '0 8px 8px 0',
    zIndex: 1,
  },
  gpuTop: {
    position: 'absolute',
    top: -15,
    left: 0,
    right: 0,
    height: 15,
    borderRadius: '8px 8px 0 0',
    zIndex: 2,
  },
  heatpipe: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 6,
    borderRadius: 3,
    zIndex: 3,
  },
  fansWrapper: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 45,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 4,
  },
  fanHousing: {
    flex: 1,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanContainer: {
    position: 'relative',
    width: 75,
    height: 75,
  },
  fan: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 75,
    height: 75,
    borderRadius: '50%',
  },
  spinning: {
    animation: 'spin 0.8s linear infinite',
  },
  fanBlade: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 38,
    height: 10,
    borderRadius: '5px',
    transformOrigin: 'left center',
    marginTop: -5,
  },
  fanCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  rgbRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  rgbStrip: {
    position: 'absolute',
    bottom: 15,
    left: '10%',
    right: '10%',
    height: 5,
    borderRadius: 3,
    zIndex: 5,
  },
  powerConnectors: {
    position: 'absolute',
    top: 20,
    right: -35,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 3,
  },
  powerPin: {
    width: 22,
    height: 14,
    borderRadius: 3,
  },
  pcieSlot: {
    position: 'absolute',
    bottom: -10,
    left: 25,
    right: 25,
    height: 10,
    borderRadius: '0 0 4px 4px',
    zIndex: 2,
  },
  shadow: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: 'translateX(-50%)',
    borderRadius: '50%',
    filter: 'blur(20px)',
    background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
    zIndex: 0,
  },
};