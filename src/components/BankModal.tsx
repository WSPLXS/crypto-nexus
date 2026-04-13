import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowUpRight, ArrowDownLeft, Repeat, Wallet, MoreVertical, TrendingUp, Shield } from 'lucide-react';
import { CRYPTO_LIST, STAKING_CONFIG } from '../data/economy';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userNickname: string;
  balance: number;
  rubBalance: number;
  bankUsd: number;
  bankRub: number;
  onBalanceUpdate: (usd: number, rub: number) => void;
  onBankUpdate: (usd: number, rub: number) => void;
}

export const BankModal: React.FC<BankModalProps> = ({
  isOpen, onClose, userNickname, balance, rubBalance, bankUsd, bankRub,
  onBalanceUpdate, onBankUpdate
}) => {
  if (!isOpen) return null;

  const [screen, setScreen] = useState<'main' | 'account' | 'transfer' | 'exchange'>('main');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [exchangeAmount, setExchangeAmount] = useState('');

  const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

  const handleTransfer = () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return alert('Введите сумму');
    if (!transferTarget.trim()) return alert('Введите ник получателя');
    if (amt > rubBalance) return alert('Недостаточно рублей');
    
    onBalanceUpdate(balance, rubBalance - amt);
    alert(`✅ Переведено ${amt}₽ пользователю ${transferTarget}`);
    setTransferAmount(''); setTransferTarget('');
  };

  const handleExchange = () => {
    const amt = parseFloat(exchangeAmount);
    if (!amt || amt <= 0) return alert('Введите сумму');
    if (amt > rubBalance) return alert('Недостаточно рублей');
    
    const usdGot = amt / 80;
    onBalanceUpdate(balance + usdGot, rubBalance - amt);
    alert(`✅ Обменяно ${amt}₽ на ${usdGot.toFixed(2)}$`);
    setExchangeAmount('');
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
    btnPrimary: { background: '#007AFF', color: '#fff' },
    accountCard: { background: '#1C1C1E', borderRadius: 22, padding: 20, marginBottom: 16 },
    accRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #2C2C2E' }
  };

  if (screen === 'account') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Банковский счет</span>
            <div style={{width: 24}} />
          </div>
          <div style={s.accountCard}>
            <div style={s.accRow}><span style={{color: '#8E8E93'}}>Счет USD</span><span style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>${fmt(bankUsd)}</span></div>
            <div style={{...s.accRow, borderBottom: 'none'}}><span style={{color: '#8E8E93'}}>Счет RUB</span><span style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>{fmt(bankRub)} ₽</span></div>
          </div>
          <button style={{...s.btn, ...s.btnPrimary}} onClick={() => { onBankUpdate(bankUsd + 100, bankRub); alert('Пополнено на $100'); }}>Пополнить $</button>
          <button style={{...s.btn, background: '#2C2C2E', color: '#fff'}} onClick={() => setScreen('main')}>Назад</button>
        </div>
      </div>
    );
  }

  if (screen === 'transfer') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Перевод</span>
            <div style={{width: 24}} />
          </div>
          <input style={s.input} placeholder="Никнейм получателя" value={transferTarget} onChange={e => setTransferTarget(e.target.value)} />
          <input style={s.input} placeholder="Сумма (₽)" type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
          <button style={{...s.btn, ...s.btnPrimary}} onClick={handleTransfer}>Перевести</button>
          <button style={{...s.btn, background: '#2C2C2E', color: '#fff'}} onClick={() => setScreen('main')}>Назад</button>
        </div>
      </div>
    );
  }

  if (screen === 'exchange') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Обмен валют</span>
            <div style={{width: 24}} />
          </div>
          <div style={{textAlign: 'center', marginBottom: 20, padding: 20, background: '#1C1C1E', borderRadius: 16}}>
            <div style={{fontSize: 13, color: '#8E8E93'}}>Курс обмена</div>
            <div style={{fontSize: 28, fontWeight: '800', color: '#fff'}}>1 $ = 80 ₽</div>
          </div>
          <input style={s.input} placeholder="Сумма в ₽" type="number" value={exchangeAmount} onChange={e => setExchangeAmount(e.target.value)} />
          <button style={{...s.btn, ...s.btnPrimary}} onClick={handleExchange}>Обменять ₽ на $</button>
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
          <button style={s.card} onClick={() => setScreen('account')}>
            <Wallet size={24} color="#007AFF" />
            <span style={s.cardTitle}>Мой Б/С</span>
            <span style={s.cardSub}>Банковский счет</span>
          </button>
          <button style={s.card} onClick={() => setScreen('transfer')}>
            <ArrowUpRight size={24} color="#34C759" />
            <span style={s.cardTitle}>Перевести</span>
            <span style={s.cardSub}>Отправить ₽</span>
          </button>
          <button style={s.card} onClick={() => setScreen('exchange')}>
            <Repeat size={24} color="#AF52DE" />
            <span style={s.cardTitle}>Обменять</span>
            <span style={s.cardSub}>₽ ⇄ $</span>
          </button>
        </div>
      </div>
    </div>
  );
};