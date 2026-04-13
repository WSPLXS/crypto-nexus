import React, { useState } from 'react';
import { X, ArrowLeft, ArrowUpRight, ArrowDownLeft, Repeat, Wallet, CreditCard, MoreVertical, ChevronRight, User, Shield, Clock } from 'lucide-react';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  balance: number;
  rubBalance: number;
  bankUsd: number;
  bankRub: number;
  cryptoHoldings: any;
  cryptoRates: any;
  onBalanceUpdate: (usd: number, rub: number) => void;
  onBankUpdate: (usd: number, rub: number) => void;
  onCryptoUpdate: (holdings: any) => void;
}

export const BankModal: React.FC<BankModalProps> = ({
  isOpen, onClose, balance, rubBalance, bankUsd, bankRub,
  onBalanceUpdate, onBankUpdate
}) => {
  if (!isOpen) return null;

  const [screen, setScreen] = useState<'main' | 'operations' | 'transfer' | 'account' | 'exchange'>('main');
  const [cardSide, setCardSide] = useState<'rub' | 'usd'>('rub');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [exchangeAmount, setExchangeAmount] = useState('');

  // Моковые траты (в проде подключим к таблице transactions)
  const monthlySpend = 2064;
  const operations = [
    { id: 1, title: 'Перевод другу', date: '12 апр, 14:30', amount: -500, currency: '₽' },
    { id: 2, title: 'Обмен валюты', date: '11 апр, 09:15', amount: -1200, currency: '₽' },
    { id: 3, title: 'Пополнение Б/С', date: '10 апр, 18:45', amount: 3500, currency: '₽' },
    { id: 4, title: 'Оплата бизнес-света', date: '09 апр, 12:00', amount: -50, currency: '$' },
  ];

  const fmt = (n: number, curr: string) => 
    `${n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ${curr}`;

  const handleTransfer = () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return alert('Введите сумму');
    if (amt > rubBalance) return alert('Недостаточно средств');
    onBalanceUpdate(balance, rubBalance - amt);
    onBankUpdate(bankUsd, bankRub + amt); // В реальном банке деньги уходят на счет получателя
    alert(`✅ Переведено ${amt}₽`);
    setTransferAmount(''); setTransferTarget(''); setScreen('main');
  };

  const handleExchange = () => {
    const amt = parseFloat(exchangeAmount);
    if (!amt || amt <= 0) return alert('Введите сумму');
    if (amt > rubBalance) return alert('Недостаточно рублей');
    const usdRate = 95;
    const usdGot = amt / usdRate;
    onBalanceUpdate(balance + usdGot, rubBalance - amt);
    alert(`✅ Обменяно ${amt}₽ на ${usdGot.toFixed(2)}$`);
    setExchangeAmount(''); setScreen('main');
  };

  // 🎨 СТИЛИ (Т-Банк Dark Mode)
  const s: any = {
    overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 9999, overflowY: 'auto' },
    container: { maxWidth: 420, margin: '0 auto', padding: '16px 16px 40px', minHeight: '100vh' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    backBtn: { background: 'none', border: 'none', padding: 8, cursor: 'pointer' },
    userSection: { display: 'flex', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
    nickname: { fontSize: 20, fontWeight: '800', color: '#fff' },
    topGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12, marginBottom: 20 },
    actionBlock: { background: '#1C1C1E', borderRadius: 22, padding: 16, textAlign: 'left', border: 'none', color: '#fff', cursor: 'pointer' },
    infoBlock: { background: '#1C1C1E', borderRadius: 22, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    blockTitle: { fontSize: 17, fontWeight: '600', display: 'block', marginBottom: 4 },
    blockSub: { fontSize: 13, color: '#8E8E93', display: 'block' },
    progressBar: { height: 6, background: '#2C2C2E', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    progressFill: { width: '60%', height: '100%', background: 'linear-gradient(90deg, #00C6FF, #0072FF)', borderRadius: 3 },
    middleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 },
    midBtn: { background: '#1C1C1E', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' },
    midBtnText: { fontSize: 12, color: '#fff', fontWeight: '500' },
    cardWrapper: { background: '#1C1C1E', borderRadius: 24, padding: 20, position: 'relative', cursor: 'pointer', transition: 'transform 0.2s', marginBottom: 24 },
    cardContent: { display: 'flex', flexDirection: 'column', gap: 16 },
    cardTop: { display: 'flex', alignItems: 'center', gap: 12 },
    currencyIcon: { width: 44, height: 44, borderRadius: 12, background: '#2C2C2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', color: '#fff' },
    cardBalance: { fontSize: 28, fontWeight: '800', color: '#fff' },
    cardLabel: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
    miniCard: { width: 60, height: 40, background: 'linear-gradient(135deg, #333, #111)', borderRadius: 8, border: '1px solid #444' },
    sectionTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 },
    list: { display: 'flex', flexDirection: 'column', gap: 12 },
    opItem: { background: '#1C1C1E', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    opInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
    opTitle: { fontSize: 16, fontWeight: '500', color: '#fff' },
    opDate: { fontSize: 13, color: '#8E8E93' },
    opAmount: { fontSize: 16, fontWeight: '600' },
    input: { width: '100%', padding: '16px', borderRadius: 14, background: '#1C1C1E', border: '1px solid #2C2C2E', color: '#fff', fontSize: 16, marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
    primaryBtn: { width: '100%', padding: '16px', borderRadius: 14, background: '#007AFF', color: '#fff', fontWeight: '700', fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 12 },
    secondaryBtn: { width: '100%', padding: '16px', borderRadius: 14, background: '#2C2C2E', color: '#fff', fontWeight: '600', fontSize: 16, border: 'none', cursor: 'pointer' },
    accountCard: { background: '#1C1C1E', borderRadius: 22, padding: 20, marginBottom: 16 },
    accRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #2C2C2E' },
    accLabel: { color: '#8E8E93', fontSize: 14 },
    accValue: { color: '#fff', fontSize: 16, fontWeight: '600' }
  };

  // 📱 ЭКРАНЫ
  if (screen === 'operations') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Все операции</span>
            <div style={{width: 24}} />
          </div>
          <div style={s.list}>
            {operations.map(op => (
              <div key={op.id} style={s.opItem}>
                <div style={s.opInfo}>
                  <span style={s.opTitle}>{op.title}</span>
                  <span style={s.opDate}>{op.date}</span>
                </div>
                <span style={{...s.opAmount, color: op.amount > 0 ? '#34C759' : '#FF453A'}}>
                  {op.amount > 0 ? '+' : ''}{fmt(op.amount, op.currency)}
                </span>
              </div>
            ))}
          </div>
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
          <input style={s.input} placeholder="ID или ник получателя" value={transferTarget} onChange={e => setTransferTarget(e.target.value)} />
          <input style={s.input} placeholder="Сумма (₽)" type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
          <button style={s.primaryBtn} onClick={handleTransfer}>Перевести</button>
          <button style={s.secondaryBtn} onClick={() => setScreen('main')}>Отмена</button>
        </div>
      </div>
    );
  }

  if (screen === 'account') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Мой Б/С</span>
            <div style={{width: 24}} />
          </div>
          <div style={s.accountCard}>
            <div style={s.accRow}><span style={s.accLabel}>Счет RUB</span><span style={s.accValue}>{fmt(bankRub, '₽')}</span></div>
            <div style={s.accRow}><span style={s.accLabel}>Счет USD</span><span style={s.accValue}>{fmt(bankUsd, '$')}</span></div>
            <div style={s.accRow}><span style={s.accLabel}>Кошелек RUB</span><span style={s.accValue}>{fmt(rubBalance, '₽')}</span></div>
            <div style={{...s.accRow, borderBottom: 'none'}}><span style={s.accLabel}>Кошелек USD</span><span style={s.accValue}>{fmt(balance, '$')}</span></div>
          </div>
          <button style={s.secondaryBtn} onClick={() => setScreen('main')}>Назад</button>
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
            <span style={s.nickname}>Обмен валюты</span>
            <div style={{width: 24}} />
          </div>
          <div style={{background: '#1C1C1E', borderRadius: 22, padding: 20, marginBottom: 20, textAlign: 'center'}}>
            <span style={{color: '#8E8E93', fontSize: 13}}>Курс ЦБ</span>
            <div style={{fontSize: 28, fontWeight: '800', color: '#fff', margin: '8px 0'}}>1 $ = 95 ₽</div>
          </div>
          <input style={s.input} placeholder="Сумма в ₽" type="number" value={exchangeAmount} onChange={e => setExchangeAmount(e.target.value)} />
          <button style={s.primaryBtn} onClick={handleExchange}>Обменять ₽ на $</button>
          <button style={s.secondaryBtn} onClick={() => setScreen('main')}>Отмена</button>
        </div>
      </div>
    );
  }

  // 🏦 ГЛАВНЫЙ ЭКРАН БАНКА
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.container} onClick={e => e.stopPropagation()}>
        {/* Шапка */}
        <div style={s.header}>
          <button onClick={onClose} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
          <div style={s.userSection}>
            <div style={s.avatar}>Р</div>
            <span style={s.nickname}>Роман</span>
          </div>
          <div style={{width: 24}} />
        </div>

        {/* Верхние блоки */}
        <div style={s.topGrid}>
          <button style={s.actionBlock} onClick={() => setScreen('operations')}>
            <span style={s.blockTitle}>Все операции</span>
            <span style={s.blockSub}>Трат за месяц: {monthlySpend} ₽</span>
            <div style={s.progressBar}><div style={s.progressFill} /></div>
          </button>
          <div style={s.infoBlock}>
            <span style={s.blockTitle}>Покупай VIP</span>
            <span style={s.blockSub}>в донат магазине</span>
          </div>
        </div>

        {/* Средние кнопки */}
        <div style={s.middleGrid}>
          <button style={s.midBtn} onClick={() => setScreen('transfer')}>
            <ArrowUpRight size={20} color="#007AFF" />
            <span style={s.midBtnText}>Перевести</span>
          </button>
          <button style={s.midBtn} onClick={() => setScreen('account')}>
            <Wallet size={20} color="#34C759" />
            <span style={s.midBtnText}>Мой Б/С</span>
          </button>
          <button style={s.midBtn} onClick={() => setScreen('exchange')}>
            <Repeat size={20} color="#AF52DE" />
            <span style={s.midBtnText}>Обменять</span>
          </button>
        </div>

        {/* Карточка-кошелек (перелистывается) */}
        <div style={s.cardWrapper} onClick={() => setCardSide(cardSide === 'rub' ? 'usd' : 'rub')}>
          <div style={s.cardContent}>
            <div style={s.cardTop}>
              <div style={s.currencyIcon}>{cardSide === 'rub' ? '₽' : '$'}</div>
              <span style={s.cardBalance}>
                {cardSide === 'rub' ? fmt(rubBalance, '₽') : fmt(balance, '$')}
              </span>
              <MoreVertical size={20} color="#666" style={{marginLeft: 'auto'}} />
            </div>
            <span style={s.cardLabel}>Black WSP</span>
            <div style={s.miniCard} />
          </div>
        </div>

        <div style={{textAlign: 'center', color: '#666', fontSize: 12, marginTop: 8}}>
          Нажмите на карту, чтобы переключить валюту
        </div>
      </div>
    </div>
  );
};