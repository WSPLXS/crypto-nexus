import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, TrendingUp, Shield } from 'lucide-react';
import { CRYPTO_LIST, STAKING_CONFIG } from '../data/economy';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userNickname: string;
  balance: number;
  rubBalance: number;
  onBalanceUpdate: (usd: number, rub: number) => void;
}

export const BankModal: React.FC<BankModalProps> = ({
  isOpen, onClose, userNickname, balance, rubBalance, onBalanceUpdate
}) => {
  if (!isOpen) return null;

  const [screen, setScreen] = useState<'main' | 'trade' | 'staking'>('main');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_LIST[0].id);
  const [tradeAmount, setTradeAmount] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakedAmount, setStakedAmount] = useState(0);

  useEffect(() => {
    const initPrices: Record<string, number> = {};
    CRYPTO_LIST.forEach(c => initPrices[c.id] = c.basePrice);
    setLivePrices(initPrices);

    const interval = setInterval(() => {
      setLivePrices(prev => {
        const next = { ...prev };
        CRYPTO_LIST.forEach(c => {
          const change = 1 + (Math.random() * 0.04 - 0.02);
          next[c.id] = Math.max(c.basePrice * 0.5, next[c.id] * change);
        });
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

  const handleTrade = (type: 'buy' | 'sell') => {
    const amt = parseFloat(tradeAmount);
    if (!amt || amt <= 0) return alert('Введите количество монет');
    
    const price = livePrices[selectedCrypto] || CRYPTO_LIST.find(c => c.id === selectedCrypto)?.basePrice || 0;
    const totalRub = amt * price;

    if (type === 'buy') {
      if (totalRub > rubBalance) return alert('Недостаточно рублей');
      onBalanceUpdate(balance, rubBalance - totalRub);
      alert(`✅ Куплено ${amt} ${selectedCrypto.toUpperCase()} за ${fmt(totalRub)}₽`);
    } else {
      onBalanceUpdate(balance, rubBalance + totalRub);
      alert(`✅ Продано ${amt} ${selectedCrypto.toUpperCase()} за ${fmt(totalRub)}₽`);
    }
    setTradeAmount('');
  };

  const handleStake = () => {
    const amt = parseFloat(stakeAmount);
    if (!amt || amt <= 0) return alert('Введите сумму в $');
    if (amt > balance) return alert('Недостаточно долларов');
    
    onBalanceUpdate(balance - amt, rubBalance);
    setStakedAmount(prev => prev + amt);
    alert(`✅ В стейкинг отправлено $${amt}. Доход: ${STAKING_CONFIG.dailyYieldPercent}%/день`);
    setStakeAmount('');
  };

  const s: any = {
    overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 9999, overflowY: 'auto' },
    container: { maxWidth: 420, margin: '0 auto', padding: '16px 16px 40px', minHeight: '100vh' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    backBtn: { background: 'none', border: 'none', padding: 8, cursor: 'pointer' },
    nickname: { fontSize: 20, fontWeight: '800', color: '#fff' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
    card: { background: '#1C1C1E', borderRadius: 22, padding: 16, cursor: 'pointer', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 },
    cardTitle: { fontSize: 16, fontWeight: '600' },
    cardSub: { fontSize: 12, color: '#8E8E93' },
    input: { width: '100%', padding: '14px', borderRadius: 14, background: '#1C1C1E', border: '1px solid #2C2C2E', color: '#fff', fontSize: 16, marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontWeight: '700', fontSize: 15, cursor: 'pointer', marginBottom: 8 },
    btnBuy: { background: '#34C759', color: '#000' },
    btnSell: { background: '#FF453A', color: '#fff' },
    btnStake: { background: '#FFD60A', color: '#000' },
    list: { maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
    item: { background: '#1C1C1E', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid transparent' },
    activeItem: { background: '#2C2C2E', border: '1px solid #007AFF' }
  };

  if (screen === 'trade') {
    const crypto = CRYPTO_LIST.find(c => c.id === selectedCrypto);
    const currentPrice = livePrices[selectedCrypto] || crypto?.basePrice || 0;
    
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Торговля</span>
            <div style={{width: 24}} />
          </div>
          
          <div style={s.list}>
            {CRYPTO_LIST.map(c => (
              <div key={c.id} style={selectedCrypto === c.id ? {...s.item, ...s.activeItem} : s.item} onClick={() => setSelectedCrypto(c.id)}>
                <span style={{fontWeight: 'bold', color: '#fff'}}>{c.name}</span>
                <span style={{color: '#8E8E93'}}>{fmt(livePrices[c.id] || c.basePrice)} ₽</span>
              </div>
            ))}
          </div>

          <div style={{textAlign: 'center', marginBottom: 16, padding: 20, background: '#1C1C1E', borderRadius: 16}}>
            <div style={{fontSize: 13, color: '#8E8E93'}}>Курс {selectedCrypto.toUpperCase()}</div>
            <div style={{fontSize: 32, fontWeight: '800', color: '#fff'}}>{fmt(currentPrice)} ₽</div>
          </div>

          <input style={s.input} placeholder="Количество монет" type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} />
          <div style={{display: 'flex', gap: 12}}>
            <button style={{...s.btn, ...s.btnBuy}} onClick={() => handleTrade('buy')}>Купить</button>
            <button style={{...s.btn, ...s.btnSell}} onClick={() => handleTrade('sell')}>Продать</button>
          </div>
          <button style={{...s.btn, background: '#2C2C2E', color: '#fff'}} onClick={() => setScreen('main')}>Назад</button>
        </div>
      </div>
    );
  }

  if (screen === 'staking') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Крипто-Стейкинг</span>
            <div style={{width: 24}} />
          </div>
          <div style={{background: '#1C1C1E', borderRadius: 22, padding: 20, textAlign: 'center', marginBottom: 20}}>
            <Shield size={32} color="#FFD60A" style={{marginBottom: 8}}/>
            <div style={{fontSize: 14, color: '#8E8E93'}}>В стейкинге</div>
            <div style={{fontSize: 32, fontWeight: '800', color: '#FFD60A'}}>${fmt(stakedAmount)}</div>
            <div style={{fontSize: 12, color: '#34C759', marginTop: 4}}>+{STAKING_CONFIG.dailyYieldPercent}% / день</div>
          </div>
          <input style={s.input} placeholder="Сумма в $" type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} />
          <button style={{...s.btn, ...s.btnStake}} onClick={handleStake}>Отправить в стейкинг</button>
          <button style={{...s.btn, background: '#2C2C2E', color: '#fff'}} onClick={() => setScreen('main')}>Назад</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.container} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <button onClick={onClose} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
          <span style={s.nickname}>{userNickname}</span>
          <div style={{width: 24}} />
        </div>
        
        <div style={s.grid}>
          <button style={s.card} onClick={() => setScreen('trade')}>
            <TrendingUp size={24} color="#34C759" />
            <span style={s.cardTitle}>Торговля</span>
            <span style={s.cardSub}>Покупай/продавай крипто</span>
          </button>
          <button style={s.card} onClick={() => setScreen('staking')}>
            <Shield size={24} color="#FFD60A" />
            <span style={s.cardTitle}>Стейкинг</span>
            <span style={s.cardSub}>{STAKING_CONFIG.dailyYieldPercent}% доход в день</span>
          </button>
        </div>
      </div>
    </div>
  );
};