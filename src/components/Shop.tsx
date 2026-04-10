import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { currencies } from '../data/currencies';
import type { Currency } from '../types';

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  priceMultipliers: Record<string, number>;
  onBuy: (currencyId: string, amount: number) => void;
}

export const Shop: React.FC<ShopProps> = ({ isOpen, onClose, balance, priceMultipliers, onBuy }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [buyAmount, setBuyAmount] = useState(1);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  if (!isOpen) return null;

  const getCurrentPrice = (currency: Currency) => {
    return currency.price * (priceMultipliers[currency.id] || 1);
  };

  const handleCurrencyClick = (currency: Currency) => {
    if (currency.id === 'divider') return;
    setSelectedCurrency(currency);
    setBuyAmount(1);
  };

  const handleBuy = () => {
    if (selectedCurrency) {
      onBuy(selectedCurrency.id, buyAmount);
      setSelectedCurrency(null);
      setBuyAmount(1);
    }
  };

  const currentPrice = selectedCurrency ? getCurrentPrice(selectedCurrency) : 0;
  const totalPrice = currentPrice * buyAmount;
  const canAfford = balance >= totalPrice;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🛒 Магазин валют</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} color="#737373" />
          </button>
        </div>

        <div style={styles.balance}>
          💵 Баланс: <span style={styles.balanceValue}>${balance.toFixed(2)}</span>
        </div>

        <div style={styles.grid}>
          {currencies.map((currency) => {
            const isHovered = hoveredCard === currency.id;
            const price = getCurrentPrice(currency);
            return (
              <div
                key={currency.id}
                onClick={() => handleCurrencyClick(currency)}
                onMouseEnter={() => setHoveredCard(currency.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  ...styles.currencyCard,
                  opacity: currency.id === 'divider' ? 0.5 : 1,
                  cursor: currency.id === 'divider' ? 'default' : 'pointer',
                  background: currency.category === 'meme' ? 'rgba(38, 38, 38, 0.6)' : 'rgba(28, 28, 28, 0.6)',
                  border: currency.category === 'meme' ? '1px solid rgba(156, 163, 175, 0.2)' : '1px solid rgba(156, 163, 175, 0.15)',
                  transform: isHovered && currency.id !== 'divider' ? 'translateY(-4px)' : 'none',
                  borderColor: isHovered && currency.id !== 'divider' ? 'rgba(156, 163, 175, 0.3)' : undefined,
                }}
              >
                {currency.id === 'divider' ? (
                  <div style={styles.divider}>
                    <div style={styles.dividerLine}></div>
                    <span style={styles.dividerText}>{currency.name}</span>
                    <div style={styles.dividerLine}></div>
                  </div>
                ) : (
                  <>
                    <div style={styles.imageContainer}>
                      <img 
                        src={currency.imageUrl} 
                        alt={currency.name} 
                        style={styles.currencyImage}
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/120x120/262626/9ca3af?text=${currency.shortName}`; }}
                      />
                    </div>
                    <div style={styles.currencyInfo}>
                      <div style={styles.currencyName}>{currency.name}</div>
                      <div style={styles.currencyShortName}>{currency.shortName}</div>
                      <div style={styles.currencyPrice}>${price.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                      <div style={styles.currencyIncome}>+${currency.incomePerSecond}/сек</div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {selectedCurrency && (
          <div style={styles.buyModal}>
            <div style={styles.buyHeader}>
              <img src={selectedCurrency.imageUrl} alt={selectedCurrency.name} style={styles.buyImage} 
                onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/80x80/262626/9ca3af?text=${selectedCurrency.shortName}`; }}
              />
              <div style={styles.buyInfo}>
                <div style={styles.buyName}>{selectedCurrency.name}</div>
                <div style={styles.buyPrice}>${currentPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
              </div>
            </div>

            <div style={styles.amountSelector}>
              <button onClick={() => setBuyAmount(Math.max(1, buyAmount - 1))} style={styles.amountButton}>
                <span style={{ fontSize: 20, color: '#9ca3af' }}>-</span>
              </button>
              <span style={styles.amountValue}>{buyAmount}</span>
              <button onClick={() => setBuyAmount(buyAmount + 1)} style={styles.amountButton}>
                <span style={{ fontSize: 20, color: '#9ca3af' }}>+</span>
              </button>
            </div>

            <div style={styles.totalPrice}>
              Итого: <span style={{ color: canAfford ? '#22c55e' : '#ef4444' }}>${totalPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
            </div>

            <button onClick={handleBuy} disabled={!canAfford} style={{ ...styles.buyButton, opacity: canAfford ? 1 : 0.5, cursor: canAfford ? 'pointer' : 'not-allowed' }}>
              КУПИТЬ
            </button>
            <button onClick={() => { setSelectedCurrency(null); setBuyAmount(1); }} style={styles.backButton}>← Назад</button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', overflow: 'auto' },
  modal: { background: 'linear-gradient(145deg, #141414 0%, #0a0a0a 100%)', borderRadius: 20, padding: 24, width: '95%', maxWidth: 800, maxHeight: '90vh', border: '1px solid rgba(156, 163, 175, 0.1)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#e5e5e5', margin: 0 },
  closeButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  balance: { fontSize: 16, marginBottom: 20, color: '#737373', padding: '12px 16px', background: 'rgba(20, 20, 20, 0.8)', borderRadius: 12, border: '1px solid rgba(156, 163, 175, 0.1)' },
  balanceValue: { color: '#22c55e', fontWeight: 'bold', fontSize: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '8px' },
  currencyCard: { borderRadius: 16, padding: 0, textAlign: 'center', transition: 'transform 0.2s, border-color 0.2s', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  imageContainer: { width: '100%', height: 180, background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, borderBottom: '1px solid rgba(156, 163, 175, 0.1)' },
  currencyImage: { width: '100%', height: '100%', objectFit: 'contain' },
  currencyInfo: { padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(20, 20, 20, 0.4)' },
  currencyName: { fontSize: 14, fontWeight: '600', color: '#e5e5e5' },
  currencyShortName: { fontSize: 12, color: '#737373' },
  currencyPrice: { fontSize: 18, fontWeight: 'bold', color: '#22c55e' },
  currencyIncome: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  divider: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, gridColumn: '1 / -1', padding: '20px 0', background: 'rgba(38, 38, 38, 0.4)', borderRadius: 12, margin: '8px 0' },
  dividerLine: { flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(156, 163, 175, 0.3), transparent)' },
  dividerText: { fontSize: 14, fontWeight: 'bold', color: '#9ca3af', letterSpacing: '2px', paddingLeft: 16, paddingRight: 16 },
  buyModal: { position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(145deg, #141414 0%, #0a0a0a 100%)', borderRadius: 20, padding: 24, width: '90%', maxWidth: 400, border: '1px solid rgba(156, 163, 175, 0.2)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)', zIndex: 1001 },
  buyHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px', background: 'rgba(20, 20, 20, 0.6)', borderRadius: 12, border: '1px solid rgba(156, 163, 175, 0.1)' },
  buyImage: { width: 80, height: 80, objectFit: 'contain' },
  buyInfo: { flex: 1 },
  buyName: { fontSize: 20, fontWeight: 'bold', color: '#e5e5e5', marginBottom: 4 },
  buyPrice: { fontSize: 16, color: '#22c55e', fontWeight: 'bold' },
  amountSelector: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16, padding: '16px', background: 'rgba(20, 20, 20, 0.6)', borderRadius: 12 },
  amountButton: { width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(156, 163, 175, 0.2)', background: 'rgba(26, 26, 26, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  amountValue: { fontSize: 24, fontWeight: 'bold', color: '#e5e5e5', minWidth: 60, textAlign: 'center' },
  totalPrice: { fontSize: 18, textAlign: 'center', marginBottom: 16, padding: '12px', background: 'rgba(20, 20, 20, 0.6)', borderRadius: 12, color: '#737373' },
  buyButton: { width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: 'linear-gradient(145deg, #262626 0%, #171717 100%)', color: '#e5e5e5', fontSize: 18, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' },
  backButton: { width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(156, 163, 175, 0.2)', background: 'transparent', color: '#9ca3af', fontSize: 15, fontWeight: '500', cursor: 'pointer', marginTop: 10 },
};