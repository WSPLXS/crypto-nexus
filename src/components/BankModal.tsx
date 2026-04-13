import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowUpRight, ArrowDownLeft, Repeat, Wallet, MoreVertical, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userNickname: string;
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
  isOpen, onClose, userId, userNickname, balance, rubBalance, bankUsd, bankRub,
  onBalanceUpdate, onBankUpdate
}) => {
  if (!isOpen) return null;

  const [screen, setScreen] = useState<'main' | 'operations' | 'transfer' | 'account' | 'exchange'>('main');
  
  // Transfer States
  const [transferCurrency, setTransferCurrency] = useState<'usd' | 'rub'>('usd');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  
  // Exchange States
  const [exchangeMode, setExchangeMode] = useState<'buy' | 'sell'>('buy'); // 'buy' = RUB->USD, 'sell' = USD->RUB
  const [exchangeAmount, setExchangeAmount] = useState('');

  // Account States
  const [accountCurrency, setAccountCurrency] = useState<'usd' | 'rub'>('usd');
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [loading, setLoading] = useState(false);

  // Курс обмена: 1$ = 80₽
  const EXCHANGE_RATE = 80;

  // Загрузка транзакций при открытии экрана операций
  useEffect(() => {
    if (isOpen && screen === 'operations') {
      loadTransactions();
    }
  }, [isOpen, screen]);

  const loadTransactions = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) {
        setTransactions(data);
        // Считаем траты за месяц (только исходящие)
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthTxs = data.filter(t => 
          t.sender_id === userId && 
          new Date(t.created_at) > monthAgo
        );
        const total = monthTxs.reduce((sum, t) => sum + t.amount, 0);
        setMonthlySpend(total);
      }
    } catch (err) {
      console.error('Load transactions error:', err);
    }
  };

  const fmt = (n: number, curr: string) => 
    `${n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ${curr}`;

  // --- ЛОГИКА ПЕРЕВОДА ---
  const handleTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return alert('Введите сумму');
    if (!transferTarget.trim()) return alert('Введите никнейм получателя');

    setLoading(true);
    try {
      // Ищем получателя по никнейму
      const { data: targetUser } = await supabase
        .from('users')
        .select('id, nickname, balance, rub_balance')
        .ilike('nickname', transferTarget.trim())
        .neq('id', userId)
        .single();

      if (!targetUser) {
        alert('Пользователь не найден!');
        setLoading(false);
        return;
      }

      const currentBalance = transferCurrency === 'usd' ? balance : rubBalance;
      const colName = transferCurrency === 'usd' ? 'balance' : 'rub_balance';
      const currency = transferCurrency === 'usd' ? 'USD' : 'RUB';

      if (amt > currentBalance) {
        alert(`Недостаточно средств!`);
        setLoading(false);
        return;
      }

      // Снимаем у отправителя
      await supabase.from('users').update({ [colName]: currentBalance - amt }).eq('id', userId);
      
      // Начисляем получателю
      const targetCurrent = targetUser[colName] || 0;
      await supabase.from('users').update({ [colName]: targetCurrent + amt }).eq('id', targetUser.id);
      
      // Логируем транзакцию
      await supabase.from('transactions').insert({
        sender_id: userId,
        receiver_id: targetUser.id,
        amount: amt,
        currency: currency
      });

      // Обновляем локально
      if (transferCurrency === 'usd') onBalanceUpdate(balance - amt, rubBalance);
      else onBalanceUpdate(balance, rubBalance - amt);

      alert(`✅ Переведено ${amt}${transferCurrency === 'usd' ? '$' : '₽'} игроку ${targetUser.nickname}!`);
      setTransferAmount(''); setTransferTarget(''); setScreen('main');
    } catch (err: any) {
      alert('Ошибка перевода: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ЛОГИКА ОБМЕНА ---
  const handleExchange = () => {
    const amt = parseFloat(exchangeAmount);
    if (!amt || amt <= 0) return alert('Введите сумму');

    if (exchangeMode === 'buy') {
      // Покупаем USD (тратим RUB)
      if (amt > rubBalance) return alert('Недостаточно рублей');
      const usdGot = amt / EXCHANGE_RATE;
      onBalanceUpdate(balance + usdGot, rubBalance - amt);
      alert(`✅ Обменяно ${amt}₽ на ${usdGot.toFixed(4)}$`);
    } else {
      // Продаем USD (получаем RUB)
      if (amt > balance) return alert('Недостаточно долларов');
      const rubGot = amt * EXCHANGE_RATE;
      onBalanceUpdate(balance - amt, rubBalance + rubGot);
      alert(`✅ Обменяно ${amt}$ на ${rubGot}₽`);
    }
    setExchangeAmount('');
  };

  // --- ЛОГИКА СЧЕТА ---
  const handleWithdraw = () => {
    const amt = parseFloat(prompt('Сколько снять?') || '0');
    if (!amt || amt <= 0) return;
    const current = accountCurrency === 'usd' ? bankUsd : bankRub;
    if (amt > current) return alert('Недостаточно средств на счете');
    
    onBankUpdate(
      accountCurrency === 'usd' ? bankUsd - amt : bankUsd,
      accountCurrency === 'rub' ? bankRub - amt : bankRub
    );
    onBalanceUpdate(
      accountCurrency === 'usd' ? balance + amt : balance,
      accountCurrency === 'rub' ? rubBalance + amt : rubBalance
    );
    alert(`✅ Снято ${amt}${accountCurrency === 'usd' ? '$' : '₽'}`);
  };

  const handleDeposit = () => {
    const amt = parseFloat(prompt('Сколько пополнить?') || '0');
    if (!amt || amt <= 0) return;
    const current = accountCurrency === 'usd' ? balance : rubBalance;
    if (amt > current) return alert('Недостаточно средств на кошельке');
    
    onBalanceUpdate(
      accountCurrency === 'usd' ? balance - amt : balance,
      accountCurrency === 'rub' ? rubBalance - amt : rubBalance
    );
    onBankUpdate(
      accountCurrency === 'usd' ? bankUsd + amt : bankUsd,
      accountCurrency === 'rub' ? bankRub + amt : bankRub
    );
    alert(`✅ Пополнено ${amt}${accountCurrency === 'usd' ? '$' : '₽'}`);
  };

  // 🎨 СТИЛИ
  const s: any = {
    overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 9999, overflowY: 'auto' },
    container: { maxWidth: 420, margin: '0 auto', padding: '16px 16px 40px', minHeight: '100vh' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    backBtn: { background: 'none', border: 'none', padding: 8, cursor: 'pointer' },
    userSection: { display: 'flex', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
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
    list: { display: 'flex', flexDirection: 'column', gap: 12 },
    opItem: { background: '#1C1C1E', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    opInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
    opTitle: { fontSize: 16, fontWeight: '500', color: '#fff' },
    opDate: { fontSize: 13, color: '#8E8E93' },
    opAmount: { fontSize: 16, fontWeight: '600' },
    input: { width: '100%', padding: '16px', borderRadius: 14, background: '#1C1C1E', border: '1px solid #2C2C2E', color: '#fff', fontSize: 16, marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
    primaryBtn: { width: '100%', padding: '16px', borderRadius: 14, background: '#FFD60A', color: '#000', fontWeight: '700', fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 12 },
    secondaryBtn: { width: '100%', padding: '16px', borderRadius: 14, background: '#2C2C2E', color: '#fff', fontWeight: '600', fontSize: 16, border: 'none', cursor: 'pointer' },
    accountCard: { background: '#1C1C1E', borderRadius: 22, padding: 20, marginBottom: 16 },
    accRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #2C2C2E' },
    accLabel: { color: '#8E8E93', fontSize: 14 },
    accValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
    currencySwitcher: { display: 'flex', background: '#2C2C2E', borderRadius: 12, padding: 4, marginBottom: 16 },
    switchBtn: { flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'transparent', color: '#8E8E93', fontWeight: '600', cursor: 'pointer' },
    switchBtnActive: { background: '#007AFF', color: '#fff' },
    transferCard: { background: '#1C1C1E', borderRadius: 22, padding: 20, marginBottom: 20, position: 'relative', overflow: 'hidden' },
    dots: { position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 },
    dot: { width: 6, height: 6, borderRadius: '50%', background: '#666' },
    dotActive: { background: '#FFD60A' }
  };

  // --- ЭКРАН ОПЕРАЦИЙ ---
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
            {transactions.length === 0 ? (
              <div style={{textAlign: 'center', color: '#8E8E93', padding: 40}}>Нет операций</div>
            ) : (
              transactions.map((tx: any) => {
                const isOut = tx.sender_id === userId;
                const amount = isOut ? -tx.amount : tx.amount;
                const color = isOut ? '#FF453A' : '#34C759';
                const title = isOut ? 'Перевод/Оплата' : 'Пополнение';
                const date = new Date(tx.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={tx.id} style={s.opItem}>
                    <div style={s.opInfo}>
                      <span style={s.opTitle}>{title}</span>
                      <span style={s.opDate}>{date}</span>
                    </div>
                    <span style={{...s.opAmount, color}}>
                      {amount > 0 ? '+' : ''}{fmt(amount, tx.currency)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ЭКРАН ПЕРЕВОДА ---
  if (screen === 'transfer') {
    const currentBalance = transferCurrency === 'usd' ? balance : rubBalance;
    const currency = transferCurrency === 'usd' ? '$' : '₽';
    
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Перевод</span>
            <div style={{width: 24}} />
          </div>

          <div style={s.transferCard}>
            <div style={s.cardTop}>
              <div style={s.currencyIcon}>{currency}</div>
              <div style={{flex: 1}}>
                <div style={s.cardBalance}>{fmt(currentBalance, currency)}</div>
                <div style={s.cardLabel}>Доступно</div>
              </div>
              <div style={s.dots}>
                <div style={{...s.dot, ...(transferCurrency === 'usd' ? s.dotActive : {})}} />
                <div style={{...s.dot, ...(transferCurrency === 'rub' ? s.dotActive : {})}} />
              </div>
            </div>
          </div>

          <div style={s.currencySwitcher}>
            <button 
              style={{...s.switchBtn, ...(transferCurrency === 'usd' ? s.switchBtnActive : {})}}
              onClick={() => setTransferCurrency('usd')}
            >
              Доллары ($)
            </button>
            <button 
              style={{...s.switchBtn, ...(transferCurrency === 'rub' ? s.switchBtnActive : {})}}
              onClick={() => setTransferCurrency('rub')}
            >
              Рубли (₽)
            </button>
          </div>

          <input style={s.input} placeholder="Никнейм получателя" value={transferTarget} onChange={e => setTransferTarget(e.target.value)} />
          <input style={s.input} placeholder={`Сумма (${currency})`} type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
          <button style={s.primaryBtn} onClick={handleTransfer} disabled={loading}>
            {loading ? '⏳ Отправка...' : 'Перевести'}
          </button>
          <button style={s.secondaryBtn} onClick={() => setScreen('main')}>Отмена</button>
        </div>
      </div>
    );
  }

  // --- ЭКРАН БАНКОВСКОГО СЧЕТА ---
  if (screen === 'account') {
    const currentBank = accountCurrency === 'usd' ? bankUsd : bankRub;
    const currency = accountCurrency === 'usd' ? '$' : '₽';
    
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Банковский счет</span>
            <div style={{width: 24}} />
          </div>

          <div style={s.currencySwitcher}>
            <button 
              style={{...s.switchBtn, ...(accountCurrency === 'usd' ? s.switchBtnActive : {})}}
              onClick={() => setAccountCurrency('usd')}
            >
              USD
            </button>
            <button 
              style={{...s.switchBtn, ...(accountCurrency === 'rub' ? s.switchBtnActive : {})}}
              onClick={() => setAccountCurrency('rub')}
            >
              RUB
            </button>
          </div>

          <div style={s.accountCard}>
            <div style={{...s.accRow, borderBottom: 'none'}}>
              <span style={s.accLabel}>Счет {currency}</span>
              <span style={{...s.accValue, fontSize: 24, fontWeight: '800'}}>{fmt(currentBank, currency)}</span>
            </div>
          </div>

          <button style={s.primaryBtn} onClick={handleWithdraw}>
            <ArrowDownLeft size={20} style={{display: 'inline', marginRight: 8, verticalAlign: 'middle'}}/>
            Снять
          </button>
          <button style={s.secondaryBtn} onClick={handleDeposit}>
            <ArrowUpRight size={20} style={{display: 'inline', marginRight: 8, verticalAlign: 'middle'}}/>
            Пополнить
          </button>
          <button style={{...s.secondaryBtn, marginTop: 12}} onClick={() => setScreen('main')}>
            Назад
          </button>
        </div>
      </div>
    );
  }

  // --- ЭКРАН ОБМЕНА ---
  if (screen === 'exchange') {
    const isBuy = exchangeMode === 'buy';
    const currentBalance = isBuy ? rubBalance : balance;
    const inputCurrency = isBuy ? '₽' : '$';
    const outputCurrency = isBuy ? '$' : '₽';
    const rateText = isBuy ? `1 $ = ${EXCHANGE_RATE} ₽` : `1 $ = ${EXCHANGE_RATE} ₽`;
    
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Обмен валюты</span>
            <div style={{width: 24}} />
          </div>

          {/* Переключатель направления */}
          <div style={s.currencySwitcher}>
            <button 
              style={{...s.switchBtn, ...(isBuy ? s.switchBtnActive : {})}}
              onClick={() => { setExchangeMode('buy'); setExchangeAmount(''); }}
            >
              RUB → USD
            </button>
            <button 
              style={{...s.switchBtn, ...(!isBuy ? s.switchBtnActive : {})}}
              onClick={() => { setExchangeMode('sell'); setExchangeAmount(''); }}
            >
              USD → RUB
            </button>
          </div>

          <div style={{background: '#1C1C1E', borderRadius: 22, padding: 20, marginBottom: 20, textAlign: 'center'}}>
            <span style={{color: '#8E8E93', fontSize: 13}}>Курс обмена</span>
            <div style={{fontSize: 28, fontWeight: '800', color: '#fff', margin: '8px 0'}}>
              {rateText}
            </div>
          </div>

          <div style={{marginBottom: 8, color: '#8E8E93', fontSize: 13, textAlign: 'right'}}>
            Баланс: {fmt(currentBalance, inputCurrency)}
          </div>
          
          <input 
            style={s.input} 
            placeholder={`Сумма ${inputCurrency}`} 
            type="number" 
            value={exchangeAmount} 
            onChange={e => setExchangeAmount(e.target.value)} 
          />
          
          <button style={s.primaryBtn} onClick={handleExchange}>
            Обменять {inputCurrency} на {outputCurrency}
          </button>
          <button style={s.secondaryBtn} onClick={() => setScreen('main')}>Отмена</button>
        </div>
      </div>
    );
  }

  // --- ГЛАВНЫЙ ЭКРАН БАНКА ---
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.container} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <button onClick={onClose} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
          <div style={s.userSection}>
            <div style={s.avatar}>{userNickname?.[0]?.toUpperCase() || 'U'}</div>
            <span style={s.nickname}>{userNickname}</span>
          </div>
          <div style={{width: 24}} />
        </div>

        <div style={s.topGrid}>
          <button style={s.actionBlock} onClick={() => setScreen('operations')}>
            <span style={s.blockTitle}>Все операции</span>
            <span style={s.blockSub}>Трат за месяц: {fmt(monthlySpend, '₽')}</span>
            <div style={s.progressBar}><div style={s.progressFill} /></div>
          </button>
          <div style={s.infoBlock}>
            <span style={s.blockTitle}>Покупай VIP</span>
            <span style={s.blockSub}>в донат магазине</span>
          </div>
        </div>

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

        <div style={s.cardWrapper} onClick={() => {}}>
          <div style={s.cardContent}>
            <div style={s.cardTop}>
              <div style={s.currencyIcon}>₽</div>
              <span style={s.cardBalance}>{fmt(rubBalance, '₽')}</span>
              <MoreVertical size={20} color="#666" style={{marginLeft: 'auto'}} />
            </div>
            <span style={s.cardLabel}>Black WSP</span>
            <div style={s.miniCard} />
          </div>
        </div>
      </div>
    </div>
  );
};