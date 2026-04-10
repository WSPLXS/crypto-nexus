import React, { useEffect, useState } from 'react';

interface EarningsAnimationProps {
  amount: number;
  onComplete: () => void;
}

export const EarningsAnimation: React.FC<EarningsAnimationProps> = ({ amount, onComplete }) => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(onComplete, 500);
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{ ...styles.container, opacity }}>
      +${amount.toFixed(2)}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ade80',
    textShadow: '0 0 20px rgba(74, 222, 128, 0.8)',
    pointerEvents: 'none',
    zIndex: 9999,
    transition: 'opacity 0.5s ease-out',
    animation: 'floatUp 1s ease-out forwards',
  },
};

// Добавляем анимацию в CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes floatUp {
    0% {
      transform: translate(-50%, -50%) translateY(0);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) translateY(-50px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);