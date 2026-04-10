import React from 'react';
import { X } from 'lucide-react';
import { currencies } from '../data/currencies';
import type { OwnedCurrency } from '../types';

interface CurrencySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  ownedCurrencies: OwnedCurrency[];
  selectedCurrency: string;
  onSelect: (currencyId: string) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  isOpen,
  onClose,
  ownedCurrencies,
  selectedCurrency,
  onSelect,
}) => {
  if (!isOpen) return null;

  const getCurrencyById = (id: string) => currencies.find(c => c.id === id);

  const totalIncome = ownedCurrencies.reduce((total, owned) => {
    const currency = getCurrencyById(owned.currencyId);
    return total + (currency ? currency.incomePerSecond * owned.amount : 0);
  }, 0);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>💰 Ваши валюты</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} color="#737373" />
          </button>
        </div>

        <div style={styles.totalIncomeBox}>
          Общий доход: <span style={styles.incomeValue}>+${totalIncome.toFixed(2)}/сек</span>
        </div>

        {ownedCurrencies.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <p style={styles.emptyText}>У вас пока нет валют</p>
            <p style={styles.emptySubtext}>Купите свою первую валюту в магазине!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {ownedCurrencies.map((owned) => {
              const currency = getCurrencyById(owned.currencyId);
              if (!currency) return null;
              
              const isSelected = selectedCurrency === owned.currencyId;
              
              return (
                <div
                  key={owned.currencyId}
                  onClick={() => {
                    onSelect(owned.currencyId);
                    onClose();
                  }}
                  style={{
                    ...styles.currencyItem,
                    background: isSelected 
                      ? 'rgba(38, 38, 38, 0.8)' 
                      : 'rgba(20, 20, 20, 0.6)',
                    border: isSelected 
                      ? '1px solid rgba(156, 163, 175, 0.3)' 
                      : '1px solid rgba(156, 163, 175, 0.1)',
                  }}
                >
                  <div style={styles.imageContainer}>
                    <img 
                      src={currency.imageUrl} 
                      alt={currency.name} 
                      style={styles.currencyImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/48x48/262626/9ca3af?text=${currency.shortName}`;
                      }}
                    />
                  </div>

                  <div style={styles.currencyInfo}>
                    <div style={styles.currencyName}>{currency.name}</div>
                    <div style={styles.currencyShort}>{currency.shortName}</div>
                  </div>
                  <div style={styles.currencyAmount}>
                    <div style={styles.amount}>{owned.amount} шт.</div>
                    <div style={styles.income}>
                      +${(currency.incomePerSecond * owned.amount).toFixed(2)}/сек
                    </div>
                  </div>
                  {isSelected && <div style={styles.checkmark}>✓</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
  },
  modal: {
    background: 'linear-gradient(145deg, #141414 0%, #0a0a0a 100%)',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80vh',
    border: '1px solid rgba(156, 163, 175, 0.1)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e5e5e5',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  totalIncomeBox: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    color: '#737373',
    padding: '14px',
    background: 'rgba(20, 20, 20, 0.8)',
    borderRadius: 12,
    border: '1px solid rgba(156, 163, 175, 0.1)',
  },
  incomeValue: {
    color: '#22c55e',
    fontWeight: 'bold',
    fontSize: 17,
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 17,
    color: '#e5e5e5',
    marginBottom: 8,
    fontWeight: 500,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#737373',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  currencyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  imageContainer: {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 10,
    border: '1px solid rgba(156, 163, 175, 0.1)',
    overflow: 'hidden',
  },
  currencyImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e5e5e5',
    marginBottom: 4,
  },
  currencyShort: {
    fontSize: 12,
    color: '#737373',
  },
  currencyAmount: {
    textAlign: 'right',
  },
  amount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e5e5e5',
    marginBottom: 4,
  },
  income: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: 500,
  },
  checkmark: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 18,
    color: '#22c55e',
    background: 'rgba(34, 197, 94, 0.15)',
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};