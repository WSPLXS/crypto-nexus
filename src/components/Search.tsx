import React, { useState, useMemo } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { currencies } from '../data/currencies';
import type { Currency } from '../types';

interface SearchProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  priceMultipliers: Record<string, number>;
  onBuy: (currencyId: string, amount: number) => void;
}

export const Search: React.FC<SearchProps> = ({ isOpen, onClose, balance, priceMultipliers, onBuy }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [buyAmount, setBuyAmount] = useState(1);

  const getCurrentPrice = (currency: Currency) => {
    return currency.price * (priceMultipliers[currency.id] || 1);
  };

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return currencies.filter(c => 
      c.id !== 'divider' && 
      (c.name.toLowerCase().includes(query) || 
       c.shortName.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleCurrencyClick = (currency: Currency) => {
    setSelectedCurrency(currency);
    setBuyAmount(1);
  };

  const handleBuy = () => {
    if (selectedCurrency) {
      onBuy(selectedCurrency.id, buyAmount);
      setSelectedCurrency(null);
      setBuyAmount(1);
      setSearchQuery('');
    }
  };

  const currentPrice = selectedCurrency ? getCurrentPrice(selectedCurrency) : 0;
  const totalPrice = currentPrice * buyAmount;
  const canAfford = balance >= totalPrice;

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔍 Поиск валют</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} color="#737373" />
          </button>
        </div>

        <div style={styles.searchBox}>
          <SearchIcon size={20} color="#737373" style={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите название (например: Bitcoin, BTC, TikTok...)"
            style={styles.searchInput}
            autoFocus
          />
        </div>

        {selectedCurrency ? (
          <div style={styles.buyModal}>
            <div style={styles.buyHeader}>
              <img src={selectedCurrency.imageUrl} alt={selectedCurrency.name} style={styles.buyImage} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/80x80/262626/9ca3af?text=${selectedCurrency.shortName}`;
                }}
              />
              <div style={styles.buyInfo}>
                <div style={styles.buyName}>{selectedCurrency.name}</div>
                <div style={styles.buyPrice}>${currentPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
              </div>
            </div>

            <div style={styles.amountSelector}>
              <button
                onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))}
                style={styles.amountButton}
              >
                <span style={{ fontSize: 20, color: '#9ca3af' }}>-</span>
              </button>
              <span style={styles.amountValue}>{buyAmount}</span>
              <button
                onClick={() => setBuyAmount(buyAmount + 1)}
                style={styles.amountButton}
              >
                <span style={{ fontSize: 20, color: '#9ca3af' }}>+</span>
              </button>
            </div>

            <div style={styles.totalPrice}>
              Итого: <span style={{ color: canAfford ? '#22c55e' : '#ef4444' }}>
                ${totalPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}
              </span>
            </div>

            <button
              onClick={handleBuy}
              disabled={!canAfford}
              style={{
                ...styles.buyButton,
                opacity: canAfford ? 1 : 0.5,
                cursor: canAfford ? 'pointer' : 'not-allowed',
              }}
            >
              КУПИТЬ
            </button>

            <button
              onClick={() => { setSelectedCurrency(null); setBuyAmount(1); }}
              style={styles.backButton}
            >
              ← Назад к поиску
            </button>
          </div>
        ) : (
          <div style={styles.results}>
            {searchQuery.trim() === '' ? (
              <div style={styles.emptyState}>
                <SearchIcon size={48} color="#404040" style={{ marginBottom: 12 }} />
                <p style={styles.emptyText}>Введите название валюты для поиска</p>
                <p style={styles.emptySubtext}>Например: Bitcoin, TikTok, VK, Maxcoin...</p>
              </div>
            ) : filteredCurrencies.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.notFound}>Ничего не найдено</p>
                <p style={styles.emptySubtext}>Попробуйте другой запрос</p>
              </div>
            ) : (
              filteredCurrencies.map((currency) => {
                const price = getCurrentPrice(currency);
                return (
                  <div
                    key={currency.id}
                    onClick={() => handleCurrencyClick(currency)}
                    style={styles.resultItem}
                  >
                    <img 
                      src={currency.imageUrl} 
                      alt={currency.name} 
                      style={styles.resultImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/48x48/262626/9ca3af?text=${currency.shortName}`;
                      }}
                    />
                    <div style={styles.resultInfo}>
                      <div style={styles.resultName}>{currency.name}</div>
                      <div style={styles.resultShort}>{currency.shortName}</div>
                    </div>
                    <div style={styles.resultPrice}>${price.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  </div>
                );
              })
            )}
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
    width: '95%',
    maxWidth: 500,
    maxHeight: '85vh',
    border: '1px solid rgba(156, 163, 175, 0.1)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  searchBox: {
    position: 'relative',
    marginBottom: 20,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    background: 'rgba(20, 20, 20, 0.8)',
    border: '1px solid rgba(156, 163, 175, 0.15)',
    borderRadius: 14,
    color: '#e5e5e5',
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
  },
  results: {
    flex: 1,
    overflow: 'auto',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    background: 'rgba(20, 20, 20, 0.6)',
    borderRadius: 12,
    marginBottom: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid rgba(156, 163, 175, 0.1)',
  },
  resultImage: {
    width: 48,
    height: 48,
    objectFit: 'contain',
    borderRadius: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e5e5e5',
    marginBottom: 2,
  },
  resultShort: {
    fontSize: 12,
    color: '#737373',
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#737373',
  },
  emptyText: {
    fontSize: 16,
    color: '#a3a3a3',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#525252',
  },
  notFound: {
    fontSize: 18,
    color: '#a3a3a3',
    marginBottom: 8,
  },
  buyModal: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  buyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px',
    background: 'rgba(20, 20, 20, 0.6)',
    borderRadius: 12,
    border: '1px solid rgba(156, 163, 175, 0.1)',
  },
  buyImage: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  buyInfo: {
    flex: 1,
  },
  buyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e5e5',
    marginBottom: 4,
  },
  buyPrice: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: 'bold',
  },
  amountSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: '16px',
    background: 'rgba(20, 20, 20, 0.6)',
    borderRadius: 12,
  },
  amountButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '1px solid rgba(156, 163, 175, 0.2)',
    background: 'rgba(26, 26, 26, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e5e5e5',
    minWidth: 60,
    textAlign: 'center' as const,
  },
  totalPrice: {
    fontSize: 18,
    textAlign: 'center' as const,
    padding: '12px',
    background: 'rgba(20, 20, 20, 0.6)',
    borderRadius: 12,
    color: '#737373',
  },
  buyButton: {
    width: '100%',
    padding: '16px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(145deg, #262626 0%, #171717 100%)',
    color: '#e5e5e5',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: '1px solid rgba(156, 163, 175, 0.2)',
    background: 'transparent',
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};