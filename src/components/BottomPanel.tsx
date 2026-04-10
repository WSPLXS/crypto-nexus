import React from 'react';
import { ChevronDown } from 'lucide-react';

interface BottomPanelProps {
  earningsPerMin: number;
  currentCurrency: string;
  currentPrice: number;
  onCurrencyClick: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  earningsPerMin,
  currentCurrency,
  currentPrice,
  onCurrencyClick,
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <span style={styles.earnings}>+${earningsPerMin.toFixed(2)}/min</span>
      </div>
      
      <button onClick={onCurrencyClick} style={styles.currencyButton}>
        <span style={styles.currencyName}>{currentCurrency}</span>
        <ChevronDown size={16} color="#38bdf8" />
      </button>
      
      <div style={styles.section}>
        <span style={styles.price}>${currentPrice.toLocaleString()}</span>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.95) 100%)',
    padding: '20px 16px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  section: { flex: 1 },
  earnings: {
    fontSize: 18, fontWeight: 'bold', color: '#4ade80',
    textShadow: '0 0 10px rgba(74, 222, 128, 0.5)',
  },
  currencyButton: {
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: 12, padding: '10px 20px',
    display: 'flex', alignItems: 'center', gap: 8,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  currencyName: { fontSize: 18, fontWeight: 'bold', color: '#38bdf8' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#38bdf8', textAlign: 'right' },
};